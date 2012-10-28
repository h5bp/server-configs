var h5bp = require('./lib/h5b');

var app = h5bp.createServer({ server: 'express' }),
    server;

//
// put your routes here
//

server = app.listen(80);
