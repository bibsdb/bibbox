/**
 * @file
 * Karma configuration.
 */

'use strict';

module.exports = function (config) {
  config.set({
    // Base path that will be used to resolve all patterns (eg. files, exclude).
    basePath: '',

    // Frameworks to use.
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter.
    frameworks: ['mocha', 'sinon-chai'],

    // list of files / patterns to load in the browser.
    files: [
      'public/js/lib/jquery*.js',
      'public/js/lib/angular.min.js',
      'public/js/*.js',
      'public/js/**/*.js',
      'public_tests/**/*.spec.js',

      'public/views/*.html'
    ],

    // List of files to exclude.
    exclude: [],

    // Preprocess matching files before serving them to the browser.
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor.
    preprocessors: {
      'public/views/**/*.html': ['ng-html2js'],
      'public/js/*.js': ['coverage'],
      'public/js/controllers/*.js': ['coverage'],
      'public/js/services/*.js': ['coverage'],
      'public/js/directives/**/*.js': ['coverage']
    },

    // Test results reporter to use.
    // possible values: 'dots', 'progress'.
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter.
    reporters: ['progress', 'coverage'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging.
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes.
    autoWatch: false,

    // start these browsers.
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher.
    browsers: ['PhantomJS'],

    // Continuous Integration mode.
    // if true, Karma captures browsers, runs the tests and exits.
    singleRun: true,

    // Concurrency level.
    // how many browser should be started simultaneous.
    concurrency: Infinity,

    coverageReporter: {
      type: 'html',
      dir: 'coverage/'
    },

    ngHtml2JsPreprocessor: {
      // If your build process changes the path to your templates,
      // use stripPrefix and prependPrefix to adjust it.
      stripPrefix: 'public/',

      // The name of the Angular module to create.
      moduleName: 'my.templates'
    }
  });
};
