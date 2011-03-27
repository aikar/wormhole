#!/usr/bin/env node
var fs = require('fs');
process.chdir(__dirname + '/test');
if (process.argv.length <= 2) {
  // Add all tests to be ran.
  process.argv = process.argv.concat(fs.readdirSync('.'));
}
process.argv.push('--spec');
require('vows/bin/vows'); // load the CLI script.
