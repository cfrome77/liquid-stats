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
        this.url       = '/badges.json';
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
                var badges = data;

                self.untappd = $.map(badges, function (beers) {
                    return {
                        badgeName: beers.badge_name,
                        badgeDescription: beers.badge_description,
                        badgeImage: beers.media.badge_image_sm,
                        createdAt: beers.created_at,
                        id: beers.user_badge_id
                    }
                });

                self.attachTemplate();
            });
        }
    };

    return Untappd;
});
