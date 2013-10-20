



var SENDING_AGENTS = 2;
var SAMPLE_EVERY = 5000;





var
    Wormhole = require('../lib/wormhole'),
    net = require('net'),
    util = require('util'),
    spawn = require('child_process').spawn;

var start, i = 0, x = 0,SAMPLE_MULT  = SAMPLE_EVERY/1000;
net.createServer(function(conn)
{
    if (!start) start = new Date()
    Wormhole(conn, 'Benchmark', function(e, msg)
    {
        if (x++ > SAMPLE_EVERY) {
            i++;
            x = 0;
            var diff = (new Date() - start) / SAMPLE_EVERY;
            util.print("\rReceived " + i*SAMPLE_MULT +"k messages - Rate: " + (i / diff).toFixed(1) + "k messages/sec");
        }
        //console.log("SERVER: Got line: ", dump(msg));
    }, "_msg", "server");
}).listen(9911, function() {
    // spawn the senders
    for (var i = 0; i < SENDING_AGENTS; i++) {
        spawn(process.execPath, [__dirname + '/others/senddata.js'], {customFds: [-1, 1, 2]});
    }
});
process.on('SIGINT', function() {
    util.print("\n");
    process.reallyExit();
})
