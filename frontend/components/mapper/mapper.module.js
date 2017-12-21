(function () {

  angular
    .module('app')
    .config([
      '$stateProvider',
      config
    ]);

  function config($stateProvider) {
    $stateProvider
      .state('index.basinmapper', {
        controller: 'MapCtrl',
        controllerAs: 'map',
        url: "/basinmapper",
        templateUrl: "components/mapper/map.html",
        data: { 
          pageTitle: 'Maps'
        }
      });
  }

})();