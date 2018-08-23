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
        this.url       = '/userinfo?user=' + this.username;
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
                    var user = data.response.user;

                    self.untappd = $.map(user, function (beers) {
                        return {
                            username: beers.first_name
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