import os
import json
import time
import requests
import boto3
from datetime import datetime
from typing import Annotated, List, Optional, Union

from pydantic import (
    BaseModel,
    ConfigDict,
    RootModel,
    StringConstraints,
    ValidationError,
)

# --- Untappd API Config ---
CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
UNTAPPD_USERNAME = os.environ.get("UNTAPPD_USERNAME")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")

# Only initialize boto3 client if S3_BUCKET_NAME is set, allowing local testing without AWS
s3 = boto3.client("s3") if S3_BUCKET_NAME else None

STEP = 50  # number of items per API call
THROTTLE = 0.2  # seconds delay between calls to avoid hitting rate limit


# --- Schema validation ---
# Strict schemas for every payload this pipeline writes. The frontend reads many
# of these fields without guarding (see src/app/core/models and
# e2e/fixture-integrity.spec.ts), so an upstream API change or a truncated
# response must fail here instead of silently overwriting the deployed JSON.
# Unknown keys are allowed so new Untappd fields pass through untouched, but
# required fields and their types are enforced.
NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ValidationAbort(RuntimeError):
    """Raised when a fetched payload does not match its expected schema."""


class _Schema(BaseModel):
    model_config = ConfigDict(extra="allow")


# --- beers_all.json ---
class BeerLocation(_Schema):
    # The map and beer-history pages read these without guarding.
    lat: float
    lng: float
    brewery_state: NonEmptyStr
    brewery_city: Optional[str] = None


class BeerBrewery(_Schema):
    brewery_name: NonEmptyStr
    country_name: NonEmptyStr
    location: BeerLocation
    brewery_id: Optional[int] = None
    brewery_label: Optional[str] = None


class BeerBeer(_Schema):
    bid: int
    beer_name: NonEmptyStr
    beer_style: NonEmptyStr
    beer_abv: float
    beer_label: Optional[str] = None
    beer_slug: Optional[str] = None
    beer_description: Optional[str] = None


class BeerHistoryItem(_Schema):
    beer: BeerBeer
    brewery: BeerBrewery
    rating_score: float
    count: int
    recent_created_at: NonEmptyStr
    first_created_at: NonEmptyStr
    recent_checkin_id: Optional[int] = None


class BeersAllFile(_Schema):
    beers: List[BeerHistoryItem]


# --- checkins.json ---
class CheckinBeer(_Schema):
    bid: int
    beer_name: NonEmptyStr
    beer_style: NonEmptyStr
    beer_label: Optional[str] = None
    beer_slug: Optional[str] = None


class CheckinLocation(_Schema):
    lat: float
    lng: float
    brewery_state: Optional[str] = None
    brewery_city: Optional[str] = None


class CheckinBrewery(_Schema):
    brewery_id: int
    brewery_name: NonEmptyStr
    country_name: NonEmptyStr
    brewery_label: Optional[str] = None
    # Live Untappd exports omit `location` on some older/homebrew check-ins.
    location: Optional[CheckinLocation] = None
    contact: Optional[dict] = None


class CheckinBadge(_Schema):
    badge_name: NonEmptyStr
    badge_description: Optional[str] = None
    badge_image: Optional[Union[str, dict]] = None


class CheckinBadges(_Schema):
    items: List[CheckinBadge] = []


class CheckinPhoto(_Schema):
    photo_img_sm: Optional[str] = None
    photo_img_md: Optional[str] = None
    photo_img_lg: Optional[str] = None
    photo_img_og: Optional[str] = None


class CheckinMediaItem(_Schema):
    photo: CheckinPhoto


class CheckinMedia(_Schema):
    count: Optional[int] = None
    items: List[CheckinMediaItem] = []


class CheckinVenue(_Schema):
    venue_id: int
    venue_name: Optional[str] = None


class CheckinItem(_Schema):
    checkin_id: int
    created_at: NonEmptyStr
    rating_score: float
    beer: CheckinBeer
    brewery: CheckinBrewery
    checkin_comment: Optional[str] = None
    badges: Optional[CheckinBadges] = None
    media: Optional[CheckinMedia] = None
    venue: Optional[CheckinVenue] = None


class CheckinItems(_Schema):
    items: List[CheckinItem]


class CheckinResponse(_Schema):
    checkins: CheckinItems


class CheckinsFile(_Schema):
    response: CheckinResponse


# --- badges.json ---
class BadgeMedia(_Schema):
    badge_image_sm: NonEmptyStr


class BadgeItem(_Schema):
    badge_name: NonEmptyStr
    earned_at: NonEmptyStr
    media: BadgeMedia
    badge_description: Optional[str] = None


class BadgesFile(RootModel[List[BadgeItem]]):
    pass


