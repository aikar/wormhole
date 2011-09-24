var
    Wormhole = require('../lib/wormhole'),
    net = require('net'),
    util = require('util'),
    spawn = require('child_process').spawn,
    stdin = process.openStdin();
    
var dump = require('sys').inspect;
var start;
    var i = 0
    var x = 0;
net.createServer(function(conn)
{
    if (!start) start = new Date()
    Wormhole(conn, 'Benchmark', function(e, msg)
    {
        if (x++ > 5000) {
            i++;
            x = 0;
            var diff = (new Date() - start) / 5000;
            util.print("\rReceived " + i +"k messages - Rate: " + (i / diff).toFixed(1) + "k messages/sec");
        }
        //console.log("SERVER: Got line: ", dump(msg));
    }, "_msg", "server");
}).listen(9911, function() {
    // spawn the senders   
    spawn(process.execPath, [__dirname + '/others/senddata.js']);
    spawn(process.execPath, [__dirname + '/others/senddata.js']);
    //spawn(process.execPath, [__dirname + '/others/senddata.js']);
});
