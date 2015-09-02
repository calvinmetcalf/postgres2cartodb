'use strict';
var fromPostgres = require('postgres2geojson');
var cartodbTools = require('cartodb-tools');
var uploader = require('cartodb-uploader');
var pg = require('pg');
var ProgressBar = require('progress');

module.exports = convert;

function convert(config, callback) {
  config = config || {};
  config.postgres = config.postgres || {};
  config.cartodb = config.cartodb || {};
  var postgresCon = config.postgres.connection;
  var cartodbCon = config.cartodb.connection;
  var geometry = config.postgres.geometry;
  var postgresTable = config.postgres.table;
  var cartodbTable = config.cartodb.table || postgresTable;
  var bar;
  function tick(num) {
    if (bar) {
      bar.tick(num);
    }
  }
  if (config.progress) {
    pg.connect(postgresCon, function(err, client, done) {
      if (err) {
        return callback(err);
      }
      pg.end();
      client.query('select count(*) as c from ' + postgresTable + ';', function (err, result) {
        done();
        if (err) {
          return callback(err);
        }
        bar = new ProgressBar('[:bar] :percent :current/:total  ', {
          total: parseInt(result.rows[0].c, 10),
          width: 20
        });
        start();
      });
    });
  } else {
    start();
  }
  function start () {
    fromPostgres(postgresCon, postgresTable, geometry, 0, 50).on('error', callback)
      .pipe(uploader.geojson(cartodbCon, cartodbTable, function(err) {
        if (err) {
          return callback(err);
        }
        tick(50);
        fromPostgres(postgresCon, postgresTable, geometry, 50).on('error', callback)
          .pipe(cartodbTools(cartodbCon.user, cartodbCon.key).createWriteStream(cartodbTable))
          .on('inserted', tick)
          .on('error', function(e) {
            callback(e);
          })
          .on('end', function() {
            callback();
          });
      }));
  }
}