# --- wishlist.json ---
class WishlistBeer(_Schema):
    bid: int
    beer_name: NonEmptyStr
    beer_style: NonEmptyStr
    beer_label: Optional[str] = None
    beer_slug: Optional[str] = None
    beer_description: Optional[str] = None
    beer_abv: Optional[float] = None


class WishlistBrewery(_Schema):
    brewery_name: NonEmptyStr
    brewery_id: Optional[int] = None
    brewery_label: Optional[str] = None
    country_name: Optional[str] = None


class WishlistItem(_Schema):
    beer: WishlistBeer
    brewery: WishlistBrewery
    created_at: Optional[str] = None


class WishlistBeers(_Schema):
    items: List[WishlistItem]


class WishlistResponse(_Schema):
    beers: WishlistBeers


class WishlistFile(_Schema):
    response: WishlistResponse


# --- stats.json ---
class StatsFile(_Schema):
    totalCheckins: int
    averageRating: float
    countriesTried: int
    breweriesVisited: int
    lastUpdated: NonEmptyStr


def validate_payload(model, data, label):
    """Validate a payload against its schema, aborting with field-level detail.

    Returns the validated model on success. Raises ``ValidationAbort`` with a
    human-readable list of the failing fields when the payload does not match,
    so the caller can skip the write/upload instead of corrupting live data.
    """
    try:
        return model.model_validate(data)
    except ValidationError as err:
        details = "; ".join(
            f"{'.'.join(str(part) for part in error['loc']) or '<root>'}: {error['msg']}"
            for error in err.errors()
        )
        raise ValidationAbort(
            f"Schema validation failed for {label} "
            f"({err.error_count()} problem(s)): {details}"
        ) from err


def fetch_untappd_data(endpoint, params=None):
    """Fetch JSON from Untappd API with retries for transient issues/rate limits."""
    url = f"https://api.untappd.com/v4/{endpoint}"
    if params is None:
        params = {}

    print(f"Fetching: {url} with query params keys: {list(params.keys())}")
    request_params = {**params, "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET}

    max_retries = 3
    backoff = 2
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=request_params, timeout=15)
            if response.status_code == 429:
                print(f"Rate limit hit (429) on attempt {attempt + 1}. Retrying in {backoff} seconds...")
                time.sleep(backoff)
                backoff *= 2
                continue
            response.raise_for_status()

            try:
                return response.json()
            except ValueError as json_err:
                print(f"Failed to parse JSON payload on attempt {attempt + 1}: {json_err}")
                if attempt < max_retries - 1:
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                raise
        except requests.exceptions.HTTPError as http_err:
            status_code = getattr(response, "status_code", None)
            print(f"HTTP error occurred on attempt {attempt + 1} (status: {status_code}): {http_err}")
            if status_code in [429, 500, 502, 503, 504] and attempt < max_retries - 1:
                print(f"Transient error ({status_code}). Retrying in {backoff} seconds...")
                time.sleep(backoff)
                backoff *= 2
            else:
                raise
        except requests.exceptions.RequestException as req_err:
            print(f"Request exception occurred on attempt {attempt + 1}: {req_err}")
            if attempt < max_retries - 1:
                print(f"Retrying connection in {backoff} seconds...")
                time.sleep(backoff)
                backoff *= 2
            else:
                raise


def save_json(filename, data):
    """Save JSON to S3 or locally if running on a dev box without S3 config."""
    if not S3_BUCKET_NAME or not s3:
        print(f"Warning: S3_BUCKET_NAME not set. Skipping S3 upload for {filename}")
        local_dir = "src/assets/data"
        if os.path.exists(local_dir):
            filepath = os.path.join(local_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Saved {filename} locally to {filepath}")
        return

    s3.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=filename,
        Body=json.dumps(data),
        ContentType="application/json"
    )
    print(f"Uploaded {filename} to S3 bucket {S3_BUCKET_NAME}")


def get_all_beers():
    """Fetch all distinct beers for the user."""
    all_beers = []
    offset = 0
    while True:
        res = fetch_untappd_data(f"user/beers/{UNTAPPD_USERNAME}", {"limit": STEP, "offset": offset})
        if not isinstance(res, dict):
            break
        beers_batch = res.get("response", {}).get("beers", {}).get("items", [])
        if not beers_batch:
            break
        all_beers.extend(beers_batch)
        offset += STEP
        time.sleep(THROTTLE)
        if len(beers_batch) < STEP:
            break
    print(f"Fetched {len(all_beers)} beers")
    return all_beers


