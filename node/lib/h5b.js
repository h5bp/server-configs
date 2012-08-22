/* h5bp server-configs project
 *
 * maintainer: @xonecas
 * contributors: @niftylettuce, @ngryman
 *
 * NOTES:
 * compression: use the compress middleware provided by connect 2.x to enable gzip/deflate compression
 *              http://www.senchalabs.org/connect/compress.html
 *
 * concatenation: use on of the following middlewares to enable automatic concatenation of static assets
 *                  - https://github.com/mape/connect-assetmanager
 *                  - https://github.com/TrevorBurnham/connect-assets
 */
var http = require('http');

const ONE_HOUR = 60 * 60;
const ONE_WEEK = ONE_HOUR * 24 * 7;
const ONE_MONTH = ONE_WEEK * 4;
const ONE_YEAR = ONE_MONTH * 12;

/**
 * configures h5b middleware
 *
 * @type {Function}
 */
var h5b = module.exports = exports = function(options) {
    options = options || {};
    options.server = options.server || 'express';

    /**
     * the actual h5b middleware, invoked for each request hit
     */
    return function(req, res, next) {
        var url = req.url,
            host = req.headers.host,
            ua  = req.headers['user-agent'],
            next = next || function(err) { if (err) throw err; },
            type = '', cc = '', error;

        try {

            /**
             * Proper MIME type for all files
             */

            // early mime type sniffing

            type = mime.lookup(req.url);
            res.setHeader('Content-Type', type);

            /**
             * Better website experience for IE users
             */

            // Force the latest IE version, in various cases when it may fall back to IE7 mode
            //  github.com/rails/rails/commit/123eb25#commitcomment-118920
            // Use ChromeFrame if it's installed for a better experience for the poor IE folk

            if (/MSIE/.test(ua) && 'text/html' == type) {
                res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
            }

            /**
             * Cross-domain AJAX requests
             */

            // Serve cross-domain Ajax requests, disabled by default.
            // enable-cors.org
            // code.google.com/p/html5security/wiki/CrossOriginRequestSecurity

            if (options.cors) {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }

            /**
             * CORS-enabled images (@crossorigin)
             */

            // Send CORS headers if browsers request them; enabled by default for images.
            // developer.mozilla.org/en/CORS_Enabled_Image
            // blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
            // hacks.mozilla.org/2011/11/using-cors-to-load-webgl-textures-from-cross-domain-images/
            // wiki.mozilla.org/Security/Reviews/crossoriginAttribute

            if (/image/.test(type)) {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }

            /**
             * Webfont access
             */

            // Allow access from all domains for webfonts.
            // Alternatively you could only whitelist your
            // subdomains like "subdomain.example.com".
            // TODO: mime type parsing?

            if (/\.(ttf|ttc|otf|eot|woff|font.css)$/.test(url)) {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }

            /**
             * Allow concatenation from within specific js and css files
             */

            // e.g. Inside of script.combined.js you could have
            //   <!--#include file="libs/jquery-1.5.0.min.js" -->
            //   <!--#include file="plugins/jquery.idletimer.js" -->
            // and they would be included into this single file.

            // TODO

            /**
             * Gzip compression
             */

            // TODO: https://github.com/tomgco/gzippo

            /**
             * Expires headers (for better cache control)
             */

            // These are pretty far-future expires headers.
            // They assume you control versioning with filename-based cache busting
            // Additionally, consider that outdated proxies may miscache
            //   www.stevesouders.com/blog/2008/08/23/revving-filenames-dont-use-querystring/

            // If you don't use filenames to version, lower the CSS and JS to something like
            // "access plus 1 week".

            // note: we don't use connect.static maxAge feature because it does not allow fine tune

            // Perhaps better to whitelist expires rules? Perhaps.

            // cache.appcache needs re-requests in FF 3.6 (thanks Remy ~Introducing HTML5)
            // Your document html
            // Data
            if (/(text\/(cache-manifest|html|xml)|application\/(xml|json))/.test(type)) {
                cc = 'public,max-age=' + 0;
            }
            // Feed
            else if (/application\/(rss\+xml|atom\+xml)/.test(type)) {
                cc = 'public,max-age=' + ONE_HOUR;
            }
            // Favicon (cannot be renamed)
            else if (/image\/x-icon/.test(type)) {
                cc = 'public,max-age=' + ONE_WEEK;
            }
            // Media: images, video, audio
            // HTC files  (css3pie)
            // Webfonts
            else if (/(image|video|audio|text\/x-component|application\/x-font-(ttf|woff)|vnd.ms-fontobject|font\/opentype)/.test(type)) {
                cc = 'public,max-age=' + ONE_MONTH;
            }
            // CSS and JavaScript
            else if (/(text\/(css|x-component)|application\/javascript)/.test(type)) {
                cc = 'public,max-age=' + ONE_YEAR;
            }
            // Misc
            else {
                cc = 'public,max-age=' + ONE_MONTH;
            }

            /**
             * Prevent mobile network providers from modifying your site
             */

            // The following header prevents modification of your code over 3G on some
            // European providers.
            // This is the official 'bypass' suggested by O2 in the UK.

            cc += (cc ? ',' : '') + 'no-transform';
            // hack: send does not compute ETag if header is already set, this save us ETag generation
            res.setHeader('cache-control', '');

            /**`
             * ETag removal
             */

            // Since we're sending far-future expires, we don't need ETags for
            // static content.
            //   developer.yahoo.com/performance/rules.html#etags

            // hack: send does not compute ETag if header is already set, this save us ETag generation
            res.setHeader('etag', '');

            // handle headers correctly after connect.static

            res.on('header', function() {
                res.setHeader('cache-control', cc);
                // remote empty etag header
                res.removeHeader('etag');
            });

            /**
             * Stop screen flicker in IE on CSS rollovers
             */

            // The following directives stop screen flicker in IE on CSS rollovers - in
            // combination with the "ExpiresByType" rules for images (see above).

            // TODO

            /**
             * Set Keep-Alive Header
             */

            // Keep-Alive allows the server to send multiple requests through one
            // TCP-connection. Be aware of possible disadvantages of this setting. Turn on
            // if you serve a lot of static content.

            res.setHeader('connection', 'keep-alive');

            /**
             * Cookie setting from iframes
             */

            // Allow cookies to be set from iframes (for IE only)
            // If needed, specify a path or regex in the Location directive.

            // TODO

            /**
             * Suppress or force the "www." at the beginning of URLs
             */

            // The same content should never be available under two different URLs -
            // especially not with and without "www." at the beginning, since this can cause
            // SEO problems (duplicate content). That's why you should choose one of the
            // alternatives and redirect the other one.

            // By default option 1 (no "www.") is activated.
            // no-www.org/faq.php?q=class_b

            // If you'd prefer to use option 2, just comment out all option 1 lines
            // and uncomment option 2.

            // IMPORTANT: NEVER USE BOTH RULES AT THE SAME TIME!

            // ----------------------------------------------------------------------

            // Option 1:
            // Rewrite "www.example.com -> example.com".

            if (false === options.www && !req.connection.encrypted && /^www\./.test(host)) {
                res.statusCode = 301;
                res.setHeader('location', '//' + host.replace(/^www\./, '') + url);

                if ('http' == options.server) throw 301;
                else {
                    res.end();
                    return;
                }
            }

            // ----------------------------------------------------------------------

            // Option 2:
            // Rewrite "example.com -> www.example.com".
            // Be aware that the following rule might not be a good idea if you use "real"
            // subdomains for certain parts of your website.

            if (true === options.www && !req.connection.encrypted && !/^www\./.test(host)) {
                res.statusCode = 301;
                res.setHeader('location', '//www.' + host.replace(/^www\./, '') + url);

                if ('http' == options.server) throw 301;
                else {
                    res.end();
                    return;
                }
            }

            /**
             * Built-in filename-based cache busting
             */

            // If you're not using the build script to manage your filename version revving,
            // you might want to consider enabling this, which will route requests for
            // /css/style.20110203.css to /css/style.css

            // To understand why this is important and a better idea than all.css?v1231,
            // read: github.com/h5bp/html5-boilerplate/wiki/cachebusting

            req.url = req.url.replace(/^(.+)\.(\d+)\.(js|css|png|jpg|gif)$/, '$1.$3');

            /**
             * A little more security
             */

            // Block access to "hidden" directories or files whose names begin with a
            // period. This includes directories used by version control systems such as
            // Subversion or Git.

            if (/(^|\/)\./.test(url)) {
                throw 403;  // 403, not allowed
            }

            // Block access to backup and source files. These files may be left by some
            // text/html editors and pose a great security danger, when anyone can access
            // them.

            if (/\.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist)|~/.test(url)) {
                throw 403;  // 403, not allowed
            }

            // do we want to advertise what kind of server we're running?

            if ('express' == options.server) {
                res.removeHeader('X-Powered-By');
            }
        }
        catch (code) {
            error = new Error(http.STATUS_CODES[code]);
            error.status = code;
        }
        finally {
            next(error);
        }
    };
};

