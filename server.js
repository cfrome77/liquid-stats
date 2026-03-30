const express = require('express');
const compression = require('compression');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 8080;

app.use(compression());

// Serve static files from the Angular app
app.use(express.static(path.join(__dirname, 'dist/liquid-stats/browser')));

// Helper to strip unused fields from checkin data
const stripCheckin = (checkin) => ({
    checkin_id: checkin.checkin_id,
    created_at: checkin.created_at,
    checkin_comment: checkin.checkin_comment,
    rating_score: checkin.rating_score,
    beer: {
        bid: checkin.beer.bid,
        beer_name: checkin.beer.beer_name,
        beer_style: checkin.beer.beer_style,
        beer_label: checkin.beer.beer_label,
        beer_slug: checkin.beer.beer_slug,
    },
    brewery: {
        brewery_id: checkin.brewery.brewery_id,
        brewery_name: checkin.brewery.brewery_name,
        brewery_label: checkin.brewery.brewery_label,
        country_name: checkin.brewery.country_name,
        location: checkin.brewery.location,
        contact: checkin.brewery.contact ? {
            twitter: checkin.brewery.contact.twitter,
            facebook: checkin.brewery.contact.facebook,
        } : undefined,
    },
    recent_created_at: checkin.recent_created_at,
    first_created_at: checkin.first_created_at,
    count: checkin.count
});

// Helper to strip unused fields from beer data
const stripBeer = (beer) => ({
    beer: {
        bid: beer.beer.bid,
        beer_name: beer.beer.beer_name,
        beer_style: beer.beer.beer_style,
        beer_label: beer.beer.beer_label,
        beer_slug: beer.beer.beer_slug,
        beer_description: beer.beer.beer_description
    },
    brewery: {
        brewery_id: beer.brewery.brewery_id,
        brewery_name: beer.brewery.brewery_name,
        brewery_label: beer.brewery.brewery_label,
        country_name: beer.brewery.country_name,
        location: beer.brewery.location,
        contact: beer.brewery.contact ? {
            twitter: beer.brewery.contact.twitter,
            facebook: beer.brewery.contact.facebook,
        } : undefined,
    },
    rating_score: beer.rating_score,
    recent_created_at: beer.recent_created_at,
    first_created_at: beer.first_created_at,
    count: beer.count
});

const getData = async (filename) => {
    const baseUrl = process.env.DATA_URL || '';

    if (!baseUrl) {
        // For local testing, read from src/assets/data/ (though they aren't there yet in this branch)
        // Let's use the mock-data we just created
        const fs = require('fs').promises;
        try {
            const data = await fs.readFile(path.join(__dirname, 'mock-data', filename), 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading local ${filename}:`, error.message);
            return null;
        }
    }

    const url = baseUrl.endsWith('/') ? `${baseUrl}${filename}` : `${baseUrl}/${filename}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${filename}:`, error.message);
        return null;
    }
};

app.get('/api/checkins', async (req, res) => {
    const data = await getData('checkins.json');
    if (!data) return res.status(500).json({ error: 'Failed to fetch checkins' });

    let items = data.response?.checkins?.items || data.checkins || [];

    // Pagination
    const limit = parseInt(req.query.limit) || items.length;
    const offset = parseInt(req.query.offset) || 0;

    // Field stripping
    const paginatedItems = items.slice(offset, offset + limit).map(stripCheckin);

    res.json({
        response: {
            checkins: {
                items: paginatedItems,
                count: paginatedItems.length,
                total_count: items.length
            }
        }
    });
});

app.get('/api/beers', async (req, res) => {
    const data = await getData('beers.json');
    if (!data) return res.status(500).json({ error: 'Failed to fetch beers' });

    let items = data.beers || data.response?.checkins?.items || [];

    // Pagination
    const limit = parseInt(req.query.limit) || items.length;
    const offset = parseInt(req.query.offset) || 0;

    // Field stripping
    const paginatedItems = items.slice(offset, offset + limit).map(stripBeer);

    res.json({
        beers: paginatedItems,
        count: paginatedItems.length,
        total_count: items.length
    });
});

app.get('/:path*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/liquid-stats/browser/index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
