"use strict";

var express  = require('express'),
    request  = require('request'),
    compress = require('compression'),
    route    = express.Router(),
    app      = express(),
    port     = process.env.PORT || 8080,
    pub      = __dirname;

app.use(compress({
    filter: function(req, res) {
        return (/json|text|javascript|css|image\/svg\+xml|application\/x-font-ttf/).test(res.getHeader('Content-Type'));
    },
    level: 9
}));

app.use(express.static(pub + '/public', {maxAge: 86400000}));

route.get('/', function (req, res) {
    res.sendFile(pub + "/views/index.html");
});

route.get('/about', function(req, res) {
    res.sendFile(pub + "/views/about.html"); 
});

route.get('/topten', function(req, res) {
    res.sendFile(pub + "/views/topten.html"); 
});

route.get('/mybadges', function(req, res) {
    res.sendFile(pub + "/views/badges.html"); 
});

route.get('/stats', function(req, res) {
    res.sendFile(pub + "/views/stats.html"); 
});

app.use('/', route);
app.use('/about', route);
app.use('/topten', route);
app.use('/mybadges', route);
app.use('/stats', route);

app.listen(port);
console.log('Your server goes on localhost:' + port);