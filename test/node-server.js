var express = require('express'),
   h5bp     = require('../node/lib/h5b.js'),
   server   = h5bp.server(express, {
      root: __dirname,
      maxAge: 1000 * 60 * 60 * 30
   });

server.listen(8080);
console.log('ok');
