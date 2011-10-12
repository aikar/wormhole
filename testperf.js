var util = require('util'),
    fork = require('child_process').fork;
    
var SEND_PER_TICK = 10;
if (!process.argv[2]) {
  fork(__filename, ['--child']).on('message', count);
  fork(__filename, ['--child']).on('message', count);
  var i = 0
  var x = 0;
  
  var start = new Date()
  function count() {
    if (x++ > 1000) {
      i++;
      x = 0;
      var diff = (new Date() - start) / 1000;
      util.print("\rReceived " + i +"k messages - Rate: " + (i / diff).toFixed(1) + "k messages/sec");
    }
  }
} else {
  var data = {call: 'foo', args: [1,"2",3.2,2222,true,"false",{x:'y'}]};
  function senddata() {
    process.send(['Benchmark', data]);
  }
  function repeat() {
    for (var i = 0; i < SEND_PER_TICK; i++) {
      senddata();
    }
    process.nextTick(repeat);
  };
  repeat();
}
