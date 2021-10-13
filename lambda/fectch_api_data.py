import requests
import json
import os
import boto3
import subprocess

from dotenv import load_dotenv
from subprocess import check_output, Popen, PIPE

load_dotenv()

# Accessing variables.
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
USERNAME = os.environ.get('USERNAME')
BUCKET_NAME = os.environ.get('BUCKET_NAME')


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


def save_beers_to_json(beers):
    print('saving to beers.json')
    s3.put_object(
        Body=json.dumps({'beers': beers}),
        Bucket=BUCKET_NAME,
        Key='beers.json'
    )

def save_checkins_to_json(checkins):
    print('saving to checkins.json')
    s3.put_object(
        Body=json.dumps(checkins),
        Bucket=BUCKET_NAME,
        Key='checkins.json'
    )


def save_badges_to_json(badges):
    print('saving to badges.json')
    s3.put_object(
        Body=json.dumps(badges),
        Bucket=BUCKET_NAME,
        Key='badges.json'
    )


def save_wishlist_to_json(wishlist):
    print('saving to wishlist.json')
    s3.put_object(
        Body=json.dumps(wishlist),
        Bucket=BUCKET_NAME,
        Key='wishlist.json'
    )


def lambda_handler(event, context):
    beers = get_distinct_beers()
    save_beers_to_json(beers)
    badges = get_badges()
    save_badges_to_json(badges)
    checkins = get_checkins()
    save_checkins_to_json(checkins)
    wishlist = get_wishlist()
    save_wishlist_to_json(wishlist)
