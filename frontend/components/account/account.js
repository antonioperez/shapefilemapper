(function () {

    angular
        .module('app')
        .controller('AccountCtrl', [
            '$http',
            '$scope',
            '$location',
            '$state',
            '$cookies',
            Ctrl
        ]);

    function Ctrl($http, $scope, $location, $state, $cookies) {
        

    }
})();