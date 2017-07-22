/*
 * Copyright (c) 2011-2017 Daniel Ennis (Aikar) - MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 *
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */




const SENDING_AGENTS = 4;
const SAMPLE_EVERY = 25000;


const Wormhole = require('../lib/wormhole');
const net      = require('net');
const spawn    = require('child_process').spawn;

let start, i = 0, x = 0;
const SAMPLE_MULT = SAMPLE_EVERY / 1000;
net.createServer(function(conn)
{
    if (!start) start = new Date()
    Wormhole(conn, 'Benchmark', function(e, msg)
    {
        if (x++ > SAMPLE_EVERY) {
            i++;
            x = 0;
            const diff = (new Date() - start) / SAMPLE_EVERY;
            print("\rReceived " + i*SAMPLE_MULT +"k messages - Rate: " + (i / diff).toFixed(1) + "k messages/sec");
        }
        //console.log("SERVER: Got line: ", dump(msg));
    }, "_msg", "server");
}).listen(9911, function() {
    // spawn the senders
    for (let i = 0; i < SENDING_AGENTS; i++) {
        spawn(process.execPath, [__dirname + '/others/senddata.js'], {stdio: 'inherit'});
    }
});
process.on('SIGINT', function() {
    print("\n");
    process.reallyExit();
});
function print(line) {
    process.stdout.write(String(line));
}
