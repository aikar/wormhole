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

/**
 * @typedef {object} WormholeData
 * @property {object<string,[]>} channels
 */
/**
 * @typedef {Socket} WormholeClient
 * @property {function} writeFd
 * @property {WormholeData} _wormhole
 * @property {function} origWrite
 */
/**
 * @param {WormholeClient} client
 * @param channel
 * @param callback
 */
module.exports = function (client, channel, callback) {
    if (typeof client._wormhole === 'undefined') {
        Object.defineProperty(client, '_wormhole', {
            configurable: false,
            enumerable: false,
            value: {
                channels: {}
            }
        });
        client.origWrite = client.write;
        client.write = WormholeWrite;
        client.writeFd = WormholeWriteFd;
        if (typeof callback === 'function') {
            const messageQueue = [];
            client.on('fd', function (fd) {
                if (messageQueue.length) {
                    const msg = messageQueue.shift();
                    triggerChannel(msg[0], msg[1], fd);
                }
            });

            let buffer = '', idx;
            client.on('data', function (data) {
                buffer += data.toString();
                let start = 0;
                try {
                    while ((idx = buffer.indexOf("\n", start)) !== -1) {
                        const json = buffer.substr(start, idx - start);
                        const p = JSON.parse(json);

                        if (p) {
                            if (p.length < 3) {
                                triggerChannel(client, p)
                            } else {
                                // expecting FD
                                messageQueue.push([client, p]);
                            }
                        }
                        start = idx + 1;
                    }
                } catch (e) {
                    start = idx + 1;
                    triggerChannel(client, ['__error__', e], null);
                }

                buffer = buffer.substr(start);
            });

        }
    }
    if (typeof callback === 'function') {
        const channels = client._wormhole.channels;
        if (channels[channel] === undefined) {
            channels[channel] = [];
        }
        channels[channel].push(callback);
    } else if (callback) {
        console.error("[Wormhole] Invalid callback", callback);
    }
    return client;
};

module.exports.WormholeWrite = WormholeWrite;

function triggerChannel(client, obj, fd) {
    const channels = client._wormhole.channels;
    let cbs = channels[obj[0]] || [];
    if (!cbs.length && channels['__unknown__']) {
        cbs = cbs.concat(channels['__unknown__']);
    }
    if (obj[0] !== '__error__' && channels['*']) {
        cbs = cbs.concat(channels['*'])
    }
    const len = cbs.length;
    for (let i = 0; i < len; i++) {
        if (cbs[i].call(client, obj[1], fd, obj[0])) {
            i = len
        }
    }
}

function WormholeWrite(ch, data) {
    return this.origWrite(JSON.stringify([ch, data]) + "\n");
}

function WormholeWriteFd(channel, data, fd) {
    return this.origWrite(JSON.stringify([channel, data, 1]) + "\n", 'utf8', fd);
}

