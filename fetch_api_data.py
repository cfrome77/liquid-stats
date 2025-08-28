import requests
import json
import os

from os.path import join, dirname
from dotenv import load_dotenv
 
dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path)
 
# Accessing variables.
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
USERNAME = os.getenv('USERNAME')

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
    with open('src/app/assets/beers.json', 'w') as outfile:
        json.dump({'beers': beers}, outfile)

def save_checkins_to_json(checkins):
    print('saving to checkins.json')
    with open('src/app/assets/checkins.json', 'w') as outfile:
        json.dump(checkins, outfile)

def save_badges_to_json(badges):
    print('saving to badges.json')
    with open('src/app/assets/badges.json', 'w') as outfile:
        json.dump(badges, outfile)

def save_wishlist_to_json(wishlist):
    print('saving to wishlist.json')
    with open('src/app/assets/wishlist.json', 'w') as outfile:
        json.dump(wishlist, outfile)

if __name__ == '__main__':
    beers = get_distinct_beers()
    save_beers_to_json(beers)
    badges = get_badges()
    save_badges_to_json(badges)
    checkins = get_checkins()
    save_checkins_to_json(checkins)
    wishlist = get_wishlist()
    save_wishlist_to_json(wishlist)
