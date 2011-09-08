#!/usr/bin/env node
//  Copyright (c) 2011 Daniel Ennis <aikar@aikar.co>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var fs = require('fs');
process.chdir(__dirname + '/test');
if (process.argv.length <= 2) {
  // Add all tests to be ran.
  process.argv = process.argv.concat(fs.readdirSync('.'));
}
var splitter = process.platform === 'win32' ? ';' : ':';
// add node_modules to global lookup path, hack it in there since require.paths was removed ;(
var globalPath = require('path').resolve(process.execPath, '..', '..', 'lib', 'node_modules')
var paths=(process.env.NODE_PATH || '').split(splitter);
paths.push(globalPath)
process.env.NODE_PATH = paths.join(splitter);
// rebuild global paths.
require('module')._initPaths();
process.argv.push('--spec');
require('vows/bin/vows'); // load the CLI script.