def get_all_badges():
    """Fetch all badges for the user."""
    all_badges = []
    offset = 0
    while True:
        res = fetch_untappd_data(f"user/badges/{UNTAPPD_USERNAME}", {"limit": STEP, "offset": offset})
        if not isinstance(res, dict):
            break
        badges_batch = res.get("response", {}).get("items", [])
        if not badges_batch:
            break
        all_badges.extend(badges_batch)
        offset += STEP
        time.sleep(THROTTLE)
        if len(badges_batch) < STEP:
            break
    print(f"Fetched {len(all_badges)} badges")
    return all_badges


def get_checkins():
    """Fetch recent checkins."""
    res = fetch_untappd_data(f"user/checkins/{UNTAPPD_USERNAME}", {"limit": STEP})
    print("Fetched checkins")
    return res if isinstance(res, dict) else {}


def get_wishlist():
    """Fetch wishlist items."""
    res = fetch_untappd_data(f"user/wishlist/{UNTAPPD_USERNAME}")
    print("Fetched wishlist")
    return res if isinstance(res, dict) else {}


def compute_stats(beers):
    """Compute summary stats for front-end, aligned with StatsService.ts."""
    if not beers or not isinstance(beers, list):
        return {
            "totalCheckins": 0,
            "averageRating": 0.0,
            "countriesTried": 0,
            "breweriesVisited": 0,
            "lastUpdated": datetime.now().isoformat()
        }

    total_checkins = sum((b.get("count") or 1) for b in beers if isinstance(b, dict))

    # Weighted average rating: (rating * checkins) / total_checkins
    total_weighted_rating = sum(
        ((b.get("rating_score") or 0) * (b.get("count") or 1))
        for b in beers
        if isinstance(b, dict)
    )
    avg_rating = total_weighted_rating / (total_checkins or 1)

    countries = {
        b["brewery"].get("country_name")
        for b in beers
        if isinstance(b, dict) and isinstance(b.get("brewery"), dict) and b["brewery"].get("country_name")
    }
    breweries = {
        b["brewery"].get("brewery_name")
        for b in beers
        if isinstance(b, dict) and isinstance(b.get("brewery"), dict) and b["brewery"].get("brewery_name")
    }

    return {
        "totalCheckins": total_checkins,
        "averageRating": round(avg_rating, 2),
        "countriesTried": len(countries),
        "breweriesVisited": len(breweries),
        "lastUpdated": datetime.now().isoformat()
    }


def lambda_handler(event, context):
    print("Proactively validating environment credentials...")
    if not CLIENT_ID or not CLIENT_SECRET:
        print("Error: CLIENT_ID or CLIENT_SECRET environment variables are missing.")
        return {"statusCode": 500, "body": "CLIENT_ID or CLIENT_SECRET missing"}

    if not UNTAPPD_USERNAME:
        print("Error: UNTAPPD_USERNAME environment variable is missing.")
        return {"statusCode": 500, "body": "UNTAPPD_USERNAME missing"}

    if not S3_BUCKET_NAME:
        print("Warning: S3_BUCKET_NAME environment variable is missing. Will save data locally if directories exist.")

    print(f"Starting data fetch for Untappd user: {UNTAPPD_USERNAME}")

    try:
        # Fetch and validate each payload up front. Validation happens before any
        # write/upload, so a single invalid payload aborts the whole run and a
        # partial or changed API response cannot overwrite the live JSON files.
        beers_payload = {"beers": get_all_beers()}
        validate_payload(BeersAllFile, beers_payload, "beers_all.json")

        badges = get_all_badges()
        validate_payload(BadgesFile, badges, "badges.json")

        checkins = get_checkins()
        validate_payload(CheckinsFile, checkins, "checkins.json")

        wishlist = get_wishlist()
        validate_payload(WishlistFile, wishlist, "wishlist.json")

        stats = compute_stats(beers_payload["beers"])
        validate_payload(StatsFile, stats, "stats.json")

        print("Schema validation passed for all payloads.")

        # Persist the validated payloads.
        save_json("beers_all.json", beers_payload)
        save_json("badges.json", badges)
        save_json("checkins.json", checkins)
        save_json("wishlist.json", wishlist)
        save_json("stats.json", stats)

        print("Data fetch and processing completed successfully.")
        return {"statusCode": 200, "body": json.dumps("Success")}
    except ValidationAbort as e:
        print(f"Aborting run, no files were written: {e}")
        return {"statusCode": 500, "body": json.dumps(f"Validation failed: {e}")}
    except Exception as e:
        print(f"Critical error occurred during Lambda execution: {e}")
        return {"statusCode": 500, "body": json.dumps(f"Critical error: {e}")}


if __name__ == "__main__":
    lambda_handler(None, None)
