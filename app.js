"use strict";

const express = require('express'),
    rateLimit = require("express-rate-limit"),
    compress = require('compression'),
    route = express.Router(),
    app = express(),
    port = process.env.PORT || 8080,
    pub = __dirname;

// Creating a limiter by calling rateLimit function with options:
// max contains the maximum number of request and windowMs 
// contains the time in millisecond so only max amount of 
// request can be made in windowMS time.
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many request from this IP"
});

// Add the limiter function to the express middleware
// so that every request coming from user passes 
// through this middleware.
app.use(limiter);

app.use(compress({
    filter: function (req, res) {
        return (/json|text|javascript|css|image\/svg\+xml|application\/x-font-ttf/).test(res.getHeader('Content-Type'));
    },
    level: 9
}));

app.use(express.static(pub + '/public', { maxAge: 86400000 }));

route.get('/', limiter, function (req, res) {
    res.sendFile(pub + "/views/index.html");
});

route.get('/checkins', limiter, function (req, res) {
    res.sendFile(pub + "/views/checkins.html");
});

route.get('/about', limiter, function (req, res) {
    res.sendFile(pub + "/views/about.html");
});

route.get('/topbeers', limiter, function (req, res) {
    res.sendFile(pub + "/views/topbeers.html");
});

route.get('/mybadges', limiter, function (req, res) {
    res.sendFile(pub + "/views/badges.html");
});

route.get('/stats', limiter, function (req, res) {
    res.sendFile(pub + "/views/stats.html");
});

route.get('/wishlist', limiter, function (req, res) {
    res.sendFile(pub + "/views/wishlist.html");
});

app.use('/', route);
app.use('/about', route);
app.use('/checkins', route);
app.use('/topbeers', route);
app.use('/badges', route);
app.use('/stats', route);
app.use('/wishlist', route);

module.exports = app.listen(port);
console.log('Your server goes on localhost:' + port);
