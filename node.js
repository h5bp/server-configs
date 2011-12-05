
// # [node.js h5bp server-config](https://github.com/h5bp/server-configs)
//  by @xonecas and @niftylettuce

// Requires latest version of `node` and `npm`
// <https://gist.github.com/579814>

// # Getting started:
// * Create directories `$ mkdir -p ~/project/node_modules && cd ~/project`
// * Install dependencies `$ npm install connect colors`

// # Usage:
// `$ PRODUCTION=true node node.js` (prod mode) or `$ node node.js` (dev mode)

var connect  = require('connect')
  , colors = require('colors')
  , cacheAge = 24 * 60 * 60 * 1000
  , prod = process.env.PRODUCTION
  // **NOTE:** You'll need to change these paths:
  , root = prod ? 'path/to/prod/public': 'path/to/dev/public'
  , port = prod ? 80 : 8080;

// # Routes
var routes = function(app) {

  // **TODO:** Insert your routes here (e.g. app.get('/home') app.post('/form'))

  // ## Always keep this route last
  app.get('*', function(req, res, next) {

    var url = req.url
      , ua = req.headers['user-agent'];

    // ## Block access to hidden files and directories that begin with a period
    if (url.match(/(^|\/)\./)) {
      res.end("Not allowed");
    }

    // ## Better website experience for IE users
    //  Force the latest IE version, in cases when it may fall back to IE7 mode
    if(ua && ua.indexOf('MSIE') && /htm?l/.test(ua)) {
      res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
    }

    // ## CORS
    //  <http://github.com/rails/rails/commit/123eb25#commitcomment-118920>
    //  Use ChromeFrame if it's installed, for a better experience with IE folks
    //  Control cross domain using CORS http://enable-cors.org
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");

    // ## Production Environment Compression (requires latest version of node)
    //
    // If you want to enable [gzippo](<https://github.com/tomgallacher/gzippo>):
    //
    //   `var gzippo = require('gzippo');'`
    //
    // Then install gzippo via `$ npm install gzippo` and add to `var routes{}`:
    //
    //   `app.use(gzippo.staticGzip(root, { maxAge: cacheAge}));`
    //
    // Next remove `, connect["static"](root, { maxAge: cacheAge })` from below.

    // **TODO:** Allow concatenation from within specific js and css files
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L111

    // **TODO:** Stop screen flicker in IE on CSS rollovers
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L271

    // **TODO:** Cookie setting from iframes
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L286

    // **TODO:** Suppress or force the "www." at the beginning of URLs
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L315

    // **TODO:** Built-in filename-based cache busting
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L356

    // **TODO:** Prevent SSL cert warnings
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L376

    next();
  });

};

// ## Start the server
var server = connect.createServer(
    // Logger from [Expressling](https://github.com/niftylettuce/expressling)
    connect.logger(''
      + '\\n  ' + ':date'.bold.underline + '\\n\\n' + '  IP: '.cyan.bold
      + ' ' + ':remote-addr'.white + '\\n' + '  Method: '.red.bold
      + ':method'.white + '\\n' + '  URL: '.blue.bold + ':url'.white
      + '\\n' + '  Status: '.yellow.bold + ':status'.white + '\\n'
      + '  User Agent: '.magenta.bold + ':user-agent'.white)
  , connect.router(routes)
  , connect["static"](root, { maxAge: cacheAge })
);
server.listen(port);
console.log('\n  ' + 'NODE UP ON PORT '.rainbow + port);
