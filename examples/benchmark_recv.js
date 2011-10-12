var
    Wormhole = require('../lib/wormhole'),
    net = require('net'),
    util = require('util'),
    spawn = require('child_process').spawn,
    stdin = process.openStdin();
    
var dump = require('sys').inspect;
    var start = new Date();
    var i = 0
    var x = 0;

net.createServer(function(conn)
{
    Wormhole(conn, function(e, msg)
    {
        x++;
        if (x > 1000) {
            i++;
            x = 0;
            var diff = (new Date() - start) / 1000;
            util.print("\rReceived " + i +"k messages - Rate: " + (i / diff).toFixed(1) + "k messages/sec");
        }
        //console.log("SERVER: Got line: ", dump(msg));
    }, "_msg", "server");
}).listen(9911, function() {
    // spawn the sender    
    spawn(process.execPath, [__dirname + '/others/senddata.js']);
    spawn(process.execPath, [__dirname + '/others/senddata.js']);
});
