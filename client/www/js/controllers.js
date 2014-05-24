angular.module('starter.controllers', [])

.controller('NewCtrl', function($q, $scope, $state, GetLocation, $http) {

  //Initialize defaults

  //requestObj will be sent to server after hitting submit
  $scope.requestObj = {};
  $scope.requestObj.distance = 0.5;
  $scope.requestObj.mins = 15;
  $scope.requestObj.groupSize = 1;

  $scope.model = {};
  $scope.model.inputLocation = 'Current Location';
  console.log('Obj', $scope.requestObj);

  //set the distance on the request object when a distance button is clicked
  $scope.setDistance = function(distance){
    $scope.requestObj.distance = distance;
    console.log('Distance: ', $scope.requestObj.distance);
  };

  //set the minutes on the request object when a distance button is clicked
  $scope.setMins = function(mins){
    $scope.requestObj.mins = mins;
    console.log('Distance: ', $scope.requestObj.mins);
    console.log('Group Size ', $scope.requestObj.groupSize);
  };

  //Configure the location data
  $scope.setLocation = function(){

    var deferred = $q.defer();
    console.log('input: ',$scope.model.inputLocation);
    console.log('location: ',$scope.requestObj.location);

    //if the location field remains as 'current location', get long/lat coordinates
    if ($scope.model.inputLocation.toLowerCase() === 'current location'){
      GetLocation.longLat()
      .then(function(data){
        $scope.requestObj.location = data;
        deferred.resolve(data);
      })

    //otherwise set the location field to the user input (server will get long/lat coordinates)
    } else {
      $scope.requestObj.location = $scope.model.inputLocation;
      deferred.resolve();
    }

    //return promise for chaining
    return deferred.promise;
  }

  //send the request
  $scope.sendRequest = function(){

    $scope.setLocation()
    .then(function(){
      console.log('Request Object ',$scope.requestObj);

      $http({
        method: 'POST',
        url: 'http://localhost:3000/request',
        data: $scope.requestObj
      })
      .success(function(data){
        console.log('success! ', data);
        $state.go('tab.active');
      })
      .error(function(data){
        console.log('error! ', data);
      })
    })
  }
})

.controller('ActiveCtrl', function($scope, ActiveTestData, OffersTestData) {
  $scope.response = ActiveTestData;
  $scope.offers = OffersTestData;

  $scope.declinedOffers = [];
  $scope.decline = function(index){
    $scope.declinedOffers.push($scope.offers.splice(index,1));
  };
})

.controller('SettingsCtrl', function($scope) {
  $scope.test = function(){
    var ref = window.open('http://www.yelp.com/biz/kusina-ni-tess-san-francisco', '_blank');
  }
})


.controller('HistoryCtrl', function($scope, $ionicLoading) {
});

