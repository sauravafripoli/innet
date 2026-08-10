function setAjaxData(object = null) {
    var data = {
        'sysLangId': VrConfig.sysLangId,
    };
    data[VrConfig.csrfTokenName] = $('meta[name="X-CSRF-TOKEN"]').attr('content');
    if (object != null) {
        Object.assign(data, object);
    }
    return data;
}

function setSerializedData(serializedData) {
    serializedData.push({name: 'sysLangId', value: VrConfig.sysLangId});
    serializedData.push({name: VrConfig.csrfTokenName, value: $('meta[name="X-CSRF-TOKEN"]').attr('content')});
    return serializedData;
}

// Passive event listeners
jQuery.event.special.touchstart = {
    setup: function (_, ns, handle) {
        this.addEventListener("touchstart", handle, {passive: !ns.includes("noPreventDefault")});
    }
};
jQuery.event.special.touchmove = {
    setup: function (_, ns, handle) {
        this.addEventListener("touchmove", handle, {passive: !ns.includes("noPreventDefault")});
    }
};
//validation
(function () {
    'use strict'
    var forms = document.querySelectorAll('.needs-validation')
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }
                form.classList.add('was-validated')
            }, false)
        })
})();

//tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
});


//Popover Intialisation
document.addEventListener('DOMContentLoaded', function () {
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl, {
        sanitize: false // Required if your data-bs-content has HTML that you trust
      })
    })
});

//lazyload background images
document.addEventListener('lazybeforeunveil', function (e) {
    var bg = e.target.getAttribute('data-bg');
    if (bg) {
        e.target.style.backgroundImage = 'url(' + bg + ')';
    }
});

//mobile memu
$(document).on('click', '.mobile-menu-button', function () {
    if ($("#navMobile").hasClass('nav-mobile-open')) {
        $("#navMobile").removeClass('nav-mobile-open');
        $('#overlay_bg').hide();
    } else {
        $("#navMobile").addClass('nav-mobile-open');
        $('#overlay_bg').show();
    }
});
$(document).on('click', '#overlay_bg', function () {
    $("#navMobile").removeClass('nav-mobile-open');
    $('#overlay_bg').hide();
});
//close menu
$('.close-menu-click').click(function () {
    $('#navMobile').removeClass('nav-mobile-open');
    $('#overlay_bg').hide();
});

$(document).ready(function () {
    $('form.needs-validation').attr('novalidate', 'novalidate');
    $(".show-on-page-load").css("visibility", "visible");

    $('.nav-main .nav-item-category').hover(function () {
        var categoryId = $(this).attr('data-category-id');
        $('.mega-menu').css('display', 'none');
        $('.mega-menu .link-sub-category').removeClass('active');
        $('.mega-menu .menu-category-items').removeClass('active');
        $('.mega-menu .link-sub-category-all').addClass('active');
        $('.mega-menu .menu-right .filter-all').addClass('active');
        $('.mega-menu-' + categoryId).css('display', 'flex');
    }, function () {
        $('.mega-menu').css('display', 'none');
    });
    $('.mega-menu').hover(function () {
        $(this).css('display', 'flex');
        var categoryId = $(this).attr('data-category-id');
        $('.nav-main .nav-item-category-' + categoryId).addClass('active');
    }, function () {
        $('.mega-menu').css('display', 'none');
        $('.nav-main .nav-item-category').removeClass('active');
    });
    $('.mega-menu .link-sub-category').hover(function () {
        var filter = $(this).attr('data-category-filter');
        $('.mega-menu .link-sub-category').removeClass('active');
        $(this).addClass('active');
        $('.mega-menu .menu-category-items').removeClass('active');
        $('.mega-menu .menu-right .filter-' + filter).addClass('active');
    }, function () {
    });

    $('.mobile-search-button').click(function () {
        $('.mobile-search-form').slideToggle(300);
    });

 
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.scrollup').fadeIn()
        } else {
            $('.scrollup').fadeOut()
        }
    });
    $(".scrollup").click(function () {
        $('html, body').animate({scrollTop: 0}, 700);
        return false
    });
});

