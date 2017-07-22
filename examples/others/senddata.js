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

const Wormhole = require('../../lib/wormhole');
const net      = require('net');

const client = net.createConnection(9911);
client.on('connect', function()  {
    Wormhole(client, 'Benchmark');
    const data = ["Benchmark", {
        "call": "foo",
        "args": [
            13333333333333333, "2232332323", 3.3232322, 23223323222, 434344334, 4343, 44444, 44444, 1, 1, 1, 1, 1, 1,
            "2342342342FWFEFwefwefWE", true, "false",
            {"xxxxxxxxxxx": {"x": "y"}}
        ]
    }];
    function sendData() {
        while (client.write('Benchmark', data)) {}
    }

    client.on('drain', function() {
        process.nextTick(sendData);
    });
    sendData();
});
