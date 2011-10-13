var
    Wormhole = require('../lib/wormhole'),
    net = require('net'),
    util = require('util'),
    fork = require('child_process').fork;
    

var start;
    var i = 0
    var x = 0;
net.createServer(function(conn)
{
    if (!start) start = new Date()
    Wormhole(conn, 'Benchmark', function(msg)
    {
        //console.log(msg);
        if (x++ > 10000) {
            i++;
            x = 0;
            var diff = (new Date() - start) / 10000;
            util.print("\rReceived " + i*10 +"k messages - Rate: " + (i / diff).toFixed(1) + "k messages/sec");
        }
    }, "_msg", "server");
}).listen(9911, function() {
    // spawn the senders   
    fork(__dirname + '/others/senddata.js');
    fork(__dirname + '/others/senddata.js');
    //fork(__dirname + '/others/senddata.js');
});
