

var h5bp = modules.exports,
   _http = require('http');

h5bp = {
   // send the IE=Edge and chrome=1 headers for IE browsers
   // on html/htm resquests.
   ieEdgeChromeFrameHeader: function () {
      return function (req, res, next) {
         var url = req.url,
            ua = req.headers['user-agent'];

         if (ua && ua.indexOf('MSIE') && /html?$/.test(url)) {
            res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
         }
         next();
      };
   },

   // block access to hidden files and directories.
   protectDotfiles: function () {
      return function (req, res, next) {
         var error;
         if (/(^|\/)\./.test(req.url)) {
            error = new Error(_http.STATUS_CODES[405]); // 405, not allowed
            error.status = 405;
         }
         next(error);
      };
   },

   // Enable CORS cross domain rules, more info at http://enble-cors.org/
   crossDomainRules: function () {
      return function (req, res, next) {
         res.setHeader('Access-Control-Allow-Origin', '*');
         res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');
         next();
      };
   },

   // Suppress or force 'www' in the urls
   // @param suppress = boolean
   suppressWww: function (suppress) {
      return function (req, res, next) {
         var url = req.url;
         if (suppress && /^www\./.test(url)) {
            res.status = 302;
            res.setHeader('Location', url.replace(/^www\./,''));
         }
         if (!suppress && !/^www\./.test(url)) {
            res.status = 302;
            res.setHeader('Location', "www."+url);
         }
         next();
      };
   },

   // return a express/connect server with the default middlewares.
   // @param serverConstructor = express/connect server instance
   server: function (serverContructor) {
      return serverContructor.createServer(
         serverContructor.logger('dev'),
         this.ieEdgeChromeFrameHeader(),
         this.protectDotfiles(),
         this.crossDomainRules(),
         this.suppressWww(true),
         serverContructor['static'](__.dirname), // static is a reserved keyword
         serverContructor.favicon(__dirname),
         serverContructor.errorHandler({
            stack: true,
            message: true,
            dump: true
         })
      );
   }
};
