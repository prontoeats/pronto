
angular.module('starter.controllers', ['LocalStorageModule'])
// angular.module('starter.controllers', [])

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
        $state.go('user.active');
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
})


//----------

.controller('LoginCtrl', function($scope, Google, $window, $document, localStorageService, $state, $http) {
  var url = Google.authorize+'?client_id='+ Google.client_id + '&response_type=code' +
    '&redirect_uri='+Google.redirect_uri +'&scope=' + Google.scope;

  var loginWindow;                                                                                
  $scope.login = function () {
    console.log('opening window')
    loginWindow = $window.open(url, '_blank', 'location=no,toolbar=no');
    console.log('opened window')

    loginWindow.addEventListener('loadstart', function(e) {
    $window.alert('listening for events');

    var url = e.url;
    var code = /\?code=(.+)$/.exec(url);
    var error = /\?error=(.+)$/.exec(url);
    $window.alert(url);

    if (code) {
      window.alert('code' + code[1]);
      var url2 = 'code='+code[1]+'&client_id='+
        Google.client_id+'&client_secret='+Google.client_secret+'&redirect_uri='+Google.redirect_uri+'&grant_type=authorization_code';
        window.alert('url: '+url2);
      $http ({
        method: 'POST', 
        url: 'https://accounts.google.com/o/oauth2/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: url2

      }).success(function(data, status){
        window.alert('http '+data.access_token);
        // loginWindow.close();
        // $state.transitionTo('tab.requests');
        // $state.transitionTo('tab.request');
        $http({
          method: 'POST',
          url: 'http://localhost:3000/request',
          data: data.access_token
        })
        .success(function(data){
          console.log('success! ', data);
          // $state.go('user.active');
        })



      }).error(function(data, status){

        $http({
          method: 'POST',
          url: 'http://localhost:3000/request',
          data: data
        })
        .success(function(data){
          console.log('success! ', data);
          // $state.go('user.active');
        })
        .error(function(data){
          console.log('error! ', data);
        })


        window.alert('failed '+status);
      });
    }
    });

    $scope.showToken = function () {
    $scope.token = localStorageService.get('token');
    };
  };
})


.controller('RequestsCtrl', function($scope, $location, Requests) {
  $scope.requests = Requests.all();
  $scope.word = '';
  $scope.go = function(request){
    path = 'tab/request/' + request.id;
    $location.path(path);
  };
  $scope.delete = function(index){
    $scope.requests.splice(index, 1);
    //TODO: send post request to server to remove request
  };
})

.controller('RequestDetailCtrl', function($scope, $stateParams, $location, Requests) {
  $scope.request = Requests.get($stateParams.requestId);
  $scope.discount = '';
  $scope.accept = function(discount){
    console.log(discount);
    $location.path('/tab')
  };
})

.controller('ExistingOffersCtrl', function($scope, ExistingOffers) {
  $scope.existingOffers = ExistingOffers.all();
})

.controller('ExistingOfferDetailCtrl', function($scope, $stateParams, ExistingOffers) {
  $scope.existingOffer = ExistingOffers.get($stateParams.existingOfferId);
})

.controller('AcceptedOffersCtrl', function($scope, AcceptedOffers) {
  $scope.acceptedOffers = AcceptedOffers.all();
})

.controller('AcceptedOfferDetailCtrl', function($scope, $stateParams, AcceptedOffers) {
  $scope.acceptedOffer = AcceptedOffers.get($stateParams.acceptedOfferId);
});
