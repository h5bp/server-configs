/*jslint white: false */
/*global $ */
$(function () {
    var results = {},
      container,
      resultsContainer,
      i;

  $('<h1>Server Config tests</h1>').appendTo('body');

  container = $('<ul />')
    .addClass('tests clearfix')
    .appendTo('body');

  $('<h2 id="resultsHeader">Results : select above to display</h2>')
    .appendTo('body');

  resultsContainer = $('<div />')
    .appendTo('body');

  function parseHeaders(input) {
    var split = [], output = {}, i, header;

    split = input.split("\n");
    while(split.length) {
      header = split.shift();
      if (header) {
        i = header.indexOf(':');
        output[header.substr(0, i)] = header.substr(i+1).trim();
      }
    }

    return output;
  }

  function translateExpires(input) {
    var match,
      period = 's',
      factor = {
        'y': 60 * 60 * 24 * 365,
        'M': 60 * 60 * 24 * 30,
        'w': 60 * 60 * 24 * 7,
        'd': 60 * 60 * 24,
        'h': 60 * 60,
        'm': 60,
        's': 1
      };

    if (!input) {
      return 0;
    }
    if (typeof input === 'number') {
      return input;
    }

    match = input.match(/(\d+)(\w)/);
    if (match[2]) {
      period = match[2];
    }
    if (period !== 'M') {
      period = period.toLowerCase();
    }
    return match[1] * factor[period];
  }

  function check(title, test, headers, func) {
    var elem = $('<li>' + title + '</li>');
    try{
      if (func(test, headers)) {
        elem.addClass('pass');
      } else {
        elem.addClass('fail');
      }
    } catch(e) {
      elem
        .addClass('fail')
        .attr('title', e);
    }
    return elem;
  }

  function checkContentType(test, headers) {
    if (headers['Content-Type'].indexOf(test.type) === 0) {
      return true;
    }
    throw headers['Content-Type'] + ' does not match ' + test.type;
  }

  function checkCharset(test, headers) {
    var hasCharset = headers['Content-Type'].indexOf(test.charset);
    if (hasCharset > -1) {
      return true;
    }
    throw headers['Content-Type'] + ' does not contain ' + test.charset;
  }

  function checkGzip(test, headers) {
    var isZipped = (headers['Content-Encoding'] && headers['Content-Encoding'] === 'gzip');

    if ((test.gzip && isZipped) || (!test.gzip && !isZipped)) {
      return true;
    }
    if (test.gzip) {
      throw "Expected Gzip headers, not found";
    }
    throw "Expected no Gzip headers, gzip headers sent";
  }

  function checkExpires(test, headers) {
    var accuracy = 10,
      maxAge = 0,
      expires = 0,
      testExpires;

    if (headers['Cache-Control']) {
      maxAge = parseInt(headers['Cache-Control'].replace(/\D+/, ''), 10) || 0;
    }
    if (headers.Expires) {
      expires = (new Date(headers.Expires).getTime() - new Date(headers.Date).getTime()) / 1000;
    }

    testExpires = translateExpires(test.expires);

    if (testExpires) {
      if (expires - testExpires < accuracy && maxAge -testExpires < accuracy) {
        return true;
      }
      throw "Expected to expire in " + testExpires + "(" + test.expires + "), found " + expires;
    } else {
      if (maxAge < accuracy && expires < accuracy) {
        return true;
      }
      throw "Expected to already be expired, found to expire in " + expires + " with max age " + maxAge;
    }
  }

  function processTest(test) {
    var id = test.url
			.replace(/files\/(\w+\.)?/, '')
			.replace(/\W/, '');

    $('<li><a href="' + test.url + '">' + id + '</a></li>')
      .attr('id', id)
      .addClass('pending')
      .click(function(e) {
        e.preventDefault();

        $('#resultsHeader').text("Results : " + id);

        results[this.id]
          .show()
          .siblings().hide();
      })
      .appendTo(container);

    results[id] = $('<div />')
      .attr('id', 'results' + id)
      .hide()
      .appendTo(resultsContainer);

    (function(id) {
      $.ajax({
        cache: false,
        url: test.url,
        success: function(data, textStatus, jqXHR) {
          var headerString,
            headers,
            header,
            i,
            result,
            elem,
            ul;

          headerString = jqXHR.getAllResponseHeaders();
          headers = parseHeaders(headerString);

          ul = $('<ul />')
            .addClass('headers clearfix')
            .appendTo(results[id]);

          elem = check('Content Type', test, headers, checkContentType);
          elem.appendTo(ul);
          if (test.charset) {
            elem = check('Charset', test, headers, checkCharset);
            elem.appendTo(ul);
          }
          elem = check('Gzip', test, headers, checkGzip);
          elem.appendTo(ul);
          elem = check('Expires', test, headers, checkExpires);
          elem.appendTo(ul);

          if (test.headers) {
            for(i in test.headers) {
              if (test.headers.hasOwnProperty(i)) {
                elem = $('<li>' + i + '</li>');
                if (headers[i] && headers[i] === test.headers[i]) {
                  elem
                    .attr('title', i + ": " + headers[i] + " matches expectations")
                    .addClass('pass');
                } else {
                  elem
                    .attr('title', i + ": " + headers[i] + " does not match " + i + ": " + test.headers[i])
                    .addClass('fail');
                }
                elem.appendTo(ul);
              }
            }
          }

          if (test.noheaders.length) {
            for(i = 0; i < test.noheaders.length; i += 1) {
              elem = $('<li>' + test.noheaders[i] + '</li>');
              if (!headers[test.noheaders[i]]) {
                elem
                  .attr('title', test.noheaders[i] + " header not wanted and not found")
                  .addClass('pass');
              } else {
                elem
                  .attr('title', test.noheaders[i] + ": header found but not expected")
                  .addClass('fail');
              }
              elem.appendTo(ul);
            }
          }

          if (results[id].find('.fail').length) {
            $('#' + id)
              .removeClass('pending')
              .addClass('fail');
          } else {
            $('#' + id)
              .removeClass('pending')
              .addClass('pass');
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          var ul;

          ul = $('<ul />')
            .addClass('headers clearfix')
            .appendTo(results[id]);

          $('<li />')
            .addClass('fail')
            .text(jqXHR.status)
            .appendTo(ul);

          ul.appendTo(results[id]);

          $('#' + id)
            .removeClass('pending')
            .addClass('fail fatal')
            .attr('title', errorThrown);
        },
        complete: function(jqXHR, textStatus) {
          var elem,
            headerString,
            header,
            headers;

          headerString = jqXHR.getAllResponseHeaders();
          headers = parseHeaders(headerString);

          $('<h3>Headers</h3>')
            .appendTo(results[id]);
          elem = $('<dl />');
          for(header in headers) {
            if (headers.hasOwnProperty(header)) {
              $('<dt>' + header + '</dt>').appendTo(elem);
              $('<dd>' + headers[header] + '</dd>').appendTo(elem);
            }
          }
          elem.appendTo(results[id]);
        }
      });
    }(id));
  }

  $.ajax({
    url: 'tests.json',
    success: function(data, textStatus, jqXHR) {
      var test;

      while (data.length) {
        test = data.shift();
        processTest(test);
      }
    }
  });
});
