/* h5bp server-configs project
 *
 * maintainer: @xonecas, <insert your name here>
 */
var h5bp    = module.exports,
   _http    = require('http'),
   _parse   = require('url').parse;

// send the IE=Edge and chrome=1 headers for IE browsers
// on html/htm resquests.
h5bp.ieEdgeChromeFrameHeader = function () {
   return function (req, res, next) {
      var url = req.url,
         ua = req.headers['user-agent'];

      if (ua && ua.indexOf('MSIE') && /html?($|\?|#)/.test(url)) {
         res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
      }
      next();
   };
};

   // block access to hidden files and directories.
h5bp.protectDotfiles = function () {
   return function (req, res, next) {
      var error;
      if (/(^|\/)\./.test(req.url)) {
         error = new Error(_http.STATUS_CODES[405]); // 405, not allowed
         error.status = 405;
      }
      next(error);
   };
};

// Enable CORS cross domain rules, more info at http://enble-cors.org/
h5bp.crossDomainRules = function () {
   return function (req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');
      next();
   };
};

// Suppress or force 'www' in the urls
// @param suppress = boolean
h5bp.suppressWww = function (suppress) {
   return function (req, res, next) {
      var url = req.url;
      if (suppress && /^www\./.test(url)) {
         res.statusCode = 302;
         res.setHeader('Location', url.replace(/^www\./,''));
      }
      if (!suppress && !/^www\./.test(url)) {
         res.statusCode = 302;
         res.setHeader('Location', "www."+url);
      }
      next();
   };
};

// Far expire headers
// use this when not using connect.static for your own expires/etag control
// ** WARNING ** connect.static overrides this.
h5bp.expireHeaders = function (maxAge) {
   return function (req, res, next) {
      res.setHeader('Cache-Control', 'public, max-age='+ (maxAge));
      next();
   };
};

// Etag removal
// only use this is you are setting far expires for your files
// ** WARNING ** connect.static overrides this.
h5bp.removeEtag = function () {
   return function (req, res, next) {
      res.removeHeader('Last-Modified');
      res.removeHeader('ETag');
      next();
   };
};

// set proper content type
// @param mime = reference to the mime module (https://github.com/bentomas/node-mime)
h5bp.setContentType = function (mime) {
   return function (req, res, next) {
      // I'm handling the dependency by having it passed as an argument
      // we depend on the mime module to determine proper content types
      // connect also has the same dependency for the static provider
      // ** @TODO ** maybe connect/express expose this module somehow?
      var path = _parse(req.url).pathname,
         type  = mime.lookup(path);
      res.setHeader('Content-Type', type);
      next();
   };
};

// return a express/connect server with the default middlewares.
// @param serverConstructor = express/connect server instance
// @param options = { 
//    root: 'path/to/public/files',
//    maxAge: integer, time in miliseconds ex: 1000 * 60 * 60 * 24 * 30 = 30 days,
//    mime: reference to the mime module ex: require('mime')
// }
h5bp.server = function (serverConstructor, options) {
   return serverConstructor.createServer(
      serverConstructor.logger('dev'),
      this.suppressWww(true),
      this.protectDotfiles(),
      this.crossDomainRules(),
      this.ieEdgeChromeFrameHeader(),
      //this.expireHeaders(),
      //this.removeEtag(),
      //this.setContentType(require('mime')),
      //serverConstructor.compress(), // express doesn't seem to expose this middleware
      serverConstructor['static'](options.root, { maxAge: options.maxAge }), // static is a reserved
      serverConstructor.favicon(options.root, { maxAge: options.maxAge }),
      serverConstructor.errorHandler({
         stack: true,
         message: true,
         dump: true
      })
   );
};
