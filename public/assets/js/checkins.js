/*jslint browser: true*/
/*global define, module, exports*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory(root);
        });
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.Untappd = factory(root);
    }
})(this, function () {
    "use strict";

    var Untappd = function (options) {
        if (!this || !(this instanceof Untappd)) {
            return new Untappd(options);
        }

        if (typeof options === 'string') {
            options = { key : options };
        }

        this.username  = options.username;
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || window.location.hostname === "") {
            this.url = '/checkins.json';
        } else {
            this.url = 'https://liquid-stats.s3.amazonaws.com/checkins.json';
        }
        this.template  = options.template;
        this.container = options.container;

        this.fetch();
    };

    Untappd.init = function (options) {
        return new Untappd(options);
    };

    Untappd.prototype = {
        attachTemplate: function () {
            var template = Handlebars.compile(this.template);

            this.container.empty().append(template(this.untappd));
        },
        handleError: function (data) {
            this.container.empty().append('<p class="error">'+data+'</p>');
        },
        fetch: function () {
            var self = this;

            $.getJSON(self.url, function (data) {
                var apiStatus = data.meta.code;
                if (apiStatus === 200) {
                    var checkins = data.response.checkins.items;
                    self.untappd = $.map(checkins, function (beers) {
                        return {
                            id: beers.checkin_id,
                            avatar: beers.user.user_avatar,
                            name: beers.user.first_name,
                            username: beers.user.user_name,
                            beer: beers.beer.beer_name,
                            bid: beers.beer.bid,
                            beerSlug: beers.beer.beer_slug,
                            beerLabel: beers.beer.beer_label,
                            beerStyle: beers.beer.beer_style,
                            beerAbv: beers.beer.beer_abv,
                            company: beers.brewery.brewery_name,
                            website: beers.brewery.contact.url,
                            facebook: beers.brewery.contact.facebook,
                            instagram: beers.brewery.contact.instagram,
                            breweryCity: beers.brewery.location.brewery_city,
                            breweryState: beers.brewery.location.brewery_state,
                            breweryLabel: beers.brewery.brewery_label,
                            comments: beers.checkin_comment,
                            rating: beers.rating_score,
                            venueId: beers.venue.venue_id,
                            venueName: beers.venue.venue_name,
                            createdAt: beers.created_at,
                            badgeCount: beers.badges.count
                        }
                    });
                    self.attachTemplate();
                } else {
                    self.handleError(data.meta.error_detail);
                }
            });
        }
    };
    
    return Untappd;
});
