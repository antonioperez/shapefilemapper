(function () {

  angular
    .module('app')
    .config([ '$stateProvider', config]);
      
  function config($stateProvider) {
    $stateProvider
      .state('login', {
        url: "/login",
        controller: 'AccountCtrl',
        controllerAs: 'account',
        templateUrl: "components/account/login.html",
        data: {
          pageTitle: 'Login'
        }
      })
      .state('forgot_password', {
        controller: 'AccountCtrl',
        controllerAs: 'account',
        url: "/forgot_password",
        templateUrl: "components/account/forgot.password.html",
        data: {
          pageTitle: 'Forgot password',
          specialClass: 'gray-bg'
        }
      })
      .state('register', {
        controller: 'AccountCtrl',
        controllerAs: 'account',
        url: "/register",
        templateUrl: "components/account/register.html",
        data: {
          pageTitle: 'Register',
          specialClass: 'gray-bg'
        }
      })
  }

})();