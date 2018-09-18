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
        this.url       = '/topbeers.json';
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
                    var checkins = data.response.beers.items;
					
                    self.untappd = $.map(checkins, function (beers) {
                        return {
                            id: beers.first_checkin_id,
                            beer: beers.beer.beer_name,
                            beerLabel: beers.beer.beer_label,
							beerStyle: beers.beer.beer_style,
							beerAbv: beers.beer.beer_abv,
                            company: beers.brewery.brewery_name,
							website: beers.brewery.contact.url,
							breweryCity: beers.brewery.location.brewery_city,
							breweryState: beers.brewery.location.brewery_state,
                            rating: beers.rating_score,
                            createdAt: beers.first_created_at
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