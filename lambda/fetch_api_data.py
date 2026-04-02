import os
import json
import requests
import boto3
from datetime import datetime

# --- Untappd API Config ---
CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
UNTAPPD_USERNAME = os.environ.get("UNTAPPD_USERNAME")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")
USE_AWS = os.environ.get("USE_AWS", "false").lower() == "true"

def fetch_untappd_data(endpoint, params=None):
    base_url = "https://api.untappd.com/v4/"
    if params is None:
        params = {}
    params.update({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    })
    url = f"{base_url}{endpoint}"
    print(f"Fetching: {url}")
    # Local mock for sandbox if no API keys
    if not CLIENT_ID or not CLIENT_SECRET:
         return {"response": {"beers": {"items": []}, "items": []}}
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def save_json(filename, data):
    if USE_AWS and S3_BUCKET_NAME:
        s3 = boto3.client("s3")
        s3.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=filename,
            Body=json.dumps(data),
            ContentType="application/json"
        )
        print(f"Uploaded {filename} to S3 bucket {S3_BUCKET_NAME}")
    else:
        # Local save
        os.makedirs("data", exist_ok=True)
        filepath = os.path.join("data", filename)
        with open(filepath, "w") as f:
            json.dump(data, f)
        print(f"Saved {filename} locally to {filepath}")

def lambda_handler(event, context):
    if not UNTAPPD_USERNAME:
        print("Error: UNTAPPD_USERNAME not set")
        return {"statusCode": 500, "body": "UNTAPPD_USERNAME not set"}

    print(f"Starting data fetch for user: {UNTAPPD_USERNAME}")

    # 1. Fetch ALL Beers (Distinct)
    all_beers = []
    limit = 50
    offset = 0
    while True:
        res = fetch_untappd_data(f"user/beers/{UNTAPPD_USERNAME}", {"limit": limit, "offset": offset})
        beers_batch = res.get("response", {}).get("beers", {}).get("items", [])
        if not beers_batch:
            break
        all_beers.extend(beers_batch)
        if len(beers_batch) < limit:
            break
        offset += limit

    # 2. Generate Paginated and Combined Beer Files
    page_size = 25
    total_pages = (len(all_beers) + page_size - 1) // page_size

    # beers.json (First 25 for quick load)
    save_json("beers.json", {
        "beers": all_beers[:page_size],
        "page": 1,
        "total_pages": total_pages,
        "total_beers": len(all_beers)
    })

    # beers_page_{n}.json
    for i in range(total_pages):
        start = i * page_size
        end = start + page_size
        page_num = i + 1
        save_json(f"beers_page_{page_num}.json", {
            "beers": all_beers[start:end],
            "page": page_num,
            "total_pages": total_pages
        })

    # beers_all.json (For deep-dive components)
    save_json("beers_all.json", {"beers": all_beers})

    # 3. Compute Summary Stats for Home Page
    total_checkins = sum(b.get("count", 1) for b in all_beers)
    avg_rating = sum(b.get("rating_score", 0) for b in all_beers) / (len(all_beers) or 1)
    countries = set(b.get("brewery", {}).get("country_name") for b in all_beers if b.get("brewery"))
    breweries = set(b.get("brewery", {}).get("brewery_name") for b in all_beers if b.get("brewery"))

    stats = {
        "totalCheckins": total_checkins,
        "averageRating": round(avg_rating, 2),
        "countriesTried": len(countries),
        "breweriesVisited": len(breweries),
        "lastUpdated": datetime.now().isoformat()
    }
    save_json("stats.json", stats)

    # 4. Fetch Badges
    badges_res = fetch_untappd_data(f"user/badges/{UNTAPPD_USERNAME}", {"limit": 50})
    save_json("badges.json", badges_res.get("response", {}).get("items", []))

    # 5. Fetch Recent Checkins
    checkins_res = fetch_untappd_data(f"user/checkins/{UNTAPPD_USERNAME}", {"limit": 50})
    save_json("checkins.json", checkins_res)

    # 6. Fetch Wishlist
    wishlist_res = fetch_untappd_data(f"user/wishlist/{UNTAPPD_USERNAME}", {"limit": 50})
    save_json("wishlist.json", wishlist_res)

    print("Data fetch and processing completed.")
    return {
        "statusCode": 200,
        "body": json.dumps("Success")
    }

if __name__ == "__main__":
    # For local execution testing
    lambda_handler(None, None)
