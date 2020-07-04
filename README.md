# Liquid Stats

This project uses the Untappd api, and allows you to keep track of whats beers you have had, your top rated beers, badges you earned, and statics about your untappd checkins.

## Usage

1 - The Untappd API requires that you register your application. Register your app [here](https://untappd.com/api/register?register=new). 

2 - run the following command to create a .env file: `cp .env.example .env`. Fill in the variables in the `.env` file with your `client_secret`, `client_id`, and `untappd username`. These variable will be read and used by the [`fetch_api_data.py`](fetch_api_data.py) file.

3 - The [`fetch_api_data.py`](fetch_api_data.py) script is used to fetch the data from the api and store it into local copies for faster retreval and to work around Untapp's 100 request per hour limit. [`fetch_api_data.py`](fetch_api_data.py) requires the `requests`, and `dotenv` packages to be installed using `pip` before any data can be pulled or an error will occur. To fetch the data run `python fetch_api_data.py`.

4 - In your terminal, run the command `npm install` to install the dependencies of the project.

5 - In your terminal, run the command `grunt` to create minified version of the javascript and css files.

6 - Open the [`checkins.html`](views/checkins.html), [`topbeers.html`](views/topbeers.html), [`badges.html`](views/badges.html), and [`wishlist.html`](views/wishlist.html) files and fill in the variable username with your username of Untappd:

```javascript
Untappd.init({
    template: $('#untappd-template').html(),  // The ID of your template
    container: $('#stream'),                  // domNode to attach to
    username: ''                              // Untappd username
});
```

You will also need to update the username in the footer href in [`badges.html`](views/badges.html). My username is used as a default value

5 - Run the command `npm start` to start server. This requires you to have installed `nodemon` using `npm install nodemon`.

## Customize Handlebars Template

1 - To customize the template open the [`checkins.html`](views/checkins.html), [`topbeers.html`](views/topbeers.html), and [`badges.html`](views/badges.html) file and look for the block of code in each .html file (other than stats) contianed inside the following script tag:

```javascript
<script id="untappd-template" type="text/x-handlebars-template">
</script>
```

Change the HTML as it deems necessary.

## Sources and Credits

I've modified code from Austin Lyons for the statistics page. You can find it [here](https://github.com/austinlyons/dcjs-leaflet-untappd)

I've modified code from pinceladasdaweb for the main list, top beers, badges, and wishlist. You can find it [here](https://github.com/pinceladasdaweb/Node-Untappd)

## Authors

**Chris Frome** - [linkedin.com/in/cfrome77](https://www.linkedin.com/in/cfrome77)
