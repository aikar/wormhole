var
  Wormhole = require('../../lib/wormhole'),
  net = require('net'),
  stdin = process.openStdin();
  
var dump = require('sys').inspect;

var SEND_PER_TICK = 10;

var client = net.createConnection(9911)
client.on('connect', function()
{
  Wormhole(client, 'Benchmark');
  
  var data = {call: 'foo', args: [1,"2",3.2,2222,true,"false",{x:'y'}]};
  function senddata() {
    client.write('Benchmark', data);
  }
  function repeat() {
    for (var i = 0; i < SEND_PER_TICK; i++) {
      senddata();
    }
    process.nextTick(repeat);
  };
  repeat();
});
