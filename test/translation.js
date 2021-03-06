/**
 * @file
 * Unit test setup of translation plugin.
 */
'use strict';

var config = require(__dirname + '/config.json');
var app = null;
var setup = function setup() {
  if (!app) {
    // Load config file.
    var config = require(__dirname + '/../config.json');

    // Configure the plugins.
    var plugins = [
      {
        packagePath: './../plugins/bus'
      },
      {
        packagePath: './../plugins/storage',
        paths: config.paths
      },
      {
        packagePath: './../plugins/translation',
        paths: config.paths,
        languages: config.languages
      }
    ];

    app = setupArchitect(plugins, config);
  }

  return app;
};

it('All translations should be returned', function () {
  return setup().then(function (app) {
    var translations = app.services.translation.getTranslations();

    translations.should.have.property('da').which.is.a.Object();
    translations.should.have.property('en').which.is.a.Object();
  });
});

it('Danish translations should be returned only', function () {
  return setup().then(function (app) {
    var translations = app.services.translation.getTranslationsLang('da');

    translations.should.have.property('MATERIAL_NOT_FOUND');
    translations.should.not.have.property('en').which.is.a.Object();
  });
});

it('Teardown', function (done) {
  setup().then(function (app) {
    app.destroy();
    done();
  }, done);
});
