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
  
  // Define exports
  module.exports = function(client, callback) {
    client.origwrite = client.write;
    client.write = function(data) {
      //circular_check(data);
      var packed = pack(data);
      return client.origwrite(packed);
    };
    if (typeof callback == 'function') {
      var wormhole = new Wormhole();
      var result;
      client.on('data', function (data) {
        wormhole.feed(data);
        while ( (result = wormhole.getResult()) !== undefined) {
          callback(result);
        }
      });
    }
  };
  module.exports.pack = pack;
  function circular_check(data) {
    var seen = {};
    function check(depth, data) {
      for (var i = 0; i < depth; i++) {
        if (seen[i].data === data || seen[i].objs.indexOf(data) !== -1) {
          throw "Cowardly refusing to pack object with circular reference";
        }
      }
    }
    function setup(depth, data) {
      if (typeof seen[depth] != 'object' || seen[depth] == null) {
        //console.error("setup depth", depth, data);
        seen[depth] = {
          data: data,
          keys: Object.keys(data),
          idx: 0,
          objs: []
        };
      }
    }
    
    var i = 0;
    while (data !== null && typeof data == 'object') {
      //console.error('-------------');
      //console.error(typeof data, data)
      setup(i, data);
      data = seen[i].data;
      (function() {
        var keys = seen[i].keys;
        for ( var x = seen[i].idx; x < keys.length; seen[i].idx = ++x) {
          var tmpdata = data[keys[x]];
          //console.error(":: checking", x, ":", keys[x], " = ", tmpdata);
          if (typeof tmpdata == 'object') {
            data = tmpdata;
            check(i, data);
            //console.error("<<<<< ASCENDING", i, i +1);
            seen[i++].objs.push(data);
            return;
          }
        }
        //console.error("<<<<< DESCENDING", i, i -1);
        delete seen[i--];
        if (i >= 0) {
          data = seen[i].data
          seen[i].idx++;
        } else {
          data = null;
        }
        //console.error("NEW DATA", data);
      })();
    
    }
  }
})();