/**
 *
 * @param options
 *
 * @param options.server (express|connect|http) [express]
 * Let H5B create the server and configure it properly.
 * For express/connect, H5B set up a default stack of middlewares which can be customized with other option arguments.
 * For http, H5B just create the server to be up and ready, without additional features.
 *
 * @param options.cors true or false [false]
 * Enabled CORS for everything.
 *
 * @param options.www true, false or undefined [undefined]
 * Force www if true, force non-www if false, does nothing if undefined.
 *
 * @param options.root
 * Adds and configures static and favicon middlewares to serve static files.
 *
 * @param options.logger true, false or logger options [false]
 * Adds and configures a logger middleware on H5B one.
 *
 */
h5b.createServer = function(options, callback) {
    var app;

    // express/connect
    if (/(express|connect)/.test(options.server)) {
        var middlewares = [h5b(options)];
        app = require(options.server)();

        if (true === options.logger || 'object' == typeof options.logger) {
            middlewares.unshift(app.logger(options.logger));
        }
        if (options.root) {
            middlewares.push(app.static(options.root));
            middlewares.push(app.favicon(options.root));
        }

        while (middlewares.length) app.use(middlewares.shift());
    }
    // http
    else {
        var middleware = h5b(options);
        app = require('http').createServer(function(req, res) {
            try {
                middleware(req, res);
            }
            catch(error) {
                res.writeHead(error.status);
                res.end(error.toString());
                return;
            }

            if ('function' == typeof callback) callback.apply(this, arguments);
        });
    }

    return app;
};

