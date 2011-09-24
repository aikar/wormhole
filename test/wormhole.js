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
var netb   = process.binding('net');
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
  'net.Stream modification': {
    '  ': {
      topic: function() {
        return new net.Stream(0);
      },
      'Overloads net.Stream with custom write once': function(stream) {
        
        var origwrite = stream.write;
        
        wh(stream);
        assert.ok(stream.write !== origwrite, "Should not have original write");
        
        wh(stream);
        assert.ok(stream.origwrite !== wh.WormholeWrite, "origwrite should not be WormholeWrite");
      },
      'Adds a _wormhole property thats not enumerable': function(stream) {
        
        var origwrite = stream.write;
        
        wh(stream);
        assert.ok(typeof stream._wormhole !== 'undefined', "Should have _wormhole");
        for (x in stream) {
          assert.ok(x !== '_wormhole', "Should not be enumerable");
        }
      }
    }
  },
  'Server / Client': {
    ' ': {
      topic: function() {
        var self = this;
        var server = net.createServer(function(conn) {
          var fired = false;
          wh(conn, 'test', function(msg) {
            fired = true;
            self.callback(msg, server);
          });
          conn.on('close', function() {
            if (!fired) {
              server.close()
              self.callback("client disconnected and no event was fired", null);
            }
          });
        });
        server.listen(function() {
          var client = net.createConnection(this.address().port, function() {
            wh(client,'test');
            client.write('test', {foo: 'bar'});
            //client.end();
          })
        });
      },
      'Server received correct message': function(msg, server) {
        assert.deepEqual(msg, {foo: 'bar'});
        //server.close();
      }
    },
    '  ': {
      topic: function() {
        var self = this;
        var server = net.createServer(function(conn) {
          var fired = false;
          wh(conn, 'test', function(msg) {
            fired = true;
            conn.write('test', msg);
          });
          conn.on('close', function() {
            if (!fired) {
              server.close()
              self.callback("client disconnected and no event was fired");
            }
          });
        });
        server.listen(function() {
          var client = net.createConnection(this.address().port, function() {
            wh(client, 'test',function(msg) {
              self.callback(msg, server);
            });
            client.write('test', {foo: 'bar'});
            client.end();
          })
        });
      },
      'Client received correct echo message': function(msg, server) {
        assert.deepEqual(msg, {foo: 'bar'});
      }
    },
    '           ': {
      topic: function() {
        var self = this;
        var p = netb.socketpair();
        var s1 = new net.Socket(p[0], 'unix');
        var s2 = new net.Socket(p[1], 'unix');
        var fired = false;
        
        wh(s1,'fdtest', function(msg, fd) {
          fired = true;
          self.callback(null, msg, fd);
        });
        s1.on('close', function() {
          if (!fired) {
            self.callback("Never got message from fd sender");
          }
        });
        wh(s2);
        s1.resume();
        s2.resume();
        s2.writeFd('fdtest', {foo: 'bar'}, s2.fd);
        s2.end();
      },
      'Can Receive FDs': function(err, msg, fd) {
        assert.deepEqual(msg, {foo: 'bar'});
        assert.ok(fd, "Should of got an fd");
        
      }
    }
    
  },
  'Channels': {
    ' ': {
      topic: function() {
        
        var expectedMessages = {i:0, m:[
          {ch: 'CH3', msg: {foo: 1}},
          {ch: '*1', msg: {foo: 1}},
          {ch: 'CH2', msg: {foo: 2}},
          {ch: '*1', msg: {foo: 2}},
          {ch: 'CH1', msg: {bar: 3}},
          {ch: '*1', msg: {bar: 3}},
          {ch: 'multi1', msg: 'test'},
          {ch: 'multi2', msg: 'test'},
          {ch: '*1', msg: 'test'},
          {ch: '*2', msg: 'test'},
        ], assertions: []};
        var verify = function(ch, actual) {
          var i = expectedMessages.i;
          var expected = expectedMessages.m[i];
          expectedMessages.assertions.push([expected.ch, ch, "Should return matching channel for index" + i]);
          expectedMessages.assertions.push([expected.msg, actual, "Should return matching channel for index" + i]);
          expectedMessages.i++;
        }
        var self = this;
        var fired = false;
        var server = net.createServer(function(conn) {
          wh(conn, 'CH1', function(msg) {
            verify('CH1', msg);
          });
          wh(conn, 'CH3', function(msg) {
            verify('CH3', msg);
          });
          wh(conn, 'CH2', function(msg) {
            verify('CH2', msg);
          });
          wh(conn, 'multi', function(msg) {
            verify('multi1', msg);
          });
          wh(conn, 'multi', function(msg) {
            verify('multi2', msg);
          });
          wh(conn, '*', function(msg) {
            verify('*1', msg);
            if (msg != 'test') {
              return true;
            } else {
              return false;
            }
          });
          wh(conn, '*', function(msg) {
            verify('*2', msg);
          });
          wh(conn, 'DONE', function(msg) {
            fired = true;
            self.callback(null, expectedMessages);
            conn.end();
            server.close();
          });
          conn.on('close', function() {
            if (!fired) {
              server.close()
              self.callback("client disconnected and no event was fired");
            }
          });
        });
        server.listen(function() {
          var client = net.createConnection(this.address().port, function() {
            wh(client);
            client.write('CH3', {foo: 1});
            client.write('CH2', {foo: 2});
            client.write('CH1', {bar: 3});
            client.write('multi', 'test');
            client.write('DONE', 'DONE');
            client.end()
          })
        });
      },
      'Sends correct messages to correct channels': function(expectedMessages) {
        assert.equal(expectedMessages.i, expectedMessages.m.length, "Should of received " + expectedMessages.m.length + " messages, got " + expectedMessages.i)
        expectedMessages.assertions.forEach(function(art) {
          assert.deepEqual(art[0], art[1], art[2]);
        });
      }
    },
    '  ': {
        topic: function() {
        
        var receivedMessages = [];
        var verify = function(ch, actual) {
          var i = expectedMessages.i;
          var expected = expectedMessages.m[i];
          expectedMessages.assertions.push([expected.ch, ch, "Should return matching channel for index" + i]);
          expectedMessages.assertions.push([expected.msg, actual, "Should return matching channel for index" + i]);
          expectedMessages.i++;
        }
        var self = this;
        var fired = false;
        var server = net.createServer(function(conn) {
          wh(conn, '__unknown__', function(msg) {
            receivedMessages.push(['__unknown__', msg]);
          });
          wh(conn, 'CH1', function(msg) {
            receivedMessages.push(['CH1', msg]);
          });
          wh(conn, 'DONE', function(msg) {
            fired = true;
            self.callback(null, receivedMessages);
            conn.end();
            server.close();
          });
          conn.on('close', function() {
            if (!fired) {
              server.close()
              self.callback("client disconnected and no event was fired");
            }
          });
        });
        server.listen(function() {
          var client = net.createConnection(this.address().port, function() {
            wh(client);
            client.write('foo', {foo: 1});
            client.write('CH1', {foo: 2});
            client.write('DONE', 'DONE');
            client.end();
          })
        });
      },
      'Sends to __unknown__ channel if no listeners': function(receivedMessages) {
        assert.equal(receivedMessages.length, 2)
        
        var expected = [
          ['__unknown__',{foo:1}],
          ['CH1', {foo:2}]
        ];
        assert.deepEqual(expected, receivedMessages);
        
      }
    },
    '     ': {
      topic: function() {
        
        var self = this;
        var server = net.createServer(function(conn) {
          var fired = false;
          wh(conn, '__error__', function(msg) {
            fired = true;
            self.callback(null, true);
            conn.end();
            //server.close();
          });
          conn.on('close', function() {
            if (!fired) {
              server.close()
              self.callback("client disconnected and no event was fired");
            }
          })
        });
        server.listen(function() {
          var client = net.createConnection(this.address().port, function() {
            client.write("foo\n");
            client.end();
          })
        });
      },
      'Sends to __error__ channel on bad data': function(success) {
        assert.ok(success);
      }
    }
    
  }
}).export(module);

