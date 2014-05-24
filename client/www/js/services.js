angular.module('starter.services', [])


.factory('ActiveTestData', function(){
  var summaryData = {
    distance: 5,
    location: 'Current Location',
    groupSize: 3,
    mins: 15
  };

  var offersData = [
    {
      businessName: 'Jims',
      address: '1452 Howard St',
      distance: 0.23,
      offer: '20% off'
    },
    {
      businessName: 'Joes',
      address: '1234 Market St',
      distance: 0.45,
      offer: '15% off'
    },
    {
      businessName: 'Jeffs',
      address: '944 Market St',
      distance: 0.75,
      offer: '30% off'
    }
  ]
  return summaryData;
})

.factory('OffersTestData', function(){
  var offersData = [
    {
      businessName: 'Jims',
      address: '1452 Howard St',
      distance: 0.23,
      offer: '20% off'
    },
    {
      businessName: 'Joes',
      address: '1234 Market St',
      distance: 0.45,
      offer: '15% off'
    },
    {
      businessName: 'Jeffs',
      address: '944 Market St',
      distance: 0.75,
      offer: '30% off'
    }
  ]
  return offersData;
})


//Get the longitude and latitude coordinates from device GPS
.factory('GetLocation', function($q) {

  var longLat = function(){
    
    //create a promise since getting the position is an asynch
    var deferred = $q.defer();

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        deferred.resolve([pos.coords.longitude, pos.coords.latitude])
        }, function(error) {
          alert('Unable to get location: ' + error.message);
      }
    );
    //return promise object
    return deferred.promise;
  }

  //return factory object
  return {
    longLat: longLat
  };
})



.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [
    { id: 0, name: 'Scruff McGruff' },
    { id: 1, name: 'G.I. Joe' },
    { id: 2, name: 'Miss Frizzle' },
    { id: 3, name: 'Ash Ketchum' }
  ];

  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  }
});