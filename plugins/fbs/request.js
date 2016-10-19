/**
 * @file
 * Handle sip2 response from FBS server.
 */

'use strict';

var handlebars = require('handlebars');
var fs = require('fs');

var debug = require('debug')('bibbox:FBS:request');

var Response = require('./response.js');

/**
 * Request object.
 *
 * @param bus
 *   Event bus.
 */
var Request = function Request(bus) {
  var self = this;
  self.bus = bus;

  // Load template used for the XMl request.
  var source = fs.readFileSync(__dirname + '/templates/sip2_message.xml', 'utf8');
  self.template = handlebars.compile(source);

  bus.once('config.fbs.res', function fbsConfig(data) {
    self.username = data.username;
    self.password = data.password;
    self.endpoint = data.endpoint;
    self.agency = data.agency;
    self.location = data.location;
  });
  bus.emit('config.fbs', {busEvent: 'config.fbs.res'});
};

/**
 * Zero pad (one zero) number.
 *
 * Helper function to create sip2 timestamp.
 *
 * @param number
 *   Number to pad.
 *
 * @returns {string}
 *   Padded number.
 */
Request.prototype.zeroPad = function zeroPad(number) {
  return ('0' + (number)).slice(-2);
};

/**
 * Encode timestamp into sip2 date format.
 *
 * @param timestamp
 *   Javascript timestamp.
 *
 * @returns {string}
 *   The time as sip2 time string.
 */
Request.prototype.encodeTime = function encodeTime(timestamp) {
  if (!timestamp) {
    timestamp = new Date().getTime();
  }
  var d = new Date(timestamp);

  return '' + d.getFullYear() + this.zeroPad(d.getMonth() + 1) + this.zeroPad(d.getDate()) + '    ' + this.zeroPad(d.getHours()) + this.zeroPad(d.getMinutes()) + this.zeroPad(d.getSeconds());
};

/**
 * Use template to build XML message.
 *
 * @param message
 *   Message to wrap in XML.
 *
 * @returns {string}
 *   XML message.
 */
Request.prototype.buildXML = function buildXML(message) {
  var self = this;
  return self.template({
    username: self.username,
    password: self.password,
    message: message
  });
};

/**
 * Send request to FBS.
 *
 * @param message
 *   The message to send.
 * @param firstVar
 *   The first variable expected in the response.
 * @param callback
 *   Function to execute when data is fetched and parsed. Takes a Message object
 *   as parameter.
 */
Request.prototype.send = function send(message, firstVar, callback) {
  var self = this;
  self.bus.once('fbs.sip2.online', function (online) {
    if (online) {
      // Build XML message.
      var xml = self.buildXML(message);
      self.bus.emit('logger.debug', 'FBS send: ' + xml);

      var options = {
        method: 'POST',
        url: self.endpoint,
        headers: {
          'User-Agent': 'bibbox',
          'Content-Type': 'application/xml'
        },
        body: xml
      };

      var request = require('request');
      request.post(options, function (error, response, body) {
        // Log message from FBS.
        if (body) {
          self.bus.emit('logger.debug', 'FBS response: ' + body);
        }

        var res = null;
        if (error || response.statusCode !== 200) {
          if (!error) {
            res = new Response(body, firstVar);
            if (res.hasError()) {
              error = new Error(res.getError());
            }
            else {
              error = new Error('Unknown error', response.statusCode());
            }
          }
          // Log error message from FBS.
          self.bus.emit('logger.error', 'FBS error: ' + error);
          callback(error, null);
        }
        else {
          // Send debug message.
          debug(response.statusCode + ':' + message.substr(0, 2));

          var err = null;
          res = new Response(body, firstVar);
          if (res.hasError()) {
            err = new Error(res.getError());
            self.bus.emit('logger.error', 'FBS error: ' + err);
          }

          callback(err, res);
        }
      });
    }
    else {
      callback(new Error('FBS is offline'), null);
    }
  });

  // Check if server is online (FBS).
  self.bus.emit('network.online', {
    url: self.endpoint,
    busEvent: 'fbs.sip2.online'
  });
};

