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
  var binding  = require('./whBindings'),
      Wormhole = binding.wormhole,
      pack     = binding.pack;
  
  var dump = require('sys').inspect;

  // Define exports
  module.exports = function(client, callback) {
    client.origwrite = client.write;
    client.write = function(data) {
      var packed = pack(data);
      return client.origwrite(packed);
    };
    if (typeof callback == 'function') {
      var wormhole = new Wormhole();
      var result;
      client.on('data', function (data) {
        wormhole.unpack(data);
        do {
          // Segfaults here?
          result = wormhole.getResult();
          if (typeof result !== 'undefined') {
            callback(result);
          } else {
            break;
          }
        } while (true);
      });
    }
  };
})();
