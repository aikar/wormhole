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

(function () {
  "use strict";
  // Define exports
  module.exports = function (client, channel, callback) {
    if (typeof channel == 'function') {
      callback = channel;
      channel = '__unknown__';
      console.error("[WORMHOLE] Warning - Deprecated use of Wormhole. Please see v3+ notes and pass a Channel. Defaulting to unknown")
      
    }
    
    if (typeof client._wormhole == 'undefined') {
      
      var warningShowed = false;
      Object.defineProperty(client, '_wormhole', {
        configurable: false,
        enumerable: false,
        value: {
          channels: {}
        }
      })
      client.origwrite = client.write;
      
      client.write = WormholeWrite;
      client.writeFd = WormholeWriteFd;
      if (typeof callback == 'function') {
        var messageQueue = [];
        var buffer = '', idx;
        client.on('fd', function(fd) {
          if (messageQueue.length) {
            var msg = messageQueue.shift();
            triggerChannel(msg[0], msg[1], fd);
          };
        });
        client.on('data', function (data) {
          buffer += data.toString();
          var start = 0;
          try {
            while ( (idx = buffer.indexOf("\n", start)) != -1) {
              var json = buffer.substr(start, idx - start);;
              var obj = JSON.parse(json);
              
              if (obj && obj._ && obj._.length && Object.keys(obj).length == 1) {
                if (!obj._[2]) {
                  triggerChannel(client, obj._)
                } else {
                  // expecting FD
                  messageQueue.push([client, obj._]);
                }
              } else {
                if (!warningShowed) {
                  warningShowed = true;
                  console.error("[WORMHOLE] Warning - Deprecated use of Wormhole. Other end sent 2.0 style data, please update other end to 3+! Using __unknown__ channel.");
                }
                triggerChannel(client, ['__unknown__', obj], fd)
              }
              start = idx+1;
            }
          } catch (e) {
            start = idx+1;
            triggerChannel(client, ['__error__', e], null);
          }
          
          buffer = buffer.substr(start);
        });
      }
    }
    if (client._wormhole.channels[channel] == undefined) {
      client._wormhole.channels[channel] = [];
    }
    client._wormhole.channels[channel].push(callback);
  };
  
  module.exports.WormholeWrite = WormholeWrite;
  
  function triggerChannel(client, obj, fd) {
    //console.log("triggering",obj[0], obj[1])
    var cbs = client._wormhole.channels[obj[0]] || [];
    if (!cbs.length && client._wormhole.channels['__unknown__']) {
      cbs = cbs.concat(client._wormhole.channels['__unknown__']);
    }
    if (obj[0] != '__error__' && client._wormhole.channels['*']) {
      cbs = cbs.concat(client._wormhole.channels['*'])
    }
    if (cbs.length) {
      var len = cbs.length;
      for (var i = 0; i < len; i++ ) {
        var cb = cbs[i];
        if (typeof cb == 'function') {
          if (cb.call(client, obj[1], fd, obj[0])) {
            i = len
          }
        }
      }
    }
  }
  var writeWarningShowed = false;
  function WormholeWrite(ch, data) {
    if (typeof data == 'undefined') {
      data = ch;
      ch = '__unknown__';
      if (!writeWarningShowed) {
        writeWarningShowed = true;
        console.error("[WORMHOLE] Warning - Deprecated use of write(). Please see v3+ notes and pass a Channel. Defaulting to __unknown__")
        
        try {
          throw new Error("");
        } catch (e) {
          console.error(e.stack)
        }
      }
    }
    data = {_:[ch,data]}  
    return this.origwrite(JSON.stringify(data)+"\n");
  }
  function WormholeWriteFd(channel, data, fd) {
    data = {_:[channel,data,1]};
    return this.origwrite(JSON.stringify(data)+"\n", 'utf8', fd);
  }
})();

