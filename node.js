/* ============================================================================
   author: @xonecas
 
   A boiler inspired by apache's .htaccess, that will serve static
   files off the shelf (just in case you want to get going quick)
   Everything else is for you to decide.

   I will keep this up to date with current node and connect versions
   any issues please file a issue :-)
============================================================================= */

var connect = require('connect'),
   // inspect tool, I use it all the time.
   inspect = require('util').inspect;


/* ----------------------------
   your server code:
---------------------------- */






var routes = function (app) {

/* ---------------------------------------------------------------------------------
   your routes go here
   you can use app.get, app.post, ...
   the docs are here: http://senchalabs.github.com/connect/middleware-router.html
---------------------------------------------------------------------------------- */





/* ---------------------------------------------------------------------------------
   Keep this route last.
---------------------------------------------------------------------------------- */
   app.get('*', function (req, res, next) {
      var url = req.url,
         ua = req.headers['user-agent'];

      // request latest IE engine or chrome frame
      if (ua && ua.indexOf('MSIE') && 
         url.match(/\.html$/) || url.match(/\.htm$/))
         res.setHeader('X-UA-Compatible', "IE=Edge,chrome=1");

      // protect .files
      if (reqPath.match(/(^|\/)\./))
         res.end("Not allowed");

      // control cross domain using CORS (http://enable-cors.org/)
      req.setHeader('Access-Control-Allow-Origin', '*');

      next(); // let the static server do the rest
   });
}

/* ----------------------------------------------------------------------------------
   set you cache maximum age, in milisecconds.
   if you don't use cache break use a smaller value
   start the server.
---------------------------------------------------------------------------------- */
var cache = 1000 * 60 * 60 * 24 * 30,
   port   = 80, 
   htdocs = __dirname,
   server = connect.createServer(
      // http://senchalabs.github.com/connect/middleware-logger.html
      connect.logger(":date | :remote-addr | :method :url :status | :user-agent"),
      connect.router(routes),
      connect.static(__dirname, {maxAge: cache})
   );

server.listen(port);
console.log('Node up!\n Port:   '+port+'\nhtdocs: '+htdocs);

/* -----------------------------------------------------------------------------------
   this is a failsafe, it will catch the error silently and logged it the console
   while this works, you should really try to catch the errors with a try/catch block
   more on this here: 
      http://nodejs.org/docs/v0.4.3/api/process.html#event_uncaughtException_
----------------------------------------------------------------------------------- */
process.on('uncaughtException', function (err) {
   console.log('Caught exception: ' + err);
});
