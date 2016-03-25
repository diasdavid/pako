/*global describe, it*/


'use strict';


var pako    = require('../index');
var assert  = require('assert');

describe('Dictionary test', function () {
  // mimics tests from https://github.com/nodejs/node/blob/master/test/parallel/test-zlib-dictionary-fail.js
  it.skip('missing dictionary', (done) => {
    var inflate = new pako.Inflate();

    // String "test" encoded with dictionary "dict".
    inflate.push(new Buffer([ 0x78, 0xBB, 0x04, 0x09, 0x01, 0xA5 ]), true);
    assert(inflate.err);
    assert(/Missing dictionary/.test(inflate.err.message));
    done();
  });

  it.skip('bad dictionary', (done) => {
    var inflate = new pako.Inflate({ dictionary: new Buffer('fail') });

    // String "test" encoded with dictionary "dict".
    inflate.push(new Buffer([ 0x78, 0xBB, 0x04, 0x09, 0x01, 0xA5 ]), true);
    assert(inflate.err);
    assert(/Bad dictionary/.test(inflate.err.message));
    done();
  });

  // mimics tests from https://github.com/nodejs/node/blob/master/test/parallel/test-zlib-dictionary.js
  var spdyDict = new Buffer([
    'optionsgetheadpostputdeletetraceacceptaccept-charsetaccept-encodingaccept-',
    'languageauthorizationexpectfromhostif-modified-sinceif-matchif-none-matchi',
    'f-rangeif-unmodifiedsincemax-forwardsproxy-authorizationrangerefererteuser',
    '-agent10010120020120220320420520630030130230330430530630740040140240340440',
    '5406407408409410411412413414415416417500501502503504505accept-rangesageeta',
    'glocationproxy-authenticatepublicretry-afterservervarywarningwww-authentic',
    'ateallowcontent-basecontent-encodingcache-controlconnectiondatetrailertran',
    'sfer-encodingupgradeviawarningcontent-languagecontent-lengthcontent-locati',
    'oncontent-md5content-rangecontent-typeetagexpireslast-modifiedset-cookieMo',
    'ndayTuesdayWednesdayThursdayFridaySaturdaySundayJanFebMarAprMayJunJulAugSe',
    'pOctNovDecchunkedtext/htmlimage/pngimage/jpgimage/gifapplication/xmlapplic',
    'ation/xhtmltext/plainpublicmax-agecharset=iso-8859-1utf-8gzipdeflateHTTP/1',
    '.1statusversionurl\0'
  ].join(''));

  var input = [
    'HTTP/1.1 200 Ok',
    'Server: node.js',
    'Content-Length: 0',
    ''
  ].join('\r\n');

  it.skip('basic dictionary', (done) => {
    var output = '';
    var deflate = new pako.Deflate({ dictionary: spdyDict });
    var inflate = new pako.Inflate({ dictionary: spdyDict });

    deflate.onData = function (chunk) {
      inflate.push(chunk, false);
    };

    inflate.onData = function (chunk) {
      output += chunk;
    };

    deflate.onEnd = function () {
      inflate.push(new Buffer(0), true);
    };

    inflate.onEnd = function () {
      assert.equal(input, output);
      done();
    };

    deflate.push(input, true);
  });

  it.skip('deflate reset with dictionary', (done) => {
    var doneReset = false;
    var output = '';
    var deflate = new pako.Deflate({ dictionary: spdyDict });
    var inflate = new pako.Inflate({ dictionary: spdyDict });

    deflate.onData = function (chunk) {
      if (doneReset) {
        inflate.push(chunk, false);
      }
    };

    deflate.onEnd = function () {
      if (doneReset) {
        inflate.push(new Buffer(0), true);
      }
    };

    inflate.onData = function (chunk) {
      output += chunk;
    };

    inflate.onEnd = function () {
      assert.equal(input, output);
      done();
    };

    deflate.push(input, true);
    deflate.flush(function () {
      deflate.reset();
      doneReset = true;
      deflate.write(input, true);
    });
  });
});
