import requests
import json
import os

from os.path import join, dirname
from dotenv import load_dotenv

# Load environment variables
dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path)

# Accessing variables with default fallback
CLIENT_ID = os.environ.get('CLIENT_ID') or os.getenv('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET') or os.getenv('CLIENT_SECRET')
USERNAME = os.environ.get('UNTAPPD_USERNAME') or os.getenv('UNTAPPD_USERNAME')
BUCKET_NAME = os.environ.get('S3_BUCKET_NAME') or os.getenv('S3_BUCKET_NAME')

# Determine environment (AWS or local)
ENVIRONMENT = os.getenv('ENVIRONMENT', 'local')

if ENVIRONMENT == 'aws':
    import boto3
    s3 = boto3.client('s3')

def get_distinct_beers():
    URL = 'https://api.untappd.com/v4/user/beers/' + USERNAME
    STEP = 50
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'limit': STEP,
    }
    beers = []
    offset = 0
    while True:
        payload['offset'] = offset
        print('attempting to fetch {} - {}'.format(offset, offset + STEP))
        response = requests.get(URL, params=payload)
        json_data = json.loads(response.text)
        data = json_data['response']['beers']
        beers.extend(data['items'])
        offset += STEP
        if data['count'] == 0 or data['count'] < STEP:
            break

    print('fetched data for {} beers'.format(len(beers)))
    return beers

def get_checkins():
    URL = 'https://api.untappd.com/v4/user/checkins/' + USERNAME
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    checkins_json = requests.get(URL, params=payload)
    return checkins_json.json()

def get_badges():
    URL = 'https://api.untappd.com/v4/user/badges/' + USERNAME
    STEP = 50
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'limit': STEP,
    }
    badges = []
    offset = 0
    while True:
        payload['offset'] = offset
        print('attempting to fetch {} - {}'.format(offset, offset + STEP))
        response = requests.get(URL, params=payload)
        json_data = json.loads(response.text)
        data = json_data['response']
        badges.extend(data['items'])
        offset += STEP
        if data['count'] == 0 or data['count'] < STEP:
            break

    print('fetched data for {} badges'.format(len(badges)))
    return badges

def get_wishlist():
    URL = 'https://api.untappd.com/v4/user/wishlist/' + USERNAME
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    wishlist_json = requests.get(URL, params=payload)
    return wishlist_json.json()

def save_data_to_storage(data, filename):
    if ENVIRONMENT == 'aws':
        print(f'saving to {filename} (S3)')

        s3.put_object(
            Body=json.dumps(data),
            Bucket=BUCKET_NAME,
            Key=filename,
            Metadata={
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        )
    else:
        print(f'saving to {filename} (local)')
        with open(f'src/assets/{filename}', 'w') as outfile:
            json.dump(data, outfile)


def save_beers_to_json(beers):
    save_data_to_storage({'beers': beers}, 'beers.json')

def save_checkins_to_json(checkins):
    save_data_to_storage(checkins, 'checkins.json')

def save_badges_to_json(badges):
    save_data_to_storage(badges, 'badges.json')

def save_wishlist_to_json(wishlist):
    save_data_to_storage(wishlist, 'wishlist.json')

def lambda_handler(event, context):
    beers = get_distinct_beers()
    save_beers_to_json(beers)
    badges = get_badges()
    save_badges_to_json(badges)
    checkins = get_checkins()
    save_checkins_to_json(checkins)
    wishlist = get_wishlist()
    save_wishlist_to_json(wishlist)

if __name__ == '__main__':
    lambda_handler(None, None)  # Simulate Lambda call for local testing