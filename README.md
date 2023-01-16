# Liquid Stats

This project uses the Untappd api, and allows you to keep track of whats beers you have had, your top rated beers, badges you earned, and statics about your untappd checkins.

![Node CI](https://github.com/cfrome77/liquid-stats/workflows/Node%20CI/badge.svg?branch=master)

## Usage

1 - The Untappd API requires that you register your application. Register your app [here](https://untappd.com/api/register?register=new). 

2 - run the following command to create a .env file: `cp .env.example .env`. Fill in the variables in the `.env` file with your `client_secret`, `client_id`, and `untappd username`. These variable will be read and used by the [`fetch_api_data.py`](fetch_api_data.py) file.

3 - The [`fetch_api_data.py`](fetch_api_data.py) script is used to fetch the data from the api and store it into local copies for faster retreval and to work around Untapp's 100 request per hour limit. [`fetch_api_data.py`](fetch_api_data.py) requires the `requests`, and `dotenv` packages to be installed using `pip` before any data can be pulled or an error will occur. To fetch the data run `python fetch_api_data.py`.

4 - In your terminal, run the command `npm install` to install the dependencies of the project.

5 - In your terminal, run the command `grunt` to create minified version of the javascript and css files.

## Authors

**Chris Frome** - [linkedin.com/in/cfrome77](https://www.linkedin.com/in/cfrome77)
