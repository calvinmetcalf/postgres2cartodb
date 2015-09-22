#!/usr/bin/env node
'use strict';
require('colors');
var fs = require('fs');
var convert = require('./');
var path = require('path');
var argv = require('yargs')
    .usage('Usage: $0 inTable [outTable] [options]')
    .alias('p', 'postgres')
    .describe('p', 'postgres connection config, should be a path to a json file'.yellow)
    .default('p', null, '$POSTGRES_CONFIG')
    .alias('c', 'cartodb')
    .describe('c', 'cartodb connection config, should be a path to a json file'.yellow)
    .default('c', null, '$CARTODB_CONFIG')
    .alias('g', 'geometry')
    .alias('v', 'version')
    .describe('g', 'geometry field'.yellow)
    .default('g', 'shape')
    .alias('m', 'method')
    .describe('m', 'import method'.yellow)
    .default('m', 'create')
    .example('$0 -p ./postgres.json -c ./cartodb.json inTable outTable', 'specify the files'.green)
    .example('$0 inTable', 'use environmental variables and the same table names'.green)
    .example('$0 inTable outTable --no-g', 'use environmental variables and pass no geometry'.green)
    .help('h', 'Show Help'.yellow)
   .alias('h', 'help')
    .argv;

if (argv.v || argv._[0] === 'version') {
  console.log(require('./package.json').version);
  process.exit();
}

var postgresConn = JSON.parse(fs.readFileSync(path.resolve(argv.postgres || process.env.POSTGRES_CONFIG)));
var cartodbConn = JSON.parse(fs.readFileSync(path.resolve(argv.cartodb || process.env.CARTODB_CONFIG)));

var geometry = argv.geometry;

var inTable = argv._[0];
var outTable = argv._[1] || inTable;

var config = {
  postgres: {
    geometry: geometry,
    table: inTable,
    connection: postgresConn
  },
  cartodb: {
    connection: cartodbConn,
    table: outTable
  },
  method: argv.method,
  progress: true
};
convert(config, function (err) {
  if (err) {
    console.log(err && err.stack || err);
    process.exit(1);
  }
  console.log('done'.green);
  process.exit(0);
});
