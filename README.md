Liquid Stats
=================

This project uses the Untappd api, and allows you to keep track of whats beers you have had, your top rated beers, badges you earned, and statics about your untappd checkins.

##Usage

1 - The Untappd API require you register an application. Register your [here](https://untappd.com/api/register?register=new). The [`fetch_api_data.py`](fetch_api_data.py) script is used to fetch the data from the api and store it into local copies for faster retreval and to work around Untapp's 100 request per hour limit. you will need to fill in the Client ID and Client Secret variables in [`fetch_api_data.py`](fetch_api_data.py) inorder to retrieve your data.

2 - In your terminal, run the command `npm install` to install the dependencies of the project.

3 - In your terminal, run the command `grunt` to create minified version of the javascript and css files.

4 - Open the [`checkins.html`](views/checkins.html), [`topten.html`](views/topten.html), and [`badges.html`](views/badges.html) files and fill in the variable username with your username of Untappd:

```javascript
Untappd.init({
    template: $('#untappd-template').html(),  // The ID of your template
    container: $('#stream'),                  // domNode to attach to
    username: ''                              // Untappd username
});
```

You will also need to update the username in the foter href in [`badges.html`](views/badges.html). My username is used as a default value

5 - Run the command `npm start` to start server. This requires you to have installed `nodemon` using `npm install nodemon`.

##Customize Handlebars Template

1 - To customize the template open the [`checkins.html`](views/checkins.html), [`topten.html`](views/topten.html), and [`badges.html`](views/badges.html) file and look for the block of code in each .html file (other than stats) contianed inside the following script tag:

```javascript
<script id="untappd-template" type="text/x-handlebars-template">
</script>
```

Change the HTML as it deems necessary.

##Sources and Credits

I've modified code from Austin Lyons for the statistics page. You can find it [here](https://github.com/austinlyons/dcjs-leaflet-untappd)

I've modified code from pinceladasdaweb for the main list, top ten, and badges. You can find it [here](https://github.com/pinceladasdaweb/Node-Untappd)

##Authors

**Chris Frome** - [https://linkedin.com/in/cfrome77](linkedin.com/in/cfrome77)
