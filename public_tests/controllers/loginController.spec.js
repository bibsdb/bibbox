describe('loginController', function () {

  var scope;
  var ctrl;
  var $q;
  var proxyReturn = null;
  var proxyResolve = null;
  var rootScope = null;

  beforeEach(function () {
    module('BibBox');

    // Setup mock proxyService.
    module(function ($provide) {
      $provide.service('proxyService', function () {
        this.getSocket = function () {
          return null;
        };
        this.emitEvent = function (a, b, c, d) {
          var deferred = $q.defer();

          if (proxyResolve !== null) {
            if (proxyResolve) {
              deferred.resolve(proxyReturn);
            }
            else {
              deferred.reject(proxyReturn);
            }
          }

          return deferred.promise;
        };
        this.registerListeners = function () {};
      });
    });

    inject(function ($rootScope, $controller, _$q_) {
      $q = _$q_;
      scope = $rootScope.$new();
      rootScope = $rootScope;

      ctrl = $controller('LoginController', {
        $scope: scope
      });
    })
  });

  // Reset what the mock ProxyService returns after each run.
  afterEach(function () {
    proxyReturn = null;
    proxyResolve = null;
  });

  it('$scope should have a variable user that is an object', function () {
    expect(scope.user).to.be.an('object');
    expect(scope.user.username).to.be.a('string');
    expect(scope.user.password).to.be.a('string');
  });

  it('If useManualLogin has been called with true, display should be "username" and "default" for false', function () {
    // Set username to make sure it is reset if manual login is enabled.
    scope.user.username = 'Test';

    scope.useManualLogin(true);
    expect(scope.display).to.equal('username');

    // Make sure username is reset, after enable of manual login.
    expect(scope.user.username).to.equal('');

    // Set username to make sure it is reset if manual login is disabled.
    scope.user.username = 'Test';

    scope.useManualLogin(false);
    expect(scope.display).to.equal('default');

    // Make sure username is reset, after disable of manual login.
    expect(scope.user.username).to.equal('');
  });

  it('Manual Login: it should reject username that is not 10 digits', function () {
    scope.useManualLogin(true);

    scope.user.username = '123';
    scope.usernameEntered();
    expect(scope.usernameValidationError).to.equal(true);
    expect(scope.display).to.equal('username');

    scope.user.username = 'abcdefghij';
    scope.usernameEntered();
    expect(scope.usernameValidationError).to.equal(true);
    expect(scope.display).to.equal('username');

    scope.user.username = '';
    scope.usernameEntered();
    expect(scope.usernameValidationError).to.equal(true);
    expect(scope.display).to.equal('username');
  });

  it('Manual Login: it should accept username that is 10 digits', function () {
    scope.useManualLogin(true);

    scope.user.username = '1234567890';
    scope.usernameEntered();
    expect(scope.usernameValidationError).to.equal(false);
    expect(scope.display).to.equal('password');
  });


  it('Manual Login: it should only accept non-empty digit password', function () {
    scope.useManualLogin(true);

    scope.user.username = '1234567890';
    scope.usernameEntered();

    scope.user.password = '';
    scope.passwordEntered();

    expect(scope.passwordValidationError).to.equal(true);
    expect(scope.display).to.equal('password');

    scope.user.password = 'abc';
    scope.passwordEntered();

    expect(scope.passwordValidationError).to.equal(true);
    expect(scope.display).to.equal('password');

    scope.user.password = '1';
    scope.passwordEntered();

    expect(scope.passwordValidationError).to.equal(false);
  });

  it('Barcode Login: it should accept a barcode result', function () {
    expect(scope.display).to.equal('default');

    proxyReturn = '1234';
    proxyResolve = true;

    // Trigger Barcode Start
    scope.useManualLogin(false);

    scope.$apply();

    expect(scope.user.username).to.equal('1234');
  });
});