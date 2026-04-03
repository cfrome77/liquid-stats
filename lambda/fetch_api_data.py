import os
import json
import time
import requests
import boto3
from datetime import datetime

# --- Untappd API Config ---
CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
UNTAPPD_USERNAME = os.environ.get("UNTAPPD_USERNAME")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")
s3 = boto3.client("s3")

STEP = 50  # number of items per API call
THROTTLE = 0.2  # seconds delay between calls to avoid hitting rate limit


def fetch_untappd_data(endpoint, params=None):
    """Fetch JSON from Untappd API."""
    url = f"https://api.untappd.com/v4/{endpoint}"
    if params is None:
        params = {}
    print(f"Fetching: {url} with params {params}")
    params.update({"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET})
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()


def save_json(filename, data):
    """Save JSON to S3."""
    if not S3_BUCKET_NAME:
        print(f"Warning: S3_BUCKET_NAME not set. Skipping save for {filename}")
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
    return res


def get_wishlist():
    """Fetch wishlist items."""
    res = fetch_untappd_data(f"user/wishlist/{UNTAPPD_USERNAME}")
    print("Fetched wishlist")
    return res


def compute_stats(beers):
    """Compute summary stats for front-end."""
    total_checkins = sum(b.get("count", 1) for b in beers)
    avg_rating = sum(b.get("rating_score", 0) for b in beers) / (len(beers) or 1)
    countries = set(b.get("brewery", {}).get("country_name") for b in beers if b.get("brewery"))
    breweries = set(b.get("brewery", {}).get("brewery_name") for b in beers if b.get("brewery"))
    return {
        "totalCheckins": total_checkins,
        "averageRating": round(avg_rating, 2),
        "countriesTried": len(countries),
        "breweriesVisited": len(breweries),
        "lastUpdated": datetime.now().isoformat()
    }


def lambda_handler(event, context):
    if not UNTAPPD_USERNAME:
        print("Error: UNTAPPD_USERNAME not set")
        return {"statusCode": 500, "body": "UNTAPPD_USERNAME not set"}
    if not S3_BUCKET_NAME:
        print("Error: S3_BUCKET_NAME not set")
        return {"statusCode": 500, "body": "S3_BUCKET_NAME not set"}

    print(f"Starting data fetch for {UNTAPPD_USERNAME}")

    # 1. Fetch all beers
    beers = get_all_beers()
    save_json("beers_all.json", {"beers": beers})

    # 2. Fetch all badges
    badges = get_all_badges()
    save_json("badges.json", badges)

    # 3. Fetch recent checkins
    checkins = get_checkins()
    save_json("checkins.json", checkins)

    # 4. Fetch wishlist
    wishlist = get_wishlist()
    save_json("wishlist.json", wishlist)

    # 5. Compute and save stats
    stats = compute_stats(beers)
    save_json("stats.json", stats)

    print("Data fetch and processing completed.")
    return {"statusCode": 200, "body": json.dumps("Success")}


if __name__ == "__main__":
    lambda_handler(None, None)
