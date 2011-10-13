var
  Wormhole = require('../../lib/wormhole'),
  net = require('net')

var SEND_PER_TICK = 200;

var client = net.createConnection(9911)
client.on('connect', function()
{
  //Wormhole(client, 'Benchmark');
  
  //var data = {call: 'foo', args: [1,"2",3.2,2222,true,"false",{x:'y'}]};
  var data = '{"_":["Benchmark",{"call":"foo","args":[1,"2",3.2,2222,true,"false",{"x":"y"}]}]}' +"\n";
  
  function senddata() {
    for(var i = 0; i < SEND_PER_TICK; i++) {
      //console.log(data);
      client.write(data);
    }
  }
  client.on('drain', function() {
    //console.log(process.pid, 'drain')
    senddata();
  });
  senddata();
  
});
