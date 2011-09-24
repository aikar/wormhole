var
    Wormhole = require('../../lib/wormhole'),
    net = require('net');
    
var dump = require('sys').inspect;


var commands = {
  foo: function(bar, baz) {
    /*@doc: responds with values of arg1 and arg2@*/
    this.reply("called foo() with " + bar +","+ baz);
  },
  bar: function(num) {
    /*@doc: adds 1022 to arg1@*/
    this.reply(parseInt(num) + 1022);
  },
  async: function(time) {
    /*@doc: arg1 is time in milliseconds to wait before responding@*/
    var self = this;
    setTimeout(function() {
      self.reply((new Date()).getTime())
    }, time)
  }
};

net.createServer(function(conn) {
    Wormhole(conn, 'rpc', function(msg) {
      if (msg && msg.id && msg.call) {
        // We need a way for commands to be able to respond directly to the
        // message that called them, so lets make a "scope" with a reply func
        // to call the method with instead of redefining every command
        // inside of the message handler.
        var reply = {
          reply: function(response) {
            conn.write('rpc', {reply: { id: msg.id, result: response}});
          }
        };
        if (commands[msg.call] !== undefined) {
          // make sure args is an array
          var args = msg.args && Array.isArray(msg.args) && msg.args || [];
          commands[msg.call].apply(reply, args);
        }
      }
    });
    // inform the client what commands are avail.
    var methods = Object.keys(commands);
    var methodsArr = [];
    var regex = new RegExp('\\/\\*@doc:\\s*(.*?)@\\*\\/','mi');
    var methods = Object.keys(commands);
    // Build the methods array with documentation.
    methods.forEach(function(method) {
      var funcSource = commands[method].toString();
      methodsArr.push([method, regex.exec(funcSource)[1]]);
    });
    conn.write('rpc', {methods: methodsArr});
}).listen(9112);
