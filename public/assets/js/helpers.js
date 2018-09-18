Handlebars.registerHelper("ratingCount", function (counter) {
    var num = counter.toString(),
        n   = num.replace('.', '-');
    return n;
});

Handlebars.registerHelper("published", function () {
    return moment(Date.parse(this.createdAt)).format('h:mm A D MMM YYYY');
});

Handlebars.registerHelper('userLatest', function (index) {
    if (index < 1) {
        var name     = this.name,
            username = this.username,
            avatar   = this.avatar,
            tpl      = [
                '<div class="user cf">',
                    '<img class="avatar" src="'+avatar+'" alt="'+name+'">',
                    '<p class="name"><a href="https://untappd.com/user/'+username+'" title="Untappd profile" rel="extrenal">'+name+'</a></p>',
                    '<span>Latest Checkins</span>',
                '</div>'
            ].join('\n');
        return new Handlebars.SafeString(tpl);
    }
});

Handlebars.registerHelper('userTop', function (index) {
    if (index < 1) {
        var name     = this.name,
            username = this.username,
            avatar   = this.avatar,
            tpl      = [
                '<div class="user cf">',
                    '<img class="avatar" src="'+avatar+'" alt="'+name+'">',
                    '<p class="name"><a href="https://untappd.com/user/'+username+'" title="Untappd profile" rel="extrenal">'+name+'</a></p>',
                    '<span>Top Check-ins</span>',
                '</div>'
            ].join('\n');
        return new Handlebars.SafeString(tpl);
    }
});

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('eachByIdx', function(context,options){
    var output = '';
    var contextSorted = context.concat()
        .sort( function(a,b) { return b.rating - a.rating } );
    for(var i = 0, j = contextSorted.length; i < j; i++) {
        output += options.fn(contextSorted[i]);
    }
    return output;
});
