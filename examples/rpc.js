var    
  Wormhole = require('../lib/wormhole'),
  net = require('net'),
  util = require('util'),
  spawn = require('child_process').spawn,
  stdin = process.stdin;
  
var server = spawn(process.execPath, [__dirname + '/others/rpcserver.js']);
// give server a little time to boot up 
setTimeout(function() {
  var client = net.createConnection(9112, function() {
    // connected
    var pendingReplies = {};
    var counter = 1;
    Wormhole(client, 'rpc', function(msg) {
      // server is informing us on connect what commands are avail
      if (msg.methods) {
        console.log("Type a command, followed by args, (eg: `foo foobar barbaz`)");
        msg.methods.forEach(function(v, k) {
          util.print(k+1 +": " + v[0] + " - " + v[1] + "\n");
        });
      // server is responding to an RPC call
      } else if (msg.reply) {
        if (pendingReplies[msg.reply.id]) {
          pendingReplies[msg.reply.id].cb.call(client, msg.reply.result);
          delete pendingReplies[msg.reply.id];
        }
      }
    });
    stdin.resume();
    stdin.on('data', function(data) {
      data = data.toString().trim();
      // clean input, get command, args and a message id
      var args = data.split(" ");
      var cmd = args.shift();
      var mid = counter++;
      
      // Add the pending callback
      pendingReplies[mid] = {
        cmd: cmd,
        cb: function(result) {
          console.log("Command:", cmd, "- Responded:", result);
        }
      };
      // send the RPC request
      var rpcPayload = {call: cmd, args: args, id: mid};
      console.log("Sending RPC Request:", rpcPayload);
      client.write('rpc', rpcPayload);
    })
  });
}, 500);