/**
 * Send status message to FBS.
 *
 * @param callback
 *   Function to call when completed request to FBS.
 */
Request.prototype.libraryStatus = function libraryStatus(callback) {
  var self = this;
  self.send('990xxx2.00', 'AO', callback);
};

/**
 * Get patron status.
 *
 * @param patronId
 *   Patron card number or CPR number.
 * @param patronPassword
 *   Pin code/password for the patron.
 * @param callback
 *   Function to call when completed request to FBS.
 */
Request.prototype.patronStatus = function patronStatus(patronId, patronPassword, callback) {
  var self = this;
  var transactionDate = self.encodeTime();
  var message = '23009' + transactionDate + '|AO' + self.agency + '|AA' + patronId + '|AC|AD' + patronPassword + '|';

  self.send(message, 'AO', callback);
};

/**
 * Get all information about a patron.
 *
 * @param patronId
 *   Patron card number or CPR number.
 * @param patronPassword
 *   Pin code/password for the patron.
 * @param callback
 *   Function to call when completed request to FBS.
 */
Request.prototype.patronInformation = function patronInformation(patronId, patronPassword, callback) {
  var self = this;
  var transactionDate = self.encodeTime();
  var message = '63009' + transactionDate + new Array(10).join('Y') + '|AO' + self.agency + '|AA' + patronId + '|AC|AD' + patronPassword + '|';

  self.send(message, 'AO', callback);
};

/**
 * Check out item.
 *
 * @param patronId
 *   Patron card number or CPR number.
 * @param patronPassword
 *   Pin code/password for the patron.
 * @param itemIdentifier
 *   The item to checkout.
 * @param callback
 *   Function to call when completed request to FBS.
 */
Request.prototype.checkout = function checkout(patronId, patronPassword, itemIdentifier, callback) {
  var self = this;
  var transactionDate = self.encodeTime();
  var message = '11NN' + transactionDate + transactionDate + '|AO' + self.agency + '|AA' + patronId + '|AB' + itemIdentifier + '|AC|CH|AD' + patronPassword + '|';

  self.send(message, 'AO', callback);
};

/**
 * Check in item.
 *
 * @param itemIdentifier
 *   The item to checkout.
 * @param callback
 *   Function to call when completed request to FBS.
 */
Request.prototype.checkIn = function checkIn(itemIdentifier, callback) {
  var self = this;
  var transactionDate = self.encodeTime();
  var message = '09N' + transactionDate + transactionDate + '|AP' + self.location + '|AO' + self.agency + '|AB' + itemIdentifier + '|AC|CH|';

  self.send(message, 'AO', callback);
};

/**
 * Renew item.
 *
 * @param patronId
 *   Patron card number or CPR number.
 * @param patronPassword
 *   Pin code/password for the patron.
 * @param itemIdentifier
 *   The item to renew.
 * @param callback
 *   Function to call when completed request to FBS.
 */
Request.prototype.renew = function renew(patronId, patronPassword, itemIdentifier, callback) {
  var self = this;
  var transactionDate = self.encodeTime();
  var message = '29NN' + transactionDate + transactionDate + '|AO' + self.agency + '|AA' + patronId + '|AD' + patronPassword + '|AB' + itemIdentifier + '|';

  self.send(message, 'AO', callback);
};

/**
 * Renew all items.
 *
 * @param patronId
 *   Patron card number or CPR number.
 * @param patronPassword
 *   Pin code/password for the patron.
 * @param callback
 *   Function to call when completed request to FBS.
 */
Request.prototype.renewAll = function renewAll(patronId, patronPassword, callback) {
  var self = this;
  var transactionDate = self.encodeTime();
  var message = '65' + transactionDate + '|AO' + self.agency + '|AA' + patronId + '|AD' + patronPassword + '|';

  self.send(message, 'AO', callback);
};

module.exports = Request;
