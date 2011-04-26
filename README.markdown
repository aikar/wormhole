# Wormhole

## About
Wormhole is a message passing stream parser for Node.JS.

Wormhole is extremely simple and only has 1 main exported function. Once a
stream has been passed to Wormhole, it takes over all data events and
updates the write function to automatically encode all data given to it.


## Install
Wormhole is ready to be installed from NPM, but may also be manually added
to your project with git submodules or a clone. First CD to your project root.
Ensure a directory named `node_modules` exists.

  - Install with NPM:
     - `npm install wormhole`
     
  - Install with GIT:
     - As a submodule:
        - `git submodule add git://github.com/aikar/wormhole node_modules/wormhole`
        - `git submodule init`
        - `git submodule update`
     - As a plain clone:
        - `git clone git://github.com/aikar/wormhole node_modules/wormhole`

## Usage
To use Wormhole, simply require it and pass it an instance of `net.Stream`
and a callback for messages.
    
    var Wormhole = require('wormhole);
    
    net.createServer(function (client) {
        Wormhole(client, function (msg) {
            // All messages received from client, such as
            // {hello: 'World'}
        });
        
        // client.write now overloaded to encode data.
        client.write({greet: 'Weclome to our server!'});
    }).listen(2122);
    var client = net.createConnection(2122, function() {
        Wormhole(client, function (msg) {
            // Messages received from server, such as
            // {greet: 'Welcome to our server!'}
        });
        client.write({hello: 'World'});
    });
    
If you do not expect to receive messages, you still must call Wormhole with
the net.Stream but you do not need to pass it a callback, like so:

    var Wormhole = require('wormhole');
    var client = net.Stream(1); // stream to STDOUT;
    Wormhole(client);
    client.write({foo: 'bar'});
    
The Wormhole function overwrites the .write function to encode the data.

## Tests
Wormhole uses the Vows test suite. please refer to vowsjs.org for installation.
To run the tests, simply type ./runTests.js from the `node_modules/wormhole`
folder.

## Benchmarks
There is a benchmark script in the examples folder to benchmark receiving messages.

Sending bottlenecks the current benchmark, but on a 3.4ghz CPU, with a small
message I was able to get up to 154k messages per second. This is on a single core,
so when the systme is applied over multiple node processes you could see upwards
to 400-500k messages per second on a quad core system.

## Contributing
If you would like to contribute, please fork the project on github, make changes
and submit pull requests back to me.

Please follow my same coding styles (spaces, no tabs!) and add new test for new
functionality.

Please note, that changes may not affect the performance of Wormhole or it will
not be accepted!

## License
> The MIT License
>
>  Copyright (c) 2011 Daniel Ennis <aikar@aikar.co>
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
