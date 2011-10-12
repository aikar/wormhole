var
    Wormhole = require('../lib/wormhole'),
    net = require('net'),
    util = require('util'),
    spawn = require('child_process').spawn,
    fork = require('child_process').fork;
    stdin = process.openStdin();
    
var dump = require('util').inspect;
var start;
    var i = 0
    var x = 0;

    if (!start) start = new Date()
    

    // spawn the senders   
    Wormhole(fork(__dirname + '/others/senddata.js'), 'Benchmark', count, "_msg", "server");
    Wormhole(fork(__dirname + '/others/senddata.js'), 'Benchmark', count, "_msg", "server");
    
    function count(msg)
    {
        if (x++ > 5000) {
            i++;
            x = 0;
            var diff = (new Date() - start) / 5000;
            util.print("\rReceived " + i +"k messages - Rate: " + (i / diff).toFixed(1) + "k messages/sec");
        }
        //console.log("SERVER: Got line: ", dump(msg));
    }