//search
$(".search-icon").click(function () {
    if ($(".search-form").hasClass("open")) {
        $(".search-form").removeClass("open");
    } else {
        $(".search-form").addClass("open");
    }
});
//login
$(document).ready(function () {
    $("#form-login").submit(function (event) {
        event.preventDefault();
        var form = $(this);
        var serializedData = form.serializeArray();
        serializedData = setSerializedData(serializedData);
        $.ajax({
            url: VrConfig.baseURL + '/Auth/loginPost',
            type: 'POST',
            data: serializedData,
            success: function (response) {
                var obj = JSON.parse(response);
                if (obj.result == 1) {
                    location.reload();
                } else if (obj.result == 0) {
                    document.getElementById("result-login").innerHTML = obj.error_message;
                }
            }
        });
    });

    $(".form-newsletter").submit(function (event) {
        event.preventDefault();
        var formId = $(this).attr('id');
        var input = '#' + formId + " .newsletter-input";
        var email = $(input).val().trim();
        if (email == '') {
            $(input).addClass('is-invalid');
            return false;
        } else {
            $(input).removeClass('is-invalid');
        }
        var serializedData = $(this).serializeArray();
        serializedData = setSerializedData(serializedData);
        $.ajax({
            type: 'POST',
            url: VrConfig.baseURL + '/add-newsletter-post',
            data: serializedData,
            success: function (response) {
                var obj = JSON.parse(response);
                if (obj.result == 1) {
                    if (obj.isSuccess) {
                        Swal.fire({text: obj.message, icon: 'success', confirmButtonText: VrConfig.textOk});
                        $(input).val('');
                    } else {
                        Swal.fire({text: obj.message, icon: 'warning', confirmButtonText: VrConfig.textOk});
                    }
                }
            }
        });
    });
});


function getUrlParameter(param) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
}


//close cookies warning
function closeCookiesWarning() {
    $('.cookies-warning').hide();
    $.ajax({
        type: 'POST',
        url: VrConfig.baseURL + '/close-cookies-warning-post',
        data: setAjaxData({}),
        success: function (response) {
        }
    });
}

//show image preview
function showImagePreview(input, showAsBackground) {
    var divId = $(input).attr('data-img-id');
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            if (showAsBackground) {
                $('#' + divId).css('background-image', 'url(' + e.target.result + ')');
            } else {
                $('#' + divId).attr('src', e.target.result);
            }
        }
        reader.readAsDataURL(input.files[0]);
    }
}

$(document).on('click', '.table-of-contents .ul-main li a', function (event) {
    if (this.hash !== "") {
        event.preventDefault();
        var hash = this.hash;
        $('html, body').animate({
            scrollTop: $(hash).offset().top
        }, 500, function () {
            window.location.hash = hash;
        });
    }
});

//print
$("#print_post").on("click", function () {
    $(".post-content .post-title, .post-content .post-image, .post-content .post-text").printThis({importCSS: true,})
});

