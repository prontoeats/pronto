
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services'])

.run(function($ionicPlatform, $state, localStorageService) {
// .run(function($ionicPlatform) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
//---
    console.log('in ,run.moduel')

    var token = localStorageService.get('token');
    if(!token) {
      console.log('state transition to login')
      $state.transitionTo('tab.login');
    }
  });
  // })
})


.constant('Google', {
  authorize: 'https://accounts.google.com/o/oauth2/auth',
  client_id: '375716811110-79psrqpffqjqb3d1cb9l2fvq6jhl9jh7.apps.googleusercontent.com',
  client_secret: 'e3Jr_Sm7ZoJvkAGvP_trqZWt',
  redirect_uri: 'http://localhost',
  scope: 'email'
})


.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    // setup an abstract state for the tabs directive
    .state('user', {
      url: "/user",
      abstract: true,
      templateUrl: "templates/user.html"
    })

    // Each tab has its own nav history stack:

    .state('user.new', {
      url: '/new',
      views: {
        'user-new': {
          templateUrl: 'templates/user-new.html',
          controller: 'NewCtrl'
        }
      }
    })

    .state('user.active', {
      url: '/active',
      views: {
        'user-active': {
          templateUrl: 'templates/user-active.html',
          controller: 'ActiveCtrl'
        }
      }
    })

    .state('user.history', {
      url: '/history',
      views: {
        'user-history': {
          templateUrl: 'templates/user-history.html',
          controller: 'HistoryCtrl'
        }
      }
    })

    .state('user.settings', {
      url: '/settings',
      views: {
        'user-settings': {
          templateUrl: 'templates/user-settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })
    .state('user.friend-detail', {
      url: '/friend/:friendId',
      views: {
        'user-friends': {
          templateUrl: 'templates/friend-detail.html',
          controller: 'FriendDetailCtrl'
        }
      }
    })

// ------------

    // setup an abstract state for the tabs directive
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })

    // Each tab has its own nav history stack:
    .state('tab.login', {
      url: '/login',
      views: {
        'tab-requests': {
          templateUrl: 'templates/login.html',
          controller: 'LoginCtrl'
        }
      }
    })

    .state('tab.requests', {
      url: '/requests',
      views: {
        'tab-requests': {
          templateUrl: 'templates/tab-rest-requests.html',
          controller: 'RequestsCtrl'
        }
      }
    })

    .state('tab.request-detail', {
      url: '/request/:requestId',
      views: {
        'tab-requests': {
          templateUrl: 'templates/request-detail.html',
          controller: 'RequestDetailCtrl'
        }
      }
    })

    .state('tab.existingOffers', {
      url: '/existingOffers',
      views: {
        'tab-existingOffers': {
          templateUrl: 'templates/tab-existingOffers.html',
          controller: 'ExistingOffersCtrl'
        }
      }
    })

    .state('tab.existingOffer-detail', {
      url: '/existingOffer/:existingOfferId',
      views: {
        'tab-existingOffers': {
          templateUrl: 'templates/existingOffer-detail.html',
          controller: 'ExistingOfferDetailCtrl'
        }
      }
    })

    .state('tab.acceptedOffers', {
      url: '/acceptedOffers',
      views: {
        'tab-acceptedOffers': {
          templateUrl: 'templates/tab-acceptedOffers.html',
          controller: 'AcceptedOffersCtrl'
        }
      }
    })

    .state('tab.acceptedOffer-detail', {
      url: '/acceptedOffer/:acceptedOfferId',
      views: {
        'tab-acceptedOffers': {
          templateUrl: 'templates/acceptedOffer-detail.html',
          controller: 'AcceptedOfferDetailCtrl'
        }
      }
    });


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/login');

});

