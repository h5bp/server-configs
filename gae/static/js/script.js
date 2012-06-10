/**
 *  Author:  @coto
 *  Function: insertParamToURL
 *  @param {String} key Parameter to insert into URL
 *  @param {String} value Value for new parameter
 *
 *  Insert parameters to the URL recognizing if it had parameters before.
 *  It will reload the page, it's likely better to store this until finished
 */
function insertParamToURL(key, value)
{
    key = escape(key); value = escape(value);

    var kvp = document.location.search.substr(1).split('&');

    var i=kvp.length; var x;
    while(i--) {
        x = kvp[i].split('=');

        if (x[0]==key)
        {
            x[1] = value;
            kvp[i] = x.join('=');
            break;
        }
    }

    if(i<0) {kvp[kvp.length] = [key,value].join('=');}

    document.location.search = kvp.join('&');
}


$(document).ready(function() {

    /***** Get kind of device ****/
    var ua = navigator.userAgent;
    var checker = {
        ios: ua.match(/(iPhone|iPod|iPad)/),
        blackberry: ua.match(/BlackBerry/),
        android: ua.match(/Android/),
        mobile: ua.match(/(iPhone|iPod|iPad|BlackBerry|Android)/)
    };

    /* Fix Bar at top, except for iOS */
    var $win = $(window)
        , $nav = $('.subnav')
        , $brand = $('.brand')
        , navTop = $('.subnav').length && $('.subnav').offset().top - 40
        , isFixed = 0

    processScroll();

    $nav.on('click', function () {
        if (!isFixed) setTimeout(function () {  $win.scrollTop($win.scrollTop() - 47) }, 10)
    });

    $win.on('scroll', processScroll);

    function processScroll() {
        if(checker.ios) {
            return;
        }
        var i, scrollTop = $win.scrollTop();
        if (scrollTop >= navTop && !isFixed) {
            isFixed = 1;
            $nav.addClass('subnav-fixed');
            $brand.addClass('brand-fixed');
        } else if (scrollTop <= navTop && isFixed) {
            isFixed = 0;
            $nav.removeClass('subnav-fixed');
            $brand.removeClass('brand-fixed');
        }
    }

    // Detects orientationchange event, otherwise fall back to the resize event.
    // Fixing this bug: http://webdesignerwall.com/tutorials/iphone-safari-viewport-scaling-bug
    if (checker.mobile && checker.ios){
        var supportsOrientationChange = "onorientationchange" in window,
            orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

        window.addEventListener(orientationEvent, function() {
            $("body").css("width", "100%");
            //alert('HOLY ROTATING SCREENS BATMAN:' + window.orientation + " " + screen.width);
        }, false);

        var viewportmeta = document.querySelector('meta[name="viewport"]');
        if (viewportmeta) {
            viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0';
            document.body.addEventListener('gesturestart', function () {
                viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1';
            }, false);
        }

    }

    /* Change CSS definitión for collapse button */
    $('body').on('click.collapse.data-api', '[data-toggle=collapse]', function ( e ) {
        var $this = $(this), href
            , target = $this.attr('data-target')
                || e.preventDefault()
                || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
            , option = $(target).data('collapse') ? 'toggle' : $this.data()
        if(!$(target).hasClass("in")){
            $this.find("span").addClass("icon-chevron-down").removeClass("icon-chevron-up");
        }
        else {
            $this.find("span").removeClass("icon-chevron-down").addClass("icon-chevron-up");
        }

    })
});


