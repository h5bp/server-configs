var express = require('express'),
   h5bp     = require('../node.js'),
   server   = h5bp.server(express, { root: __dirname });

server.listen(8080);
