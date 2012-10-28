/*jslint node:true, nomen:true */
var h5bp = require('./lib/h5b'),
    app = h5bp.createServer({ server: 'express' }),
    server;

//
// put your routes here
//

server = app.listen(80);
