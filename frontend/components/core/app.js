(function () {

  angular
    .module('app')
    .controller('MainCtrl', MainCtrl);

  function MainCtrl() {
    var vm = this;
    
    vm.userName = '';
  }

})();