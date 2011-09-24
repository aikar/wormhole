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

/**
 * Really only need 1 example...
 */


// Server
var
    Wormhole = require('../lib/wormhole'),
    net = require('net'),
    stdin = process.stdin;
var dump = require('sys').inspect;

net.createServer(function(conn) {
    Wormhole(conn, 'example', function(msg) {
        console.log("SERVER: Got message: ", dump(msg));
        conn.write('example', {result: parseInt(msg.input) + 10});
    });
}).listen(function() {
  console.log("Server listening");
  
  // Client
  var client = net.createConnection(this.address().port)
  client.on('connect', function() {
    console.log("Client connected to server");
    Wormhole(client, 'example', function(msg) {
      console.log("CLIENT: Got message: ", dump(msg));
      console.log("Server responded to client with: ", msg.result);
    });
    
    process.stdin.resume();
    process.stdin.on('data', function (data) {
      data = data.toString().trim();
      console.log("asking server to do 10 + " + data);
      client.write('example', {    
        input: data
      })
    });
  });
});

