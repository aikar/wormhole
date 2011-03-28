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

(function() {

  var mpBinding = require('./mpBindings');
  var whBinding = require('./whBindings');

  var dump = require('sys').inspect;

  var wormholeParser = function (stream, callback, msgEvent, clientName) {
    clientName = clientName || "default";
    msgEvent = msgEvent || '__msg';
    
    var self = this;
    
    if (callback) self.addListener(msgEvent, callback);
    
    var buffer = null,
        len = null;
        
    stream.on('data', function (data) {
      //console.log("[" + clientName + "] got data", dump(data));
      var newBuffer;
      if (data && data.length) {
        if (buffer) {
          newBuffer = new Buffer(buffer.length + data.length);
          buffer.copy(newBuffer);
          data.copy(newBuffer, buffer.length);
          buffer = newBuffer;
          //console.log('had a buffer, appended', dump(buffer));
        } else {
          //console.log('buffer is now data');
          buffer = data;
        }
        // 6 byte head then body
        if (!len && buffer.length >= 2) {
          
          var retlen = whBinding.getlength(buffer);
          if (retlen) {
            //console.log("got retlen", retlen);
            var i = retlen[0];
            len = retlen[1];
            
            // if the frame header was not found at start of buffer
            // readjust buffer to the header
            if (i) {
              //console.log("readjusting buffer");
              buffer = buffer.slice(i);
            }
            
            if (len) {
              //console.log("hasLen = true");
              buffer = buffer.slice(6);
            }
          } else {
            //console.log("destroying buffer cause getlength returned null");
            buffer = null;
          }
        } else if (!len && buffer[0] != 0xFF) {
          // on the extreme chance that we get a 1 byte buffer that is the
          // start of the frame header...
          //console.log("destroying buffer cause data had no frame header")
          buffer = null;
        }
        
        // If through all that we have a length...
        if (buffer && len && len <= buffer.length) {
          //console.log('unpacking buffer', dump(buffer));
          var dataObj = mpBinding.unpack(buffer);
          //console.log("unpacked as", dataObj);
          self.emit(msgEvent, dataObj);
          
          if (len == buffer.length) {
            //console.log("emptying buffer");
            buffer = null;
          } else {
            
            buffer = buffer.slice(len);
            //console.log('buffer left', dump(buffer));
          }
          len = 0;
        }
      }
    });
  }

  require('sys').inherits(wormholeParser, require('events').EventEmitter);

  // Define exports
  module.exports = function(client, callback, eventName, clientName) {
    client.origwrite = client.write;
    client.write = function(data) {
      var buffer = mpBinding.pack(data);
      var header = whBinding.buildheader(buffer.length);
      //console.log("sending:", header, buffer);
      client.origwrite(header);
      client.origwrite(buffer);
      return [header, buffer];
    };
    return new wormholeParser(client, callback, eventName, clientName);
  };
  module.exports.mp = mpBinding;
  module.exports.wh = whBinding;

})();