/**
 * default mime types associations.
 * exposed here for extension or any useful purpose.
 * @type {Object}
 */
h5b.mimeTypes = {
    'js': 'application/javascript',
    'jsonp': 'application/javascript',
    'json': 'application/json',
    'css': 'text/css',
    'oga': 'audio/ogg',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'f4a': 'audio/mp4',
    'f4b': 'audio/mp4',
    'ogv': 'video/ogg',
    'mp4': 'video/mp4',
    'm4v': 'video/mp4',
    'f4v': 'video/mp4',
    'f4p': 'video/mp4',
    'webm': 'video/webm',
    'flv': 'video/x-flv',
    'eot': 'application/vnd.ms-fontobject',
    'ttf': 'application/x-font-ttf',
    'ttc': 'application/x-font-ttf',
    'otf': 'font/opentype',
    'woff': 'application/x-font-woff',
    'ico': 'image/x-icon',
    'webp': 'image/webp',
    'appcache': 'text/cache-manifest',
    'manifest': 'text/cache-manifest',
    'htc': 'text/x-component',
    'rss': 'application/rss+xml',
    'atom': 'application/atom+xml',
    'xml': 'application/xml',
    'rdf': 'application/xml',
    'crx': 'application/x-chrome-extension',
    'oex': 'application/x-opera-extension',
    'xpi': 'application/x-xpinstall',
    'safariextz': 'application/octet-stream',
    'webapp': 'application/x-web-app-manifest+json',
    'vcf': 'text/x-vcard',
    'swf': 'application/x-shockwave-flash',
    'vtt': 'text/vtt',
    'html': 'text/html',
    'htm': 'text/html',
    'bmp': 'image/bmp',
    'gif': 'image/gif',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'jpe': 'image/jpeg',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'svgz': 'image/svg+xml',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'ico': 'image/x-icon'
};

/**
 * mime replacement
 *
 * types from h5b .htaccess
 * https://github.com/broofa/node-mime
 */
var mime = {
    lookup: function (path) {
        var ext = path.replace(/.*[\.\/]/, '').toLowerCase();
        return h5b.mimeTypes[ext] || 'text/plain';
    }
};

// literally paste from connect
// this patch ensure that we can alter headers when they are about to be written in the response.

/*!
 * Connect
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var http = require('http')
    , res = http.ServerResponse.prototype
    , setHeader = res.setHeader
    , _renderHeaders = res._renderHeaders
    , writeHead = res.writeHead;

// apply only once

if (!res._hasConnectPatch) {

    /**
     * Provide a public "header sent" flag
     * until node does.
     *
     * @return {Boolean}
     * @api public
     */

    res.__defineGetter__('headerSent', function(){
        return this._header;
    });

    /**
     * Set header `field` to `val`, special-casing
     * the `Set-Cookie` field for multiple support.
     *
     * @param {String} field
     * @param {String} val
     * @api public
     */

    res.setHeader = function(field, val){
        var key = field.toLowerCase()
            , prev;

        // special-case Set-Cookie
        if (this._headers && 'set-cookie' == key) {
            if (prev = this.getHeader(field)) {
                val = Array.isArray(prev)
                    ? prev.concat(val)
                    : [prev, val];
            }
            // charset
        } else if ('content-type' == key && this.charset) {
            val += '; charset=' + this.charset;
        }

        return setHeader.call(this, field, val);
    };

    /**
     * Proxy to emit "header" event.
     */

    res._renderHeaders = function(){
        if (!this._emittedHeader) this.emit('header');
        this._emittedHeader = true;
        return _renderHeaders.call(this);
    };

    res.writeHead = function(){
        if (!this._emittedHeader) this.emit('header');
        this._emittedHeader = true;
        return writeHead.apply(this, arguments);
    };

    res._hasConnectPatch = true;
}
