
//     node.js server config for html5-boilerplate
//       by @niftylettuce and @xonecas

// Inspired by Expressling
//  <https://github.com/niftylettuce/expressling>

// Looking for something more?  Need a bullet-proof + rock-solid node.js H5BP?
//  Try Expressling by visiting the Github link above!


// # node.js html5-boilerplate server-config

// Requirements:
// * You need to install node and npm first!

// Instructions:

//      # create project directory and node_modules folder
//      mkdir -p ~/project-name/node_modules
//      cd ~/project-name
//
//      # install connect
//      npm install connect
//
//      # install mime
//      npm install mime
//
//      # install colors
//      npm install colors
//
//      # start server
//      node node.js

var connect  = require('connect')
  , port     = 8080
  , cacheAge = 24 * 60 * 60 * 1000
  , htdocs   = __dirname
  , mime     = require('mime')
  , colors   = require('colors');

// # Routes
var routes = function(app) {

  // TODO: Insert your routes here (e.g. app.get('/home') app.post('/form'))

  // ## Always keep this route last
  app.get('*', function(req, res, next) {

    // ## Better website experience for IE users
    var url = req.url
      , ua = req.headers['user-agent']
      , reqPath = req.url;

    if(ua && ua.indexOf('MSIE'))
      res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');

    // We don't want to send this header on _everything_
    if(reqPath.match(/\.(js|css|gif|png|jpe?g|pdf|xml|oga|ogg|m4a|ogv|mp4|m4v|webm|svg|svgz|eot|ttf|otf|woff|ico|webp|appcache|manifest|htc|crx|xpi|safariextz|vcf)$/)) {
      res.removeHeader('X-UA-Compatible');
      res.removeHeader('IE=Edge,chrome=1');
    }

    // ## CORS
    //  Force the latest IE version, in cases when it may fall back to IE7 mode
    //  <http://github.com/rails/rails/commit/123eb25#commitcomment-118920>
    //  Use ChromeFrame if it's installed, for a better experience with IE folks
    //  Control cross domain using CORS http://enable-cors.org
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");

    // NOTE: gzippo _should_ only be used in a production environment
    //  <https://github.com/tomgallacher/gzippo>
    // TODO: If you want to enable compression, then add the following require:
    //  var gzippo = require('gzippo'); // you'll also need to `$ npm install gzippo`
    // TODO: Then add the following inside var routes {} below:
    //  app.use(gzippo.staticGzip(htdocs, { maxAge: cacheAge }));
    // TODO: You'll also need to remove the normal connect.static below

    // TODO: Allow concatenation from within specific js and css files
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L111

    // TODO: Stop screen flicker in IE on CSS rollovers
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L271

    // TODO: Cookie setting from iframes
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L286

    // TODO: Suppress or force the "www." at the beginning of URLs
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L315

    // TODO: Built-in filename-based cache busting
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L356

    // TODO: Prevent SSL cert warnings
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L376

    // TODO: UTF-8 encoding
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L411

    // TODO: Block access to "hidden" directories whose names begin with a period
    // https://github.com/paulirish/html5-boilerplate/blob/master/.htaccess/#L442

    next();
  });

};

// ## Start the server
var server = connect.createServer(
    // This hawt logger is from Expressling
    connect.logger(''
      + '\\n  ' + ':date'.bold.underline + '\\n\\n' + '  IP: '.cyan.bold
      + ' ' + ':remote-addr'.white + '\\n' + '  Method: '.red.bold
      + ':method'.white + '\\n' + '  URL: '.blue.bold + ':url'.white
      + '\\n' + '  Status: '.yellow.bold + ':status'.white + '\\n'
      + '  User Agent: '.magenta.bold + ':user-agent'.white)
  , connect.router(routes)
  , connect.static(htdocs, { maxAge: cacheAge })
);
server.listen(port);
console.log('\n  ' + 'NODE UP ON PORT '.rainbow.bold + port); // aww pretty!

// This is a failsafe, it will catch the error silently and log it to console.
//  You should really try to catch the errors with a try/catch block.
process.on('uncaughtException', function (err) {
  console.log('  Caught exception: ' + err);
});
