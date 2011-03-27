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
        len = 0;
        hasLen = false,
        i = 0;
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
        do {
          // 6 byte head then body
          if (!hasLen) {
            for(; i < buffer.length; i++) {
              ////console.log('i', i, 'buff.len', buffer.length);
              //console.log('buffer[i] i+1', dump(buffer[i]),dump(buffer[i+1]));
              //console.log('i', i, 'buff.len', buffer.length, buffer[i] === 0xFF, i+1 < buffer.length, buffer[i+1] === 0x0F, i+5 < buffer.length);
              if(buffer[i] === 0xFF
                && i+1 < buffer.length
                && buffer[i+1] === 0x0F
                && i+5 < buffer.length
                ) {

                hasLen = true;
                len = whBinding.getlength(buffer);
                if (buffer.length > 6) {
                  i =+ 6;
                } else {
                  buffer = null;
                }

                break;
              }
            }
          }
          if (hasLen) {
            if (i + len <= buffer.length) {
              var dataBuffer = buffer.slice(i, len + i);
              //console.log('sliced buffer', dump(dataBuffer));
              var dataObj = mpBinding.unpack(dataBuffer);

              self.emit(msgEvent, dataObj);

              if (i + len >= buffer.length) {
                //console.log('nerf buffer');
                buffer = null;
              } else {
                var newBufferSize = buffer.length - (i + len);
                newBuffer = new Buffer(newBufferSize);
                //console.log('new index',i + len, buffer[i+len]);
                buffer.copy(newBuffer, 0,  i + len);
                buffer = newBuffer;
                //console.log('buffer left', dump(buffer));
              }
              hasLen = false;
              len = 0;
              i = 0;
            }
          }
        //console.log("i", i, typeof buffer, hasLen, len,buffer ? buffer.length : 0,buffer ? i < buffer.length : 0);
        } while (buffer
          && buffer.length
          && i < buffer.length
          && (
            !hasLen
            ||
            (
              hasLen && i + len < buffer.length
            )
          )
        );
      }
    });
  }

  require('sys').inherits(wormholeParser, require('events').EventEmitter);

  // Define exports
  module.exports = function(client, callback, eventName, clientName) {
    client.origwrite = client.write;
    client.write = function(data) {
      client.origwrite(wormholeParser.encode(data));
    };
    return new wormholeParser(client, callback, eventName, clientName);
  };
  module.exports.mp = mpBinding;
  module.exports.wh = whBinding;

})();
