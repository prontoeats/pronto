
var app = angular.module('app', []);

app.controller('mainCtrl', function($scope, $http){

  $scope.sendRequest = function(){

    var message = {
      address: $scope.address,
      city: $scope.city,
      state: $scope.state,
      radius: $scope.radius,
      targetDate: $scope.targetDate,
      targetTime: $scope.targetTime,
      groupSize: $scope.groupSize,
      requestNotes: $scope.requestNotes
    };

    console.log('request form data: ',message);

    $http({
      method: 'POST',
      url: '/request',
      data: message


    }).success(function(data, status) {
      alert('Thanks! The request has been sent out.');
    }).error(function(data, status){
      console.log('unsuccessful error getting data', data, status);
    });
  }

});

app.controller('contentCtrl', function($scope, $http){

  console.log('got here');
  $http({
    method: 'GET',
    url: '/requests'

  }).success(function(data, status) {
    $scope.details = data;

  }).error(function(data, status){
    console.log('unsuccessful error getting data', data, status);
  });


  $scope.refreshData = function(){
    setInterval(function(){
      console.log('refreshed');
      $http({
        method: 'GET',
        url: '/requests'

      }).success(function(data, status) {
        $scope.details = data;

      }).error(function(data, status){
        console.log('unsuccessful error getting data', data, status);
      });
    }, 4000);
  };

  $scope.refreshData();
  $scope.acceptOffer = function(id, rest){

    console.log('id: ', id, 'rest: ', rest)
    var postData = {requestId: id, businessName: rest};

    $http({
      method: 'POST',
      url: '/acceptOffer',
      data: postData


    }).success(function(data, status) {
      alert('A confirmation message has been sent to the restaurant. Thanks for using Pronto!!');

    }).error(function(data, status){
      console.log('unsuccessful error getting data', data, status);
    });
  }
});
