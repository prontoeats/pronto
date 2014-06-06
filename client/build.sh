#!/bin/bash
rm -rf ./platforms
rm -rf ./plugins
mkdir platforms
mkdir plugins
cordova plugin add https://github.com/driftyco/ionic-plugins-keyboard.git
cordova plugin add org.apache.cordova.device
# cordova plugin add org.apache.cordova.dialogs
# cordova plugin add org.apache.cordova.statusbar
cordova plugin add org.apache.cordova.inappbrowser
# cordova plugin add org.apache.cordova.splashscreen
cordova plugin add org.apache.cordova.geolocation
cordova plugin add https://github.com/phonegap-build/PushPlugin.git
cordova plugin add org.apache.cordova.console
ionic platform add ios
ionic build ios
# ionic platform add android
# ionic build android
# ionic emulate ios