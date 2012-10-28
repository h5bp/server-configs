// prevent express for dumping error in test output
process.env.NODE_ENV = 'test';

var h5bp = require('../lib/h5bp');
var express = require('express');
require('chai').should();
var request = require('supertest');
var url = require('url');
var fs = require('fs');

const HTML = 'html htm'.split(' ');
const IMAGE = 'bmp gif jpeg jpg jpe png svg svgz tiff tif ico'.split(' ');
const ICON = 'ico'.split(' ');
const VIDEO = 'ogv mp4 m4v f4v f4p webm flv'.split(' ');
const AUDIO = 'oga ogg m4a f4a f4b'.split(' ');
const FONT = 'ttf ttc otf eot woff'.split(' ');
const RSS = 'rss atom'.split(' ');
const MISC = 'txt crx oex xpi safariextz webapp vcf swf vtt'.split(' ');

const FEED = RSS;
const MEDIA = IMAGE.concat(VIDEO.concat(AUDIO));
const DATA = 'appcache manifest html htm xml rdf json';
const ALL = [].concat(HTML, IMAGE, ICON, VIDEO, AUDIO, FONT, RSS);

describe('h5bp', function() {
    describe('with express/connect', function() {
        before(function() {
            helper.stop();
            helper.create();
            helper.start();
        });

        describe ('proper MIME type for all files', function() {
            var ext = Object.keys(h5bp.mimeTypes);
            ext.forEach(function(e) {
                it('should be set for .' + e, function(done) {
                    helper.request()
                        .get('/test.' + e)
                        .expect('Content-Type', h5bp.mimeTypes[e])
                        .expect(200, done);
                });
            });
        });

        describe('the latest IE version', function() {
            HTML.forEach(function(f) {
                it('should be set for .' + f, function(done) {
                    helper.request()
                        .get('/test.' + f)
                        // http://www.useragentstring.com/pages/Internet%20Explorer/
                        .set('user-agent', 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)')
                        .expect('X-UA-Compatible', 'IE=Edge,chrome=1')
                        .expect(200, done);
                });
            });

            var others = [].concat(ALL);
            delete others['html'];
            delete others['htm'];
            others.forEach(function(f) {
                it('should not be set for .' + f, function(done) {
                    helper.request()
                        .get('/test.' + f)
                        // http://www.useragentstring.com/pages/Internet%20Explorer/
                        .set('user-agent', 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)')
                        .expect(200)
                        .end(function(err, res) {
                            res.headers.should.not.have.property('X-UA-Compatible');
                            done();
                        });
                });
            });
        });

        describe('serving cross-domain Ajax requests', function() {
            it('should be disabled by default', function(done) {
                helper.request()
                    .get('/test.html')
                    .expect(200)
                    .end(function(err, res) {
                        res.headers.should.not.have.property('Access-Control-Allow-Origin');
                        done();
                    });
            });

            it('should be enabled when option is set', function(done) {
                helper
                    .stop()
                    .create({ cors: true })
                    .start()
                    .request()
                    .get('/test.html')
                    .expect('Access-Control-Allow-Origin', '*')
                    .expect(200, done);
            });
        });

        describe('serving cross-domain images', function() {
            IMAGE.forEach(function(f) {
                it('should be enabled for .' + f, function(done) {
                    helper.request()
                        .get('/test.' + f)
                        .expect('Access-Control-Allow-Origin', '*')
                        .expect(200, done);
                });
            });
        });

        describe('serving cross-domain for webfonts', function() {
            FONT.forEach(function(f) {
                it('should be enabled for .' + f.replace(/test/, ''), function(done) {
                    helper.request()
                        .get('/test.' + f)
                        .expect('Access-Control-Allow-Origin', '*')
                        .expect(200, done);
                });
            });

            it('should be enabled for font.css', function(done) {
                helper.request()
                    .get('/font.css')
                    .expect('Access-Control-Allow-Origin', '*')
                    .expect(200, done);
            });
        });

        describe('expires headers', function() {
            describe('force refresh', function() {
                DATA.split(' ').forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=0/)
                            .expect(200, done);
                    });
                });
            });

            describe('one hour', function() {
                FEED.forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=3600/)
                            .expect(200, done);
                    });
                });
            });

            describe('one week', function() {
                ICON.forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=604800/)
                            .expect(200, done);
                    });
                });
            });

            describe('one month', function() {
                var medias = MEDIA.filter(function(e) { return 'ico' != e; });
                medias.push('htc');
                medias.forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=2419200/)
                            .expect(200, done);
                    });
                });
            });

            describe('one year', function() {
                'js jsonp css'.split(' ').forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=29030400/)
                            .expect(200, done);
                    });
                });
            });

            describe('one month for every one else', function() {
                MISC.forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=2419200/)
                            .expect(200, done);
                    });
                });
            });
        });

        it('should prevent mobile network providers from modifying your site', function(done) {
            helper.request()
                .get('/test.html')
                .expect('cache-control', /no-transform/)
                .expect(200, done);
        });

        it('should remove ETag header', function(done) {
            helper.request()
                .get('/test.html')
                .expect(200)
                .end(function(err, res) {
                    res.headers.should.not.have.property('etag');
                    done();
                });
        });

        it('should set Keep-Alive Header', function(done) {
            helper.request()
                .get('/test.html')
                .expect('connection', 'keep-alive')
                .expect(200, done);
        });

        describe('no-www', function() {
            it('should be enforced if options.www is false', function(done) {
                helper
                    .stop()
                    .create({ www: false })
                    .start()
                    .request()
                    .get('/test.html')
                    .set('host', 'www.example.com')
                    .expect('location', '//example.com/test.html')
                    .expect(301, done);
            });

            it('should be enforced and keep query string', function(done) {
                helper.request()
                    .get('/test.html?response=42')
                    .set('host', 'www.example.com')
                    .expect('location', '//example.com/test.html?response=42')
                    .expect(301, done);
            });

            it('should do nothing if not present', function(done) {
                helper.request()
                    .get('/test.html')
                    .set('host', 'example.com')
                    .expect(200, done);
            });
        });

        describe('www', function() {
            it('should be enforced if options.www is true', function(done) {
                helper
                    .stop()
                    .create({ www: true })
                    .start()
                    .request()
                    .get('/test.html')
                    .set('host', 'example.com')
                    .expect('location', '//www.example.com/test.html')
                    .expect(301, done);
            });

            it('should be enforced and keep query string', function(done) {
                helper.request()
                    .get('/test.html?response=42')
                    .set('host', 'example.com')
                    .expect('location', '//www.example.com/test.html?response=42')
                    .expect(301, done);
            });

            it('should do nothing if present', function(done) {
                helper.request()
                    .get('/test.html')
                    .set('host', 'www.example.com')
                    .expect(200, function() {
                        helper
                            .stop()
                            .create()
                            .start();
                        done();
                    });
            });
        });

        describe('cache busting', function() {
            var token = Math.floor(Math.random() * 10e7); // date format yyyyMMdd, random here
            'js css png jpg gif'.split(' ').forEach(function(f) {
                it('should work for .' + f, function(done) {
                    helper.request()
                        .get('/test.' + token + '.' + f)
                        .expect(200, done);
                });
            });
        });

        describe('access to backup and source files', function() {
            'htaccess git gitignore'.split(' ').forEach(function(f) {
                it('should be blocked for .' + f, function(done) {
                    helper.request()
                        .get('/.' + f)
                        .expect(403, done);
                });
            });
        });

        describe('access to backup and source files', function() {
            'bak config sql fla psd ini log sh inc swp dist'.split(' ').forEach(function(f) {
                it('should be blocked for .' + f, function(done) {
                    helper.request()
                        .get('/.' + f)
                        .expect(403, done);
                });
            });
        });

        it("should not advertise what kind of server we're running", function(done) {
            helper.request()
                .get('/test.html')
                .expect(200)
                .end(function(err, res) {
                    res.headers.should.not.have.property('X-Powered-By');
                    done();
                });
        });
    });

    describe('standalone', function() {
        before(function() {
            helper.stop();
            helper.create({ server: 'http' });
            helper.start();
        });

        describe ('proper MIME type for all files', function() {
            var ext = Object.keys(h5bp.mimeTypes);
            ext.forEach(function(e) {
                it('should be set for .' + e, function(done) {
                    helper.request()
                        .get('/test.' + e)
                        .expect('Content-Type', h5bp.mimeTypes[e])
                        .expect(200, done);
                });
            });
        });

        describe('the latest IE version', function() {
            HTML.forEach(function(f) {
                it('should be set for .' + f, function(done) {
                    helper.request()
                        .get('/test.' + f)
                        // http://www.useragentstring.com/pages/Internet%20Explorer/
                        .set('user-agent', 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)')
                        .expect('X-UA-Compatible', 'IE=Edge,chrome=1')
                        .expect(200, done);
                });
            });

            var others = [].concat(ALL);
            delete others['html'];
            delete others['htm'];
            others.forEach(function(f) {
                it('should not be set for .' + f, function(done) {
                    helper.request()
                        .get('/test.' + f)
                        // http://www.useragentstring.com/pages/Internet%20Explorer/
                        .set('user-agent', 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)')
                        .expect(200)
                        .end(function(err, res) {
                            res.headers.should.not.have.property('X-UA-Compatible');
                            done();
                        });
                });
            });
        });

        describe('serving cross-domain Ajax requests', function() {
            it('should be disabled by default', function(done) {
                helper.request()
                    .get('/test.html')
                    .expect(200)
                    .end(function(err, res) {
                        res.headers.should.not.have.property('Access-Control-Allow-Origin');
                        done();
                    });
            });

            it('should be enabled when option is set', function(done) {
                helper
                    .stop()
                    .create({ server: 'http', cors: true })
                    .start()
                    .request()
                    .get('/test.html')
                    .expect('Access-Control-Allow-Origin', '*')
                    .expect(200, done);
            });
        });

        describe('serving cross-domain images', function() {
            IMAGE.forEach(function(f) {
                it('should be enabled for .' + f, function(done) {
                    helper.request()
                        .get('/test.' + f)
                        .expect('Access-Control-Allow-Origin', '*')
                        .expect(200, done);
                });
            });
        });

        describe('serving cross-domain for webfonts', function() {
            FONT.forEach(function(f) {
                it('should be enabled for .' + f.replace(/test/, ''), function(done) {
                    helper.request()
                        .get('/test.' + f)
                        .expect('Access-Control-Allow-Origin', '*')
                        .expect(200, done);
                });
            });

            it('should be enabled for font.css', function(done) {
                helper.request()
                    .get('/font.css')
                    .expect('Access-Control-Allow-Origin', '*')
                    .expect(200, done);
            });
        });

        describe('expires headers', function() {
            describe('force refresh', function() {
                DATA.split(' ').forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=0/)
                            .expect(200, done);
                    });
                });
            });

            describe('one hour', function() {
                FEED.forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=3600/)
                            .expect(200, done);
                    });
                });
            });

            describe('one week', function() {
                ICON.forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=604800/)
                            .expect(200, done);
                    });
                });
            });

            describe('one month', function() {
                var medias = MEDIA.filter(function(e) { return 'ico' != e; });
                medias.push('htc');
                medias.forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=2419200/)
                            .expect(200, done);
                    });
                });
            });

            describe('one year', function() {
                'js jsonp css'.split(' ').forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=29030400/)
                            .expect(200, done);
                    });
                });
            });

            describe('one month for every one else', function() {
                MISC.forEach(function(f) {
                    it('should be set for .' + f, function(done) {
                        helper.request()
                            .get('/test.' + f)
                            .expect('cache-control', /public,max-age=2419200/)
                            .expect(200, done);
                    });
                });
            });
        });

        it('should prevent mobile network providers from modifying your site', function(done) {
            helper.request()
                .get('/test.html')
                .expect('cache-control', /no-transform/)
                .expect(200, done);
        });

        it('should remove ETag header', function(done) {
            helper.request()
                .get('/test.html')
                .expect(200)
                .end(function(err, res) {
                    res.headers.should.not.have.property('etag');
                    done();
                });
        });

        it('should set Keep-Alive Header', function(done) {
            helper.request()
                .get('/test.html')
                .expect('connection', 'keep-alive')
                .expect(200, done);
        });

        describe('no-www', function() {
            it('should be enforced if options.www is false', function(done) {
                helper
                    .stop()
                    .create({ server: 'http', www: false })
                    .start()
                    .request()
                    .get('/test.html')
                    .set('host', 'www.example.com')
                    .expect('location', '//example.com/test.html')
                    .expect(301, done);
            });

            it('should be enforced and keep query string', function(done) {
                helper.request()
                    .get('/test.html?response=42')
                    .set('host', 'www.example.com')
                    .expect('location', '//example.com/test.html?response=42')
                    .expect(301, done);
            });

            it('should do nothing if not present', function(done) {
                helper.request()
                    .get('/test.html')
                    .set('host', 'example.com')
                    .expect(200, done);
            });
        });

        describe('www', function() {
            it('should be enforced if options.www is true', function(done) {
                helper
                    .stop()
                    .create({ server: 'http', www: true })
                    .start()
                    .request()
                    .get('/test.html')
                    .set('host', 'example.com')
                    .expect('location', '//www.example.com/test.html')
                    .expect(301, done);
            });

            it('should be enforced and keep query string', function(done) {
                helper.request()
                    .get('/test.html?response=42')
                    .set('host', 'example.com')
                    .expect('location', '//www.example.com/test.html?response=42')
                    .expect(301, done);
            });

            it('should do nothing if present', function(done) {
                helper.request()
                    .get('/test.html')
                    .set('host', 'www.example.com')
                    .expect(200, function() {
                        helper
                            .stop()
                            .create({ server: 'http' })
                            .start();
                        done();
                    });
            });
        });

        describe('cache busting', function() {
            var token = Math.floor(Math.random() * 10e7); // date format yyyyMMdd, random here
            'js css png jpg gif'.split(' ').forEach(function(f) {
                it('should work for .' + f, function(done) {
                    helper.request()
                        .get('/test.' + token + '.' + f)
                        .expect(200, done);
                });
            });
        });

        describe('access to backup and source files', function() {
            'htaccess git gitignore'.split(' ').forEach(function(f) {
                it('should be blocked for .' + f, function(done) {
                    helper.request()
                        .get('/.' + f)
                        .expect(403, done);
                });
            });
        });

        describe('access to backup and source files', function() {
            'bak config sql fla psd ini log sh inc swp dist'.split(' ').forEach(function(f) {
                it('should be blocked for .' + f, function(done) {
                    helper.request()
                        .get('/.' + f)
                        .expect(403, done);
                });
            });
        });

        it("should not advertise what kind of server we're running", function(done) {
            helper.request()
                .get('/test.html')
                .expect(200)
                .end(function(err, res) {
                    res.headers.should.not.have.property('X-Powered-By');
                    done();
                });
        });
    });

    describe('#createServer', function() {
        var server;

        before(function() {
            helper.stop();
        });

        afterEach(function() {
            server.close();
        });

        it('should create an express server', function(done) {
            var app = h5bp.createServer({ server: 'express' });
            app.get('/', function(req, res) { res.end('ok'); });
            server = app.listen(8080);
            request(server)
                .get('/')
                .expect(200, done);
        });

        it('should create a connect server', function(done) {
            var app = h5bp.createServer({ server: 'connect' });
            app.use(function(req, res) { res.end('ok'); });
            server = app.listen(8080);
            request(server)
                .get('/')
                .expect(200, done);
        });

        it('should create a basic http server', function(done) {
            var app = h5bp.createServer({ server: 'http' }, function(req, res) { res.end('ok'); });
            server = app.listen(8080);
            request(server)
                .get('/')
                .expect(200, done);
        });

        // TODO: add parameters
    });

});

var helper = {
    create: function(options) {
        options = options || {};
        if ('http' == options.server) {
            var middleware = h5bp(options);
            this.app = require('http').createServer(function(req, res) {
                try {
                    middleware(req, res);
                }
                catch(error) {
                    res.writeHead(error.status);
                    res.end(error.toString());
                    return;
                }

                fs.readFile(__dirname + '/fixtures' + url.parse(req.url).pathname, function(err, data) {
                    if(err) {
                        res.writeHead(404);
                        res.end(err.toString());
                        return;
                    }

                    res.writeHead(200, {
                        'content-length': data.length
                    });
                    res.end(data);
                });
            });
        }
        else {
            this.app = express();
            this.app.use(h5bp(options));
            this.app.use(express.static(__dirname + '/fixtures'));
            this.app.use(express.errorHandler());
        }
        return this;
    },

    start: function() {
        if (this.server) return this;
        this.server = this.app.listen(1337);
        return this;
    },

    stop: function() {
        if (!this.server) return this;
        this.server.close();
        this.server = null;
        return this;
    },

    request: function() {
        return request(this.server);
    }
};