// NEW CODE BLOCK FOR TOC SCROLLSPY AND OFFCANVAS HANDLING
document.addEventListener('DOMContentLoaded', function () {
    const tocNavList = document.getElementById('tocNavList');
    const tocOffcanvasElement = document.getElementById('tocOffcanvas'); // From your provided HTML
    const bsTocOffcanvas = tocOffcanvasElement ? bootstrap.Offcanvas.getOrCreateInstance(tocOffcanvasElement) : null;

    // Submenu collapse/expand logic (from previous setup, ensure it's compatible)
    const mainTocLinksWithSubmenus = [];
    if (tocNavList) {
        tocNavList.querySelectorAll(':scope > li.nav-item').forEach(mainLiElement => {
            const mainLink = mainLiElement.querySelector('a.nav-link[data-bs-toggle="collapse"]');
            const subTocUl = mainLiElement.querySelector('ul.collapse');
            if (mainLink && subTocUl) {
                // Ensure collapse is initialized for ScrollSpy handling
                if (!bootstrap.Collapse.getInstance(subTocUl)) {
                    new bootstrap.Collapse(subTocUl, { toggle: false });
                }
                mainTocLinksWithSubmenus.push(mainLink);
            }
        });
    }

    // ScrollSpy activation listener for expanding parent submenus
    const mainScrollableContent = document.querySelector('.main-content-wrapper'); // Your main scrollable area
    if (mainScrollableContent) {
        mainScrollableContent.addEventListener('activate.bs.scrollspy', function (event) {
            const activeLink = event.relatedTarget; // The newly activated link by ScrollSpy

            if (!activeLink || !tocNavList || !tocNavList.contains(activeLink)) return;

            let currentParentMainLinkForActive = null;

            if (activeLink.matches('#tocNavList > .nav-item > a.nav-link[data-bs-toggle="collapse"]')) {
                currentParentMainLinkForActive = activeLink;
            } else {
                const parentCollapseUL = activeLink.closest('ul.collapse');
                if (parentCollapseUL) {
                    const mainLinkSelector = `a.nav-link[data-bs-target="#${parentCollapseUL.id}"]`;
                    currentParentMainLinkForActive = tocNavList.querySelector(mainLinkSelector);
                }
            }
            
            mainTocLinksWithSubmenus.forEach(mainLink => {
                const subMenuUl = document.getElementById(mainLink.getAttribute('data-bs-target').substring(1));
                if (subMenuUl) {
                    const collapseInstance = bootstrap.Collapse.getInstance(subMenuUl);
                    if (collapseInstance) {
                        if (mainLink === currentParentMainLinkForActive) {
                            if (!subMenuUl.classList.contains('show')) {
                                collapseInstance.show();
                            }
                        } else {
                            if (subMenuUl.classList.contains('show')) {
                                collapseInstance.hide();
                            }
                        }
                    }
                }
            });
        });
    }

    // NEW/MODIFIED: Handle TOC link clicks to scroll without updating URL hash
    if (tocNavList) {
        tocNavList.querySelectorAll('a.nav-link').forEach(function(link) {
            link.addEventListener('click', function(event) {
                const href = this.getAttribute('href');

                // Check if it's an internal anchor link for a section
                if (href && href.startsWith('#') && href.length > 1) {
                    const targetElement = document.querySelector(href);

                    if (targetElement) {
                        event.preventDefault(); // Stop default link behavior

                        // This function will perform the scroll. We'll call it at the right time.
                        const performScroll = () => {
                            targetElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        };

                        // Check if the offcanvas is currently open (mobile view)
                        if (bsTocOffcanvas && tocOffcanvasElement.classList.contains('show')) {
                            
                            // Listen for the 'hidden.bs.offcanvas' event, which fires AFTER the offcanvas is closed.
                            // The '{ once: true }' option automatically removes this event listener after it runs once.
                            tocOffcanvasElement.addEventListener('hidden.bs.offcanvas', performScroll, { once: true });
                            
                            // Now, start the process of closing the offcanvas.
                            bsTocOffcanvas.hide();

                        } else {
                            // If the offcanvas is not open (i.e., we are on desktop), scroll immediately.
                            performScroll();
                        }
                    }
                }
            });
        });
    }
});
// END OF NEW CODE BLOCK


//on ajax stop
$(document).ajaxStop(function () {
    function b(c) {
        $("#poll_" + c + " .question").hide();
        $("#poll_" + c + " .result").show()
    }

    function a(c) {
        $("#poll_" + c + " .result").hide();
        $("#poll_" + c + " .question").show()
    }
});

