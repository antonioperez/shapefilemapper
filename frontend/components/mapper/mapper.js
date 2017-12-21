(function () {

    angular
        .module('app')
        .controller('MapCtrl', [
            '$http',
            '$scope',
            'mapservice',
            Ctrl
        ]);

    function Ctrl($http, $scope, mapservice) {
        var background = {
            "weight": 2,
            "opacity": 0.65
        };

        var popupContent = "<p>" +
            "Basin ID: {{Basin}} <br>" +
            "GSA filing: <a href='http://sgma.water.ca.gov/portal/gsa/print/{{DWR GSA ID}}' target='_blank'>View</a> <br>" +
            "GSA Name:  <a target='_blank' href ='{{GSA URL}} '>{{GSA Name}}  </a><br>" +
            "POC Name: {{POC Name}} <br>" +
            "POC Email: {{POC Email}} <br>" +
            "POC Phone: {{POC Phone}} <br>" +
            "Posted DT:  {{Posted DT}} <br>" +
            "Local ID: {{Local ID}} <br>" + "</p>";

        this.basinsmap = mapservice.generateMap("map", 8, "data/ExclusiveGsaMasterSet.zip", background,
            popupContent, "Basin", true
        );


    }
})();