/**
 * jQuery iPhoneSlideshow Plugin
 * Version: 1.0.0
 * URL: https://github.com/scottwb/jquery.iPhoneSlideshow
 * Descripton: Show a slideshow of your iPhone app screenshots on your homepage.
 * Requires: jQuery 1.6+
 * Author: Scott W. Bradley (http://scottwb.com/)
 * Copyright: Copyright (c) 2012 Scott W. Bradley
 * License: MIT
 *
 * Usage:
 *
 *   // Init element with iPhoneSlideshow, using the default options.
 *   $(selector).iPhoneSlideshow({
 *     screens : ['screen1.png', 'screen2.png', 'screen3.png']
 *   });
 *
 *   // Init element with iPhoneSlideshow, overriding some default options.
 *   $(selector).iPhoneSlideshow({
 *     screens  : ['screen1.png', 'screen2.png', 'screen3.png'],
 *     interval : 2500
 *   });
 *
 *   // Un-init a previous init of iPhoneSlideshow on an element.
 *   $(selector).iPhoneSlideshow('destroy');
 *
 *   // Call a public method on an init'd iPhoneSlideshow element.
 *   $(selector).iPhoneSlideshow('publicMethod2', 'foo', 'bar');
 *
 * For documentation on the supported options, see the bottom of this file.
 */
