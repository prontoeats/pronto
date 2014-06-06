
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'angularMoment'])

.run(function($ionicPlatform, $state, checkAuthentication, localStorageService, PushNotification) {

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
    var token = localStorageService.get('token');

    console.log('after token get :',token);
    if(!token) {
      console.log('got into if loop - no token exists');
      $state.go('login.user');
    }else{
      console.log('got into else loop - token exists');

      if (localStorageService.get('user') === 'true'){
        console.log('got into else loop - user is true');

        checkAuthentication.check('user')
        .success(function(data, status){
          console.log('got into user else loop - in success callback');

          $state.go('user.new');
        })
        .error(function(data, status){
          console.log('got into user else loop - in fail callback');

          $state.go('login.user');
        })
      }else{

        console.log('got into rest else loop')
        checkAuthentication.check('restaurant')
        .success(function(data, status){
          console.log('got into restaurant else loop - in success callback');
          $state.go('rest.requests');
        })
        .error(function(data, status){
          console.log('got into restaurant else loop - fail success callback');
          $state.go('login.restaurant');
        })
      }
    }
  });
})

.constant('Google', {
  authorize: 'https://accounts.google.com/o/oauth2/auth',
  client_id: '375716811110-4g5qmacale5q8lcg1skemks7rou13dqa.apps.googleusercontent.com',
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

    .state('login.transition', {
      url: '/transition',
      views: {
        'login-transition': {
          templateUrl: 'templates/login-transition.html',
          controller: 'LoginTransitionCtrl'
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
    })

    .state('rest.settings', {
      url: '/settings',
      views: {
        'rest-settings': {
          templateUrl: 'templates/rest-settings.html',
          controller: 'RestSettingsCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login/transition');

});

