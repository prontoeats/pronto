
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
    console.log('in ,run.moduel')

    // localStorageService.set('token', 'ya29.IwC2UUT-RcRpdB8AAAAarQOOg2Xw1phjXoIQYlN3Cc4cb4V-2rOvl6kMsSwpBg');
    // localStorageService.set('restaurantId', '538641d7e7ada47bb6bb2f9b');
    // localStorageService.set('user', 'false');
    // $state.transitionTo('rest.requests');

    //localStorageService.set('token', 'ya29.JAA9R6ea2WG-5RoAAAAfQRQzac06Jn0rx8ZzAh5kxJ5O50k2c38J4DDxb2zUwQ');
    //localStorageService.set('userId', '538414db6e250e000008f614');
    //localStorageService.set('user', 'true');
    // $state.transitionTo('user.new');
    localStorageService.set('token', null);
    localStorageService.set('userId', null);
    localStorageService.set('user', null);
    // $state.transitionTo('user.new');

    var token = localStorageService.get('token');

    if(!token) {
      console.log('state transition to login')
      $state.transitionTo('login.user');
    }else{
      if (localStorageService.get('user')){
        console.log('user');
        $state.transitionTo('user.new');
      }else{
        console.log('restaurant');
        $state.transitionTo('rest.requests');
      }
    }
  });
})

.constant('Google', {
  authorize: 'https://accounts.google.com/o/oauth2/auth',
  client_id: '375716811110-79psrqpffqjqb3d1cb9l2fvq6jhl9jh7.apps.googleusercontent.com',
  redirect_uri: 'http://localhost',
  scope: 'email'
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

// ------------Login States-----------------
    .state('login', {
      url: '/login',
      abstract: true,
      templateUrl: 'templates/login.html',
    })

    .state('login.restaurant', {
      url: '/restaurant',
      views: {
        'login-restaurant': {
          templateUrl: 'templates/login-restaurant.html',
          controller: 'LoginRestCtrl'
        }
      }
    })

    .state('login.user', {
      url: '/user',
      views: {
        'login-user': {
          templateUrl: 'templates/login-user.html',
          controller: 'LoginUserCtrl'
        }
      }
    })

// ------------Signup States-----------------
    .state('signup', {
      url: '/signup',
      abstract: true,
      templateUrl: 'templates/signup.html',
    })

    .state('signup.signup', {
      url: '/signup',
      views: {
        'signup-signup': {
          templateUrl: 'templates/signup-signup.html',
          controller: 'SignupCtrl'
        }
      }
    })

// ------------User States-----------------
    .state('user', {
      url: "/user",
      abstract: true,
      templateUrl: "templates/user.html"
    })

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

// ------------Restaurant States-----------------
    .state('rest', {
      url: "/rest",
      abstract: true,
      templateUrl: "templates/rest.html"
    })

    .state('rest.requests', {
      url: '/requests',
      views: {
        'rest-requests': {
          templateUrl: 'templates/rest-requests.html',
          controller: 'RequestsCtrl'
        }
      }
    })

    .state('rest.request-detail', {
      url: '/request/:requestId',
      views: {
        'rest-requests': {
          templateUrl: 'templates/rest-request-detail.html',
          controller: 'RequestDetailCtrl'
        }
      }
    })

    .state('rest.existingOffers', {
      url: '/existingOffers',
      views: {
        'rest-existingOffers': {
          templateUrl: 'templates/rest-existingOffers.html',
          controller: 'ExistingOffersCtrl'
        }
      }
    })

    .state('rest.existingOffer-detail', {
      url: '/existingOffer/:existingOfferId',
      views: {
        'rest-existingOffers': {
          templateUrl: 'templates/rest-existingOffer-detail.html',
          controller: 'ExistingOfferDetailCtrl'
        }
      }
    })

    .state('rest.acceptedOffers', {
      url: '/acceptedOffers',
      views: {
        'rest-acceptedOffers': {
          templateUrl: 'templates/rest-acceptedOffers.html',
          controller: 'AcceptedOffersCtrl'
        }
      }
    })

    .state('rest.acceptedOffer-detail', {
      url: '/acceptedOffer/:acceptedOfferId',
      views: {
        'rest-acceptedOffers': {
          templateUrl: 'templates/rest-acceptedOffer-detail.html',
          controller: 'AcceptedOfferDetailCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login/user');

});
