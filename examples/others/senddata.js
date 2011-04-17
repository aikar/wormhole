var
  wh = require('../../lib/wormhole'),
  net = require('net'),
  stdin = process.openStdin();
  
var dump = require('sys').inspect;

var SEND_PER_TICK = 7;

var largedata = require('fs').readFileSync(__dirname + '/2.4kdata');

var client = net.createConnection(9911)
client.on('connect', function()
{
  //comment out this line if your testing large data.
  wh(client);
  var i = 0;
  
  function senddata() {
    // change the comments to test with large messages.
    //client.write(largedata);
    client.write({call: 'foo', args: [1,2,3,2222,true,"false",{x:'y'}]});
  }
  function repeat() {
    for (var i = 0; i < SEND_PER_TICK; i++) {
      senddata();
    }
    process.nextTick(repeat);
  };
  repeat();
});
