#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var request = require('request-promise');

var states = require('./states.json').states;
var OUTPUT_DIR = 'converted';

function write(filename, data) {
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), data, 'utf8');
}

function writeAffiliatesFiles(filename, json) {
  write(filename + '.json', JSON.stringify(json));
  // write(filename + '.js', 'module.exports=' + JSON.stringify(json) + ';');
}

function getValueFromElement(source, selector) {
  return source.find(selector).text().trim();
}

function getStateAffiliatesFromResponse(state, response) {
  var json = {'afiliados': []};
  var $ = cheerio.load(response.body);
  var rows = $('.root table tr');

  rows.each(function () {
    json.afiliados.push({
      'nombreComercial': getValueFromElement($(this), 'td:first-child'),
      'domicilio': getValueFromElement($(this), 'td:nth-child(2)'),
      'colonia': getValueFromElement($(this), 'td:nth-child(3)'),
      'municipio': getValueFromElement($(this), 'td:nth-child(4)'),
      'tipoDeNegocio': getValueFromElement($(this), 'td:nth-child(5)')
    });
  });

  writeAffiliatesFiles(state, json);
}

states.forEach(function (element, index) {
  var options = {
    form: {
      sDM: 'Seleccione',
      sEst: index + 1
    },
    resolveWithFullResponse: true,
    uri: 'http://www.sivale.mx/afiliados/mapa_miscompras/resultados2.php'
  };

  request
    .post(options)
    .then(function (response) {
      getStateAffiliatesFromResponse(element, response);
    });
});