(function ($) {
    "use strict";

    /*===============================
    =         Wow Active            =
    ================================*/

    new WOW().init();

  

 /*=============================================
    =       Menu sticky & Scroll to top          =
    =============================================*/
    var windows = $(window);
    var screenSize = windows.width();
    var sticky = $('.header-sticky');
    var $html = $('html');
    var $body = $('body');

    windows.on('scroll', function () {
        var scroll = windows.scrollTop();
        var headerHeight = sticky.height();

        if (screenSize >= 320) {
            if (scroll < headerHeight) {
                sticky.removeClass('is-sticky');
            } else {
                sticky.addClass('is-sticky');
            }
        }

    });
    /*----------  Scroll to top  ----------*/
    function scrollToTop() {
        var $scrollUp = $('#scroll-top'),
            $lastScrollTop = 0,
            $window = $(window);

        $window.on('scroll', function () {
            var st = $(this).scrollTop();
            if (st > $lastScrollTop) {
                $scrollUp.removeClass('show');
            } else {
                if ($window.scrollTop() > 200) {
                    $scrollUp.addClass('show');
                } else {
                    $scrollUp.removeClass('show');
                }
            }
            $lastScrollTop = st;
        });

        $scrollUp.on('click', function (evt) {
            $('html, body').animate({scrollTop: 0}, 600);
            evt.preventDefault();
        });
    }
    scrollToTop();

    /*=========================================
    =            Preloader active            =
    ===========================================*/

    windows.on('load', function(){
        $(".preloader-activate").removeClass('preloader-active');
    });
    
    
    jQuery(window).on('load', function(){
        setTimeout(function(){
        jQuery('.open_tm_preloader').addClass('loaded');
        }, 500);
    });



    /*=========================================
    =            One page nav active          =
    ===========================================*/
    
    var top_offset = $('.navigation-menu--onepage').height() - 60;
    $('.navigation-menu--onepage ul').onePageNav({
        currentClass: 'active',
        scrollOffset: top_offset,
    });
    
    var top_offset_mobile = $('.header-area').height();
    $('.offcanvas-navigation--onepage ul').onePageNav({
        currentClass: 'active',
        scrollOffset: top_offset_mobile,
    });


    /*===========================================
    =            Submenu viewport position      =
    =============================================*/
    
    if ($(".has-children--multilevel-submenu").find('.submenu').length) {
        var elm = $(".has-children--multilevel-submenu").find('.submenu');
        
        elm.each(function(){
            var off = $(this).offset();
            var l = off.left;
            var w = $(this).width();
            var docH = windows.height();
            var docW = windows.width() - 10;
            var isEntirelyVisible = (l + w <= docW);

            if (!isEntirelyVisible) {
                $(this).addClass('left');
            }
        });
    }
    
       /*==========================================
    =            mobile menu active            =
    ============================================*/
    
    $("#mobile-menu-trigger").on('click', function(){
        $("#mobile-menu-overlay").addClass("active");
        $body.addClass('no-overflow');
    });
    
    $("#mobile-menu-close-trigger").on('click', function(){
        $("#mobile-menu-overlay").removeClass("active");
        $body.removeClass('no-overflow');
    });
    
    $(".offcanvas-navigation--onepage ul li a").on('click', function(){
        $("#mobile-menu-overlay").removeClass("active");
        $body.removeClass('no-overflow');
    });
    
    /*Close When Click Outside*/
    $body.on('click', function(e){
        var $target = e.target;
        if (!$($target).is('.mobile-menu-overlay__inner') && !$($target).parents().is('.mobile-menu-overlay__inner') && !$($target).is('#mobile-menu-trigger') && !$($target).is('#mobile-menu-trigger i')){
            $("#mobile-menu-overlay").removeClass("active");
            $body.removeClass('no-overflow');
        }
        if (!$($target).is('.search-overlay__inner') && !$($target).parents().is('.search-overlay__inner') && !$($target).is('#search-overlay-trigger') && !$($target).is('#search-overlay-trigger i')){
            $("#search-overlay").removeClass("active");
            $body.removeClass('no-overflow');
        }
    });
    
      /*===================================
    =           Menu Activeion          =
    ===================================*/
    var cururl = window.location.pathname;
    var curpage = cururl.substr(cururl.lastIndexOf('/') + 1);
    var hash = window.location.hash.substr(1);
    if((curpage == "/" || curpage == "de" || curpage == "") && hash=="")
        {
        //$("nav .navbar-nav > li:first-child").addClass("active");
        } else {
            $(".navigation-menu li").each(function()
        {
            $(this).removeClass("active");
        });
        if(hash != "")
            $(".navigation-menu li a[href*='"+hash+"']").parents("li").addClass("active");
        else
        $(".navigation-menu li a[href*='"+curpage+"']").parents("li").addClass("active");
    }
    
    //var l = window.location.pathname,
        //r = l.substr(l.lastIndexOf("/") + 1),
        //p = window.location.hash.substr(1);
    //("" != r && "/" != r && "de" != r || "" != p) && (e(".navigation-menu li").each((function() {
        //e(this).removeClass("active")
    //})), "" != p ? e(".navigation-menu li a[href*='" + p + "']").parents("li").addClass("active") : e(".navigation-menu li a[href*='" + r + "']").parents("li").addClass("active")), 

/*=========================================
    =             open menu Active            =
    ===========================================*/
     $('.openmenu-trigger').on('click', function (e) {
        e.preventDefault();
        $('.open-menuberger-wrapper').addClass('is-visiable');
    });

    $('.page-close').on('click', function (e) {
        e.preventDefault();
        $('.open-menuberger-wrapper').removeClass('is-visiable');
    });
    
      
    /*=========================================
    =             open menu Active            =
    ===========================================*/
    $("#open-off-sidebar-trigger").on('click', function(){
        $("#page-oppen-off-sidebar-overlay").addClass("active");
        $body.addClass('no-overflow');
    });
    
    $("#menu-close-trigger").on('click', function(){
        $("#page-oppen-off-sidebar-overlay").removeClass("active");
        $body.removeClass('no-overflow');
    });
    

     /*=============================================
    =            search overlay active            =
    =============================================*/
    
    $("#search-overlay-trigger").on('click', function(){
        $("#search-overlay").addClass("active");
        $body.addClass('no-overflow');
    });
    
    $("#search-close-trigger").on('click', function(){
        $("#search-overlay").removeClass("active");
        $body.removeClass('no-overflow');
    });
    

    /*=============================================
    =            hidden icon active            =
    =============================================*/
    
    $("#hidden-icon-trigger").on('click', function(){
        $("#hidden-icon-wrapper").toggleClass("active");
    });

    /*=============================================
    =            newsletter popup active            =
    =============================================*/
    
    $("#newsletter-popup-close-trigger").on('click', function(){
        $("#newsletter-popup").removeClass("active");
    });
    
    /*=========================================
    =             open menu Active            =
    ===========================================*/
    var nodeList = document.querySelectorAll('.share-icon');
    nodeList.forEach((el, i)=>{
        el.addEventListener("click", function(e){
            e.target.parentElement.parentElement.classList.toggle("opened")
            e.stopPropagation();
        })
    })

    /*=============================================
    =            offcanvas mobile menu            =
    =============================================*/
    var $offCanvasNav = $('.offcanvas-navigation'),
        $offCanvasNavSubMenu = $offCanvasNav.find('.sub-menu');
    
    /*Add Toggle Button With Off Canvas Sub Menu*/
    $offCanvasNavSubMenu.parent().prepend('<span class="menu-expand"><i></i></span>');
    
    /*Close Off Canvas Sub Menu*/
    $offCanvasNavSubMenu.slideUp();
    
    /*Category Sub Menu Toggle*/
    $offCanvasNav.on('click', 'li a, li .menu-expand', function(e) {
        var $this = $(this);
        if ( ($this.parent().attr('class').match(/\b(menu-item-has-children|has-children|has-sub-menu)\b/)) && ($this.attr('href') === '#' || $this.hasClass('menu-expand')) ) {
            e.preventDefault();
            if ($this.siblings('ul:visible').length){
                $this.parent('li').removeClass('active');
                $this.siblings('ul').slideUp();
            } else {
                $this.parent('li').addClass('active');
                $this.closest('li').siblings('li').removeClass('active').find('li').removeClass('active');
                $this.closest('li').siblings('li').find('ul:visible').slideUp();
                $this.siblings('ul').slideDown();
            }
        }
    });

    /*=======================================
    =       Portfolio Masonry Activation    =
    =========================================*/

        $('.projects-masonary-wrapper').imagesLoaded(function () {

            // filter items on button click
            $('.messonry-button').on('click', 'button', function () {
                var filterValue = $(this).attr('data-filter');
                $(this).siblings('.is-checked').removeClass('is-checked');
                $(this).addClass('is-checked');
                $grid.isotope({
                    filter: filterValue
                });
            });

            // init Isotope
            var $grid = $('.mesonry-list').isotope({
                percentPosition: true,
                transitionDuration: '0.7s',
                layoutMode: 'masonry',/*
                masonry: {
                    columnWidth: '.resizer',
                }*/
            });
        });

        /*==================================
    =         Mesonry Activation       =
    ===================================*/

    $('.masonry-activation').imagesLoaded(function () {
        // init Isotope
        var $grid = $('.masonry-wrap').isotope({
            itemSelector: '.masonary-item',
            percentPosition: true,
            transitionDuration: '0.7s',
            masonry: {
                // use outer width of grid-sizer for columnWidth
                columnWidth: 2,
                percentPosition: true
            }
        });

    });
    
    /*=============================================
    =            background image            =
    =============================================*/

    var bgSelector = $(".bg-img");
    bgSelector.each(function (index, elem) {
        var element = $(elem),
            bgSource = element.data('bg');
        element.css('background-image', 'url(' + bgSource + ')');
    });


    /*=============================================
    =            wavify activation            =
    =============================================*/

    if($('#feel-the-wave , .feel-the-wave').length) {
        $('#feel-the-wave , .feel-the-wave').wavify({
            height: 80,
            bones: 5,
            amplitude: 100,
            color: 'rgba(224,238,255,0.5)',
            //color: 'url(#gradient1)',
            speed: .15
        });
    }

    if($('#feel-the-wave-two , .feel-the-wave-two').length) {
        $('#feel-the-wave-two , .feel-the-wave-two').wavify({
            height: 120,
            bones: 4,
            amplitude: 60,
            color: 'rgba(224,238,255,0.4)',
            //color: 'url(#gradient2)',
            speed: .25
        });
    }

    /*=====  End of wavify activation  ======*/


    $(document).ready(function(){

    /*=============================================
    =            swiper slider activation            =
    =============================================*/
    var carouselSlider = new Swiper('.hero-slider__container', {
        slidesPerView : 1,
        slidesPerGroup: 1,
        loop: true,
        speed: 150,
        effect: 'fade',
        spaceBetween : 0,
        autoplay: {
            delay: 4000,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-t01',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 1
            },

            991:{
                slidesPerView : 1
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });
    $(".hero-slider__container").hover(function() {
        (this).swiper.autoplay.stop();
    }, function() {
        (this).swiper.autoplay.start();
    });


 
    var brandLogoSlider = new Swiper('.brand-logo-slider__container', {
        slidesPerView : 6,
        loop: true,
        speed: 1000,
        spaceBetween : 30,
        autoplay: {
            delay: 3000,
        },

        breakpoints: {
            1499:{
                slidesPerView : 6
            },

            991:{
                slidesPerView : 4
            },

            767:{
                slidesPerView : 3

            },

            575:{
                slidesPerView : 2
            }
        }
    });
    
    var carouselSlider = new Swiper('.top-info-slider__container', {
        slidesPerView : 3,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        autoplay: true,
        spaceBetween : 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-1',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3
            },
            1200:{
                slidesPerView : 2
            },

            991:{
                slidesPerView : 1
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });
        
    var carouselSlider = new Swiper('.single-flexible__container', {
        slidesPerView : 1,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        spaceBetween : 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-1',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3
            },
            1200:{
                slidesPerView : 2
            },

            991:{
                slidesPerView : 1
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });

        
    var carouselSlider = new Swiper('.service-slider__container', {
        slidesPerView : 4,
        slidesPerGroup: 4,
        loop: true,
        speed: 1000,
        autoplay: true,
        spaceBetween : 0,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-service',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3,
                slidesPerGroup: 3
            },
            1200:{
                slidesPerView : 3,
                slidesPerGroup: 3
            },

            991:{
                slidesPerView : 2,
                slidesPerGroup: 2
            },

            767:{
                slidesPerView : 1,
                slidesPerGroup: 1

            },

            575:{
                slidesPerView : 1,
                slidesPerGroup: 1
            }
        }
    });
  
    var carouselSlider = new Swiper('.service-slider__project-active', {
        slidesPerView : 1,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        autoplay: false,
        spaceBetween : 0,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-service',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 1
            },
            1200:{
                slidesPerView : 1
            },

            991:{
                slidesPerView : 1
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });

    
    var carouselSlider = new Swiper('.three-flexible__container', {
        slidesPerView : 3,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        autoplay: true,
        spaceBetween : 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-3',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3
            },

            991:{
                slidesPerView : 2
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });


    var carouselSlider = new Swiper('.auto--center-flexible__container', {
        slidesPerView: 'auto',
        centeredSlides: true,
        freeMode: false,    
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        spaceBetween : 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-auto',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3
            },

            991:{
                slidesPerView : 2
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });

    var carouselSlider = new Swiper('.auto--per-flexible__container', {
        slidesPerView: 'auto',
        centeredSlides: false,
        freeMode: true,    
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        spaceBetween : 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-5',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3
            },

            991:{
                slidesPerView : 2
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });

    var mySwiper = new Swiper('.auto--pree-mode-flexible__container', {
        spaceBetween : 30,
        loop: true,
        freeMode: true,
        slidesPerView: 'auto',
        pagination: {
            el: '.swiper-pagination-6',
            type: 'bullets',
            clickable: true
        },
        autoplay: {
            delay: 0,
            disableOnInteraction: false,
        },
        speed: 7000
    });
        
    var carouselSlider = new Swiper('.carousel-slider__container', {
        slidesPerView : 3,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        spaceBetween : 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-9',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3
            },

            991:{
                slidesPerView : 2
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });
        
    var carouselSlider = new Swiper('.projects-slider__container', {
        slidesPerView : 3,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        spaceBetween : 0,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-project',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3
            },

            1200:{
                slidesPerView : 2
            },
            
            991:{
                slidesPerView : 2
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });    
    
    var carouselSlider = new Swiper('.projects-slider__three', {
        slidesPerView : 3,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        spaceBetween : 40,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-project',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 3
            },

            1200:{
                slidesPerView : 2
            },
            
            991:{
                slidesPerView : 2
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    }); 
        
    var carouselSlider = new Swiper('.testimonial-slider__container', {
        slidesPerView : 2,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        spaceBetween : 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-t01',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 2
            },

            991:{
                slidesPerView : 1
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });
        
    var carouselSlider = new Swiper('.testimonial-slider__container-two', {
        slidesPerView : 3,
        slidesPerGroup: 1,
        centeredSlides: true,
        loop: true,
        speed: 1000,
        spaceBetween : 50,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-t0',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 2
            },

            991:{
                slidesPerView : 1
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });
        
    var carouselSlider = new Swiper('.testimonial-slider-machine', {
        slidesPerView : 1,
        slidesPerGroup: 1,
        loop: true,
        speed: 1000,
        spaceBetween : 0,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination-machine',
            type: 'bullets',
            clickable: true
        },
        breakpoints: {
            1499:{
                slidesPerView : 1
            },

            1200:{
                slidesPerView : 1 
            },
            
            991:{
                slidesPerView : 1
            },

            767:{
                slidesPerView : 1

            },

            575:{
                slidesPerView : 1
            }
        }
    });    
    
    /*=====  End of swiper slider activation  ======*/
    });
    
    
    /* =====================================
        Fullpage Scroll Animation   
    ======================================*/
    if ($('#fullpage').length) {
        $('#fullpage').fullpage({
            scrollBar: false,
            navigation: true,
            loopBottom: false,
            sectionSelector: 'section',
            scrollingSpeed: 1000,
            autoScrolling: true,
            fitToSection: true,
            fitToSectionDelay: 1000,
            afterLoad: function () {
                var activeSetion = $('.fp-viewing-' + 3);
                activeSetion.addClass('tm-one-page-footer-expanded');
            },
        });
    }

   
    /*===================================
        Svg Icon Draw
    ====================================*/ 
    var $svgIconBox = $('.single-svg-icon-box');
    $svgIconBox.each(function() {
        var $this = $(this),
            $svgIcon = $this.find('.svg-icon'),
            $id = $svgIcon.attr('id'),
            $icon = $svgIcon.data('svg-icon');
        var $vivus = new Vivus($id, { duration: 100, file: $icon });
        $this.on('mouseenter', function () {
            $vivus.reset().play();
        });
    });
    

    /*=================================- 
    =        Scroll Up Color Change    =
    ==================================-*/

    $('.slide-scroll-bg').height('.slide-scroll-bg').scrollie({
        scrollOffset: 0,
        scrollingInView: function (elem) {
            console.log(elem);
            var bgColor = elem.data('background');
            $('.bg-body-color').css('background-color', bgColor);

        }
    });

    /*=============================================
    =            light gallery active            =
    =============================================*/
    
    $('.popup-images').lightGallery(); 

    $('.video-popup').lightGallery(); 


    
    /*=============================================
        showcoupon toggle function
   =============================================*/
    $( '#showcoupon' ).on('click', function() {
        $('#checkout-coupon' ).slideToggle(500);
    });
    $("#chekout-box-2").on("change",function(){
        $(".ship-box-info").slideToggle("100");
    }); 
    

    /*=============================================
    =            reveal footer active            =
    =============================================*/
    
    var revealId = $(".reveal-footer"),
        $mainWrapper = revealId.closest("#main-wrapper"),
        $window = $(window);
    function footerFixed(){
        var heightFooter = revealId.outerHeight(),
            windowWidth = $window.width();
        if (windowWidth > 991) {
            $mainWrapper.css({
                'padding-bottom': heightFooter + 'px'
            });
        } else if(windowWidth <= 991) {
            $mainWrapper.css({
                'padding-bottom': '0px'
            });
        }
    }
    footerFixed();
    $(window).on('resize', function(){
        footerFixed();
    });


    /* particles JS */
    if($('#particles-js').length){
        particlesJS('particles-js',{"particles": {"number": {"value": 80,"density": {"enable": true,"value_area": 1000}},"color": {"value": "#ffffff"},"shape": {"type": "circle","stroke": {"width": 0,"color": "#000000"},"polygon": {"nb_sides": 5},"image": {"src": "img/github.svg","width": 100,"height": 100}},"opacity": {"value": 0.5,"random": false,"anim": {"enable": false,"speed": 1,"opacity_min": 0.1,"sync": false}},"size": {"value": 5,"random": true,"anim": {"enable": false,"speed": 40,"size_min": 0.1,"sync": false}},"line_linked": {"enable": true,"distance": 150,"color": "#ffffff","opacity": 0.4,"width": 1},"move": {"enable": true,"speed": 6,"direction": "none","random": false,"straight": false,"out_mode": "out","attract": {"enable": false,"rotateX": 600,"rotateY": 1200}}},"interactivity": {"detect_on": "canvas","events": {"onhover": {"enable": true,"mode": "grab"},"onclick": {"enable": true,"mode": "repulse"},"resize": true},"modes": {"grab": {"distance": 400,"line_linked": {"opacity": 1}},"bubble": {"distance": 400,"size": 40,"duration": 2,"opacity": 8,"speed": 3},"repulse": {"distance": 200},"push": {"particles_nb": 4},"remove": {"particles_nb": 2}}},"retina_detect": true,"config_demo": {"hide_card": false,"background_color": "#b61924","background_image": "","background_position": "50% 50%","background_repeat": "no-repeat","background_size": "cover"}});
    }
    /* nasa JS */
    if($('#nasa-js').length){
        particlesJS("nasa-js", {"particles": {"number": {"value": 120,"density": {"enable": true,"value_area": 800}},"color": {"value": "#008000"},"shape": {"type": "circle","stroke": {"width": 0,"color": "#000000"},"polygon": {"nb_sides": 5},"image": {"src": "img/github.svg","width": 100,"height": 100}},"opacity": {"value": 1,"random": true,"anim": {"enable": true,"speed": 1,"opacity_min": 0,"sync": false}},"size": {"value": 3,"random": true,"anim": {"enable": false,"speed": 4,"size_min": 0.3,"sync": false}},"line_linked": {"enable": false,"distance": 150,"color": "#ffffff","opacity": 0.4,"width": 1},"move": {"enable": true,"speed": 1,"direction": "right","random": true,"straight": false,"out_mode": "out","bounce": false,"attract": {"enable": false,"rotateX": 600,"rotateY": 600}}},"interactivity": {"detect_on": "canvas","events": {"onhover": {"enable": false,"mode": "repulse"},"onclick": {"enable": true,"mode": "remove"},"resize": true},"modes": {"grab": {"distance": 400,"line_linked": {"opacity": 1}},"bubble": {"distance": 250,"size": 0,"duration": 2,"opacity": 0,"speed": 3},"repulse": {"distance": 400,"duration": 0.4},"push": {"particles_nb": 4},"remove": {"particles_nb": 2}}},"retina_detect": true});
    }

})(jQuery);