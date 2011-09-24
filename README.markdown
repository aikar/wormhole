# Wormhole

## About
Wormhole is a message passing stream parser for Node.JS.

Wormhole is extremely simple and only has 1 main exported function. Once a
stream has been passed to Wormhole, it takes over all data events and
updates the write function to automatically encode all data given to it.


## Install
Wormhole is ready to be installed from NPM, but may also be manually added
to your project with git submodules. First CD to your project root.
Ensure a directory named `node_modules` exists.

  - Install with NPM:
     - `npm install wormhole`
     
  - Install with GIT:
     - As a submodule:
        - `git submodule add git://github.com/aikar/wormhole node_modules/wormhole`
        - `git submodule update --init --recursive`

## Update from 2.x to 3.x
If your coming from 2.x, part of the 2.x update added error as the first param
to the callbacks.

This has been reverted in 3.x due to the introduction of channels, and now
errors fire on the '`__error__`' channel.

You also now need to pass a channel to Wormhole init call, AND to write() calls, see below.

## Usage
### Wormhole(stream, channel, callback)
To use Wormhole, simply require it and pass it an instance of `net.Stream`, a
channel to receive events on (call Wormhole multiple times to specify multiple channels)
and what function to execute for that channel.

and a callback for messages with function fn(message).

    var Wormhole = require('wormhole');
    var stdin = process.stdin;
    stdin.resume();
    Wormhole(stdin, 'channelToReceiveOn', function(msg, fd) {
      // Messages here
    });


### stream.write(channel, message)
To write data, pass a channel and the message (objects is fine)

    var Wormhole = require('wormhole');
    
    net.createServer(function (client) {
        Wormhole(client, 'chat', function (msg) {
            // All messages received from client over chat channel, such as
            // {hello: 'World'}
        });
        
        Wormhole(client, 'auth', function (msg) {
            // All messages received from client, such as
            // {hello: 'World'}
            if (msg.user == 'foo' && msg.pass == 'bar') {
               client.write('auth', {auth: 'Thank you for logging in'});
            }
        });
        
        // client.write now overloaded to encode data.
        client.write('auth', {auth: 'Please login!'});
        client.write('chat', {greet: 'Welcome to our server!'});
    }).listen(2122);
    var client = net.createConnection(2122, function() {
        Wormhole(client, 'chat', function (err, msg) {
            // Messages received from server, such as
            // {greet: 'Welcome to our server!'}
        });
        Wormhole(client, 'auth', function (err, msg) {
            // Messages received from server on auth channel, such as
            // {auth: 'Please login!'}
            // {auth: 'Thank you for logging in!'}
        });
        client.write('auth', {user: 'foo', pass: 'bar'});
        client.write('chat', {hello: 'World'});
    });
    
If you do not expect to receive messages, you still must call Wormhole with
the net.Stream but you do not need to pass it a callback or channel, like so:

    var Wormhole = require('wormhole');
    var client = net.Stream(1); // stream to STDOUT;
    Wormhole(client);
    client.write('foobar', {foo: 'bar'});
    
The Wormhole function overwrites the .write function to encode the data.

### stream.writeFd(channel, data, fd)
You may also send a file descriptor over a unix socket. This is the same as
write(), except that your callback will have a 2nd argument
    
    process.stdin.resume();
    var Wormhole = require('wormhole');
    Wormhole(process.stdin, "clients", function(msg, fd) {
        console.log("Info about this client:", conn);
        var conn = new net.Socket(fd);
        conn.resume();
        Wormhole(conn);
        conn.write('foo', 'bar');
    });

Now you can do this in a parent process

    var net = require('net');
    var netb = process.binding('net');
    var pair = netb.socketpair();
    var cp = require('child_process');
    var child = cp.spawn(process.execPath,
        ['foo.js'],  // filename for above.
        {
            customFds: [pair[1], -1, -1]
        }
    );
    
    child.stdin = new net.Stream(pair[0], 'unix');
    child.stdin.resume();
    
    Wormhole(child.stdin);
    
    child.stdin.write("fdchannel", {foo:'bar'}, )
    
    net.createServer(function(conn) {
        child.stdin.write("clients", conn, conn.fd);
    }).listen(1020);
    
Now anytime someone connects to port 1020 on the parent process, the CHILD
will receive the FD and be able to send messages directly over the connection
without having to do IPC to the parent.

## Multiple Receiving Callbacks
Wormhole also has the ability to register more than 1 function per channel.
It will execute them in the order they were defined, and stop if any function
returns a truthy value.

    Wormhole(recv, 'foo', function(msg) {
        console.log("msg handler 1")
    });
    
    Wormhole(recv, 'foo', function(msg) {
        console.log("msg handler 2")
        return 1;
    });
    
    Wormhole(recv, 'foo', function(msg) {
        console.log("msg handler 3")
    });


    // send some data to recv on channel foo

This will print msg handler 1, msg handler 2, but not print msg handler 3.

you will likely always want to return true if you know youve processed the message.

## Special Channels
### `__error__`
2.x introduced the node style fn(err, ...) callback style. This has been removed
in 3.x and gone back to fn(msg) style, with errors now firing on their own channel.

All errors will fire on the `_error__` channel, so listen like this:

    Wormhole(stream, '__error__', function(err) {
        console.error("Error received: ", err.msg);
        console.error(err.stack);
    });
    
### `__unknown__`
If you receive data on a channel you have not set up a callback function for,
it will be sent to the `__unknown__` channel. It acts as a catch all for unknows.

To better debug what channel was sent, the channel is passed as the 3rd argument

    Wormhole(stream, '__unknown__', function(msg, fd, channel) {
        console.log("Received message on unknown channel", channel,":", msg);
    });

### `*`
If you pass * as a channel name, this function will catch ALL messages, including
ones already processed by another function or `__unknown__ `channel!

As stated above in the "Multiple Receive Callbacks" section, return true from a function
to not execute any more functions if the data is truely processed!
## Tests
Wormhole uses the Vows test suite, but is designed to be triggered with my
test runner.

`npm install testrunner -g` then type `runtest`

## Benchmarks
There is a benchmark script in the examples folder to benchmark receiving messages.

Sending bottlenecks the current benchmark, but on a 3.4ghz CPU using
3 cores (2 sending, 1 receiving), with a small
message I was able to get up to 310k messages per second. 

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
