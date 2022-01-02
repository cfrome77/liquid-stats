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
            this.url = '/beers.json';
        } else {
            this.url = 'https://liquid-stats.s3.amazonaws.com/beers.json';
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
                var topbeers = data.beers
                self.untappd = $.map(topbeers, function (beers) {
                    return {
                        id: beers.first_checkin_id,
                        beer: beers.beer.beer_name,
                        bid: beers.beer.bid,
                        beerSlug: beers.beer.beer_slug,
                        beerLabel: beers.beer.beer_label,
                        beerStyle: beers.beer.beer_style,
                        beerAbv: beers.beer.beer_abv,
                        beerAbout: beers.beer.beer_description,
                        overallRating: beers.beer.rating_score,
                        company: beers.brewery.brewery_name,
                        website: beers.brewery.contact.url,
                        facebook: beers.brewery.contact.facebook,
                        instagram: beers.brewery.contact.instagram,
                        breweryCity: beers.brewery.location.brewery_city,
                        breweryState: beers.brewery.location.brewery_state,
                        breweryLabel: beers.brewery.brewery_label,
                        myRating: beers.rating_score,
                        createdAt: beers.first_created_at
                    }
                });
	
                self.attachTemplate();
            });
        }
    };

    return Untappd;
});
