//  Copyright (c) 2011 Daniel Ennis <aikar@aikar.co>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var vows   = require('vows');
var net    = require('net');
var wh     = require('../lib/wormhole');
var assert = require('assert');
var SlowBuffer = process.binding('buffer').SlowBuffer;
function buildSlowBuffer(data) {
  if (Array.isArray(data)) {
    var buffer = new SlowBuffer(data.length);
    data.forEach(function(v,k) {
      buffer[k] = v;
    });
    return buffer;
  };
  return null;
}
vows.describe('Wormhole').addBatch({
  'net.Stream overload': {
    '  ': {
      topic: function() {
        return new net.Stream(0);
      },
      'Overloads net.Stream with custom write': function(stream) {
        
        var origwrite = stream.write;
        
        wh(stream);
        assert.ok(stream.write !== origwrite);
      }
    }
  },
  'Wormhole C++ Bindings': {
    ' ': {
      topic: function() {
        return wh.wh.buildheader(3222);
      },
      'Builds proper header': function (header) {
        var comparebuffer = buildSlowBuffer([0xFF, 0x0F, 0x96, 0x0C, 0, 0]);
        assert.deepEqual(header, comparebuffer);
      }
    },
    '  ': {
      topic: function() {
        return new Buffer([0, 0, 0, 0xFF, 0x0F, 0x96, 0x0C, 0, 0]);
      },
      'getlength returns correct head position + len with bad start data': function (header) {
        var ret = wh.wh.getlength(header);
        assert.deepEqual(ret, [3, 3222]);
      }
    },
    '   ': {
      topic: function() {
        return new Buffer([0, 0, 0, 0xFF,0x0F]);
      },
      'getlength returns correct head position and null len': function (header) {
        var ret = wh.wh.getlength(header);
        assert.deepEqual(ret, [3, null]);
      }
    },
    '    ': {
      topic: function() {
        return new Buffer([0, 0, 0, 0xF1,0x0F]);
      },
      'getlength returns null when no start found': function (header) {
        var ret = wh.wh.getlength(header);
        assert.deepEqual(ret, null);
      }
    }
  },
  'MessagePack C++ Bindings': {
    ' ': {
      topic: function() {
        return wh.mp.pack({foo: 'bar'});
      },
      'Packs data correctly': function(packed) {
        var comparebuffer = buildSlowBuffer([0x81, 0xa3, 0x66, 0x6f, 0x6f, 0xa3, 0x62, 0x61, 0x72]);
        assert.deepEqual(packed, comparebuffer);
      },
      'Unpacks data correctly': function(packed) {
        var unpacked = wh.mp.unpack(packed);
        assert.deepEqual({foo: 'bar'}, unpacked);
      }
    }
  },
  'Server / Client': {
    ' ': {
      topic: function() {
        var self = this;
        var server = net.createServer(function(conn) {
          wh(conn, function(msg) {
            self.callback(null, msg, server);
          })
        });
        server.listen(function() {
          var client = net.createConnection(this.address().port, function() {
            wh(client);
            client.write({foo: 'bar'});
          })
        });
      },
      'Server received correct message': function(err, msg, server) {
        assert.deepEqual({foo: 'bar'}, msg);
        server.close();
      }
    },
    '  ': {
      topic: function() {
        var self = this;
        var server = net.createServer(function(conn) {
          wh(conn, function(msg) {
            conn.write(msg);
          });
        });
        server.listen(function() {
          var client = net.createConnection(this.address().port, function() {
            wh(client, function(msg) {
              self.callback(null, msg, server);
            });
            client.write({foo: 'bar'});
          })
        });
      },
      'Client received correct echo message': function(err, msg, server) {
        //console.log(arguments);
        assert.deepEqual({foo: 'bar'}, msg);
        server.close();
      }
    }
  }
}).export(module);
