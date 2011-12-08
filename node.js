// # [node.js h5bp server-config](https://github.com/h5bp/server-configs)
//  by @xonecas and @niftylettuce

// Requires latest version of `node` and `npm`
// <https://gist.github.com/579814>

// # Getting started:
// * Create directories `$ mkdir -p ~/project/node_modules && cd ~/project`

// # Usage:
// `$ PRODUCTION=true node node.js` (prod mode) or `$ node node.js` (dev mode)

var connect  = require('connect'),
   cacheAge = 24 * 60 * 60 * 1000,
   prod = process.env.PRODUCTION,
   // specify a production directory, or serve current directory.
   root = prod ? 'path/to/prod/public': __dirname,
   port = prod ? 80 : 8080;

// # Routes
var routes = function(app) {

   // # Insert your routes here (e.g. app.get('/home') app.post('/form'))

   // ## Always keep this route last
   app.get('*', function(req, res, next) {
      var url = req.url,
         ua = req.headers['user-agent'];

      // ## Block access to hidden files and directories that begin with a period
      if (url.match(/(^|\/)\./)) {
         res.end("Not allowed");
      }

      // ## Better website experience for IE users
      //  Force the latest IE version, in cases when it may fall back to IE7 mode
      if(ua && ua.indexOf('MSIE') && /htm?l$/.test(url)) {
         res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
      }

      //  Control cross domain using CORS http://enable-cors.org
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");

      // **TODO:** Allow concatenation from within specific js and css files
      // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L111

      // **TODO:** Stop screen flicker in IE on CSS rollovers
      // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L271

      // **TODO:** Cookie setting from iframes
      // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L286

      // **TODO:** Suppress or force the "www." at the beginning of URLs
      // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L315
      if (/^www\./.test(url)) {
         res.statusCode = 302;
         res.setHeader('Location', url.replace(/^www\./, ''));
         res.end();
      }

      // **TODO:** Built-in filename-based cache busting
      // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L356

      // **TODO:** Prevent SSL cert warnings
      // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L376

      next();
   });

};

// ## Start the server
var server = connect.createServer(
   connect.logger('dev'),
   connect.router(routes),
   // if you want gzip, then replace the next line with gzippo
   // https://github.com/tomgallacher/gzippo
   connect["static"](root, { maxAge: cacheAge })
);
server.listen(port);
console.log('NODE UP ON PORT '+ port);
