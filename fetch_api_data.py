import requests
import json

CLIENT_ID = '9D1D5E2329EEAAEF1D5B39AEE442056CF29024C6'
CLIENT_SECRET = '09AB95D20E59F28219519697B508E38E4681BF3F'
	
def get_distinct_beers():
    URL = 'https://api.untappd.com/v4/user/beers/fromeca'
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
        json = requests.get(URL, params=payload).json()
        data = json['response']['beers']
        beers.extend(data['items'])
        offset += STEP
        if data['count'] == 0 or data['count'] < STEP:
            break

    print('fetched data for {} beers'.format(len(beers)))
    return beers
	
def get_checkins():
    URL = 'https://api.untappd.com/v4/user/checkins/fromeca'
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    checkins_json = requests.get(URL, params=payload)
    
    return checkins_json.json()

def get_badges():
    URL = 'https://api.untappd.com/v4/user/badges/fromeca'
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    badges_json = requests.get(URL, params=payload)

    return badges_json.json()

def get_topten():
    URL = 'https://api.untappd.com/v4/user/beers/fromeca'
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    topten_json = requests.get(URL, params=payload)

    return topten_json.json()
	
def save_beers_to_json(beers):
    print('saving to beers.json')
    with open('public/beers.json', 'w') as outfile:
        json.dump({'beers': beers}, outfile)

def save_checkins_to_json(checkins):
    print('saving to checkins.json')
    with open('public/checkins.json', 'w') as outfile:
        json.dump(checkins, outfile)

def save_badges_to_json(badges):
    print('saving to badges.json')
    with open('public/badges.json', 'w') as outfile:
        json.dump(badges, outfile)

def save_topten_to_json(topten):
    print('saving to topbeers.json')
    with open('public/topbeers.json', 'w') as outfile:
        json.dump(topten, outfile)
		
if __name__ == '__main__':
    beers = get_distinct_beers()
    save_beers_to_json(beers)
    checkins = get_checkins()
    save_checkins_to_json(checkins)
    badges = get_badges()
    save_badges_to_json(badges)
    topten = get_topten()
    save_topten_to_json(topten)