(function($) {

    ////////////////////////////////////////////////////////////
    // Constants
    ////////////////////////////////////////////////////////////
    var PLUGIN_NAME = 'iPhoneSlideshow';


    ////////////////////////////////////////////////////////////
    // Private Methods
    ////////////////////////////////////////////////////////////
    function preloadScreens(screenUrls) {
        $.each(screenUrls, function(index, screenUrl) {
            (new Image()).src = screenUrl;
        });
    }

    function setupBackground($this) {
        var data = $this.data(PLUGIN_NAME);
        var opts = data.opts;

        $this.css({
            "width"            : opts.iphoneWidth + "px",
            "height"           : opts.iphoneHeight + "px",
            "position"         : "relative",
            "background-image" : "url(" + opts.iphoneImage + ")"
        });
    }

    function setupScreenImage($this) {
        var data = $this.data(PLUGIN_NAME);
        var opts = data.opts;

        data.screenArea = $("<div class='.iphoneScreen'></div>").css({
            "position" : "absolute",
            "left"     : opts.screenLeft + 'px',
            "top"      : opts.screenTop + 'px',
            "width"    : opts.screenWidth + 'px',
            "height"   : opts.screenHeight + 'px',
            "overflow" : "hidden"
        });
        $this.append(data.screenArea);

        data.screenImage = $("<img border='0'/>").css({
            "display"  : "none",
            "position" : "absolute",
            "left"     : "0px",
            "top"      : "0px",
            "width"    : opts.screenWidth + 'px',
            "height"   : opts.screenHeight + 'px'
        });
        data.screenArea.append(data.screenImage);
    }

    function setupGlossImage($this) {
        var data = $this.data(PLUGIN_NAME);
        var opts = data.opts;

        var gloss = $("<img src='" + opts.glossImage + "' border='0'/>").css({
            "position" : "absolute",
            "right"    : (opts.iphoneWidth - (opts.screenLeft + opts.screenWidth)) + 'px',
            "top"      : opts.screenTop + 'px'
        });
        $this.append(gloss);
    }

    function scheduleNextSlide($this) {
        var data = $this.data(PLUGIN_NAME);
        var opts = data.opts;
        if (!data.paused) {
            data.timer = setTimeout(
                function(){
                    showNextSlide($this);
                },
                opts.interval
            );
        }
        else {
            data.timer = null;
        }
    }

    function showNextSlide($this) {
        var data       = $this.data(PLUGIN_NAME);
        var opts       = data.opts;
        var numScreens = opts.screens.length;

        if (numScreens > 1) {
            if (++data.currentScreen >= numScreens) {
                data.currentScreen = 0;
            }
            transitions[opts.transition]($this);
        }
    }

    var transitions = {
        fade : function($this) {
            var data = $this.data(PLUGIN_NAME);
            var opts = data.opts;

            data.screenImage.fadeOut('slow', function() {
                data.screenImage.attr('src', opts.screens[data.currentScreen]);
                data.screenImage.fadeIn('slow', function() {
                    scheduleNextSlide($this);
                });
            });
        },

        crossfade : function($this) {
            var data = $this.data(PLUGIN_NAME);
            var opts = data.opts;

            var nextScreenImage = $("<img src='" + opts.screens[data.currentScreen] + "' border='0'/>").css({
                "position" : "absolute",
                "left"     : '0px',
                "top"      : '0px',
                "width"    : opts.screenWidth + 'px',
                "height"   : opts.screenHeight + 'px'
            });
            data.screenArea.prepend(nextScreenImage);
            data.screenImage.fadeOut('slow', function() {
                data.screenImage.remove();
                data.screenImage = nextScreenImage;
                scheduleNextSlide($this);
            });
        },

        'slide' : function($this) {
            var data = $this.data(PLUGIN_NAME);
            var opts = data.opts;

            var nextScreenImage = $("<img src='" + opts.screens[data.currentScreen] + "' border='0'/>").css({
                "position" : "absolute",
                "left"     : opts.screenWidth + 'px',
                "top"      : "0px",
                "width"    : opts.screenWidth + 'px',
                "height"   : opts.screenHeight + 'px'
            });
            data.screenArea.append(nextScreenImage);
            data.screenArea.animate(
                {scrollLeft : opts.screenWidth},
                'slow',
                'swing',
                function() {
                    data.screenImage.remove();
                    data.screenImage = nextScreenImage;
                    data.screenArea.scrollLeft(0);
                    data.screenImage.css({'left' : '0px'});
                    scheduleNextSlide($this);
                }
            );
        }
    };


    ////////////////////////////////////////////////////////////
    // Public Methods
    ////////////////////////////////////////////////////////////
    var publicMethods = {
        init: function(options) {return this.each(function() {
            var opts  = $.extend({}, $.fn[PLUGIN_NAME].defaults, options);
            var $this = $(this);

            var data  = $this.data(PLUGIN_NAME);
            if (!data) {
                $this.data(PLUGIN_NAME, {
                    opts          : opts,
                    currentScreen : -1,
                    paused        : false
                });
            }

            preloadScreens(opts.screens);
            setupBackground($this);
            setupScreenImage($this);
            // setupGlossImage($this);
            showNextSlide($this);
        })},

        // Pauses the slideshow on the current slide.
        //
        // Example:
        //
        //   $(selector).iPhoneSlideshow('pause');
        //
        pause: function() {return this.each(function() {
            var $this = $(this);
            var data  = $this.data(PLUGIN_NAME);

            data.paused = true;
            if (data.timer) {
                clearTimeout(data.timer);
                data.timer = null;
            }
        })},

        // Starts playing the slideshow after having been paused.
        //
        // Example:
        //
        //   $(selector).iPhoneSlideshow('play');
        //
        play: function() {return this.each(function() {
            var $this = $(this);
            var data  = $this.data(PLUGIN_NAME);

            if (data.paused) {
                data.paused = false;
                showNextSlide($this);
            }
        })}

    };


    ////////////////////////////////////////////////////////////
    // Plugin Initialization
    ////////////////////////////////////////////////////////////
    $.fn[PLUGIN_NAME] = function(method) {
        if (publicMethods[method]) {
            return publicMethods[method].apply(
                this,
                Array.prototype.slice.call(arguments, 1)
            );
        }
        else if (typeof method == 'object' || !method) {
            return publicMethods.init.apply(this, arguments);
        }
        else {
            $.error('Method ' + method + ' does not exist on jQuery.' + PLUGIN_NAME);
        }
    };


    ////////////////////////////////////////////////////////////
    // Options
    ////////////////////////////////////////////////////////////
    $.fn[PLUGIN_NAME].defaults = {
        // URL to the iPhone image to use to show the screens in.
        iphoneImage : "assets/img/transparent-iphone-cropped.png",

        // URL to the iPhone Gloss image used to overlay the glossy glare
        // look on top of the screen area.
        glossImage : "assets/img/gloss.png",

        // Dimensions of the chosen iphoneImage.
        iphoneWidth  : 345,
        iphoneHeight : 570,

        // Relative position of the screen area in the iphoneImage.
        screenLeft : 40,
        screenTop  : 90,

        // Dimensions of the screen area in the iphoneImaage.
        screenWidth  : 270,
        screenHeight : 480,

        // Time interval between screen transitions (in milliseconds).
        interval : 4000,

        // Type of transition to use between slides.
        // Supported values:
        //    'fade'
        //    'crossfade',
        //    'slide'
        transition : 'slide',

        // Array of URLs to the images for all the iPhone screens to show.
        screens : []
    };
})(jQuery);
