angular.module('starter.services', [])

.factory('UserActiveRequest', function($http){
  var all = function(){
    return $http({
      method: 'GET',
      url: 'http://localhost:3000/requests'
    });
  };

  return {
    all:all
  };
})

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



.factory('ExistingOffers', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var existingOffers = [
    { id: 0, name: 'Scruff McGruff', party: '5', time: '15'},
    { id: 1, name: 'G.I. Joe', party: '2', time: '30' },
    { id: 2, name: 'Miss Frizzle', party: '3', time: '15' },
    { id: 3, name: 'Ash Ketchum', party: '6', time: '45' }
  ];

  return {
    all: function() {
      return existingOffers;
    },
    get: function(existingOfferId) {
      // Simple index lookup
      return existingOffers[existingOfferId];
    }
  };
})

.factory('Requests', function() {
  // Might use a resource here that returns a JSON array
  // GET Request with route

  // Some fake testing data
  var requests = [
    { id: 0, name: 'Scruff McGruff', party: '5', time: '15'},
    { id: 1, name: 'G.I. Joe', party: '2', time: '30' },
    { id: 2, name: 'Miss Frizzle', party: '3', time: '15' },
    { id: 3, name: 'Ash Ketchum', party: '6', time: '45' }
  ];

  return {
    all: function() {
      return requests;
    },
    get: function(requestId) {
      // Simple index lookup
      return requests[requestId];
    }
  };
})

.factory('AcceptedOffers', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var acceptedOffers = [
    { id: 0, name: 'Scruff McGruff', party: '5', time: '15'},
    { id: 1, name: 'G.I. Joe', party: '2', time: '30' },
    { id: 2, name: 'Miss Frizzle', party: '3', time: '15' },
    { id: 3, name: 'Ash Ketchum', party: '6', time: '45' }
  ];

  return {
    all: function() {
      return acceptedOffers;
    },
    get: function(acceptedOfferId) {
      // Simple index lookup
      return acceptedOffers[acceptedOfferId];
    }
  };
})
