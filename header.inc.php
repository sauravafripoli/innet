<?php if (!defined('IN_GS')) { die('you cannot load this page directly.'); }
/****************************************************
*
* @File: 	footer.inc.php
* @Package:	APRI Theme
* @Action:	APRI header theme for microsites and minipages
*
*****************************************************/
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta property="og:title" content="<?php get_page_clean_title(); ?>">
		
		<meta property="og:description" content="Decolonising Development Cooperation Discourse Tool">
		<meta property="og:image" content="#"> 
		<meta property="og:url" content="https://afripoli.org/projects/decolonising-development/">
		<meta property="og:type" content="Viz Tool">
	
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:title" content="<?php get_page_clean_title(); ?>">
		<meta name="twitter:description" content="Explore Decolonising Development Cooperation Discourse Tool">
		<meta name="twitter:image" content="#"> 
		<meta name="twitter:url" content="https://afripoli.org/projects/decolonising-development/">
		<meta name="twitter:site" content="@APRI_Africa">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">

		<title><?php get_page_clean_title(); ?> - <?php get_site_name(); ?></title>
		<meta name="robots" content="index, follow">
		<link rel="shortcut icon" type="image/png" href="//afripoli.org/uploads/logo/logo_60a657d21d6f4.png"/>
		
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
	
		
        <link href="<?php get_theme_url(); ?>/assets/css/style-lite.css" rel="stylesheet">

        <!-- Added leaflet -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
		
		
		
	<link href="<?php get_theme_url(); ?>/assets/css/custom.css" rel="stylesheet">

		<script src="https://d3js.org/d3.v6.min.js"></script>

		<script type="importmap">
		{
		    "imports": {
		        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
		        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
		    }
		}
		</script>
		
		<style>:root {--apri-font-primary:  "Open Sans", Helvetica, sans-serif;--apri-font-secondary:  "UncutSans Semibold","UncutSans Regular",Arial,sans-serif;--apri-font-tertiary:  "Open Sans", Helvetica, sans-serif;--apri-theme-color: #f8ae1a;--apri-block-color: #161616;--apri-mega-menu-color: #f9f9f9;} .section-videos .video-large .image {height: 100% !important;}.img-description.text-end,.post-content .img-description.text-end{text-align:right}
.bn-ds-1{width: 728px; height: 90px;}.bn-mb-1{width: 300px; height: 250px;}.modal-newsletter .image {background-image: url('https://afripoli.org/assets/img/newsletter.webp');}</style>
		
		
	<?php get_header(); ?>

		<!-- Global site tag (gtag.js) - Google Analytics -->
		<script async src="https://www.googletagmanager.com/gtag/js?id=G-MYDST6Z8W5"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', 'G-MYDST6Z8W5');
		</script>
	</head>
	
	<body>
	<header id="header" class="header-area border-bottom">

<div class="header-bottom-wrap header-sticky">
 <div class="container-xl">
  <div class="row">
   <div class="col-lg-12">
    <div class="header position-relative">
     <div class="header__logo">
      <a href="https://afripoli.org">
       <img src="https://afripoli.org/uploads/logo/logo_60a2eb206046f.svg" alt="logo" class="logo" width="178" height="56">
      </a>
     </div>
     <div class="header-midle-box">
      <div class="header-bottom-wrap d-md-block d-none">
       <div class="header-bottom-inner">
        <div class="header-bottom-left-wrap">
         <div class="header__navigation d-none d-xl-block">
          <nav class="navigation-menu primary--menu">
           <ul>
            
            <li class="has-children has-children--multilevel-submenu">
             <a href="https://afripoli.org"><span>Programmes</span></a>
             <ul class="submenu">
                                  <li><a href="https://afripoli.org/climate-transitions"><span>Climate Transitions</span></a></li>
                                        <li><a href="https://afripoli.org/just-technology-transition"><span>Just Green Technology Transition</span></a></li>
                                        <li><a href="https://afripoli.org/geopolitics-and-geoeconomics"><span>Geopolitics &amp; Geoeconomics</span></a></li>
                                        <li><a href="https://afripoli.org/economy-finance-society"><span>Economy &amp; Society</span></a></li>
                                        <li><a href="https://afripoli.org/executive-office"><span>Executive Office</span></a></li>
                                        <li><a href="https://afripoli.org/climate-agenda"><span>Africa&#039;s Climate Agenda</span></a></li>
                                        <li><a href="https://afripoli.org/africas-digital-agenda"><span>Africa’s Digital Agenda</span></a></li>
                                 </ul>
            </li>

                              <li class="has-children has-children--multilevel-submenu">
                   <a href="#"><span>Analysis</span></a>
                   <ul class="submenu">
                                          <li><a href="/analysis/report"><span>Reports</span></a></li>
                                           <li><a href="https://afripoli.org/analysis/policy-paper"><span>Policy Papers</span></a></li>
                                           <li><a href="https://afripoli.org/analysis/policy-brief"><span>Policy Briefs</span></a></li>
                                           <li><a href="https://afripoli.org/analysis/short-analysis"><span>Short Analyses</span></a></li>
                                           <li><a href="https://afripoli.org/analysis/data-visualisation"><span>Data Visualisations</span></a></li>
                                           <li><a href="https://afripoli.org/analysis/commentary"><span>Commentaries</span></a></li>
                                           <li><a href="https://afripoli.org/analysis/expert-interview"><span>Expert Interviews</span></a></li>
                                           <li><a href="https://afripoli.org/analysis/briefing-note"><span>Briefing Notes</span></a></li>
                                        </ul>
                  </li>
                                   <li><a href="https://afripoli.org/our-projects"><span>Projects</span></a></li>
                                   <li><a href="https://afripoli.org/events"><span>Events</span></a></li>
                                   <li><a href="https://afripoli.org/experts"><span>Experts</span></a></li>
                                   <li class="has-children has-children--multilevel-submenu">
                   <a href="#"><span>About</span></a>
                   <ul class="submenu">
                                          <li><a href="https://afripoli.org/about"><span>About Us</span></a></li>
                                           <li><a href="https://afripoli.org/advisory-board"><span>Advisory Board</span></a></li>
                                           <li><a href="https://afripoli.org/annual-report"><span>Annual Report</span></a></li>
                                           <li><a href="https://afripoli.org/contact"><span>Contact Us</span></a></li>
                                           <li><a href="https://afripoli.org/opportunities"><span>Opportunities</span></a></li>
                                        </ul>
                  </li>
                 
                                   </ul>
          </nav>
         </div>
        </div>
       </div>
      </div>
     </div>
     <div class="header-right">
      <div class="header-right-inner" id="hidden-icon-wrapper">
       <div class="language-menu">
        <ul>
                   <li>
           <a href="#"><i class="icon-globe"></i><span class="wpml-ls-native">En</span></a>
           <ul class="ls-sub-menu">
                         <li>
              <a href="https://afripoli.org">
               <img class="ls-flag selected" alt="" title="En">
               <span class="wpml-ls-native">En</span>
              </a>
             </li>
                         <li>
              <a href="https://afripoli.org/de">
               <img class="ls-flag " alt="" title="De">
               <span class="wpml-ls-native">De</span>
              </a>
             </li>
                       </ul>
          </li>
                 </ul>
       </div>
      </div>
     </div>

     <div class="d-none d-xl-block d-xxl-none me-2 d-flex align-items-center">
      <ul class="navbar-nav flex-row flex-wrap ms-md-auto align-items-center">
                    </ul>
     </div>

     <div class="header-search-form-two">
      <form action="#" class="search-form-top-active">
       <div class="search-icon" id="search-overlay-trigger">
        <a href="#" aria-label="Open Search Overlay"><i class="bi bi-search"></i></a>
       </div>
      </form>
     </div>

     <div class="mobile-navigation-icon d-block d-xl-none me-2" id="mobile-menu-trigger">
      <i></i>
     </div>
    </div>
   </div>
  </div>
 </div>
</div>
<div class="mobile-menu-overlay" id="mobile-menu-overlay">
<div class="mobile-menu-overlay__inner">
<div class="mobile-menu-overlay__header">
<div class="container-fluid">
<div class="row align-items-center">
<div class="col-md-6 col-8">
<div class="logo">
<a href="https://afripoli.org" class="display-inline-block">
<img src="https://afripoli.org/uploads/logo/logo_60a2eb206046f.svg" alt="logo" class="logo" width="178" height="56">
</a>
</div>
</div>
<div class="col-md-6 col-4">
<div class="mobile-menu-content text-right"><span class="mobile-navigation-close-icon" id="mobile-menu-close-trigger"></span></div>
</div>
</div>
</div>
</div>
<div class="mobile-menu-overlay__body">
<nav class="offcanvas-navigation primary--menu">
<ul>
<li class="has-children"><a class="fw-bold text-light" href="#">Programmes</a>
<ul class="sub-menu">
<li><a class="text-light" href="https://afripoli.org/climate-transitions"><span>Climate Transitions</span></a></li>
<li><a class="text-light" href="https://afripoli.org/just-technology-transition"><span>Just Green Technology Transition</span></a></li>
<li><a class="text-light" href="https://afripoli.org/geopolitics-and-geoeconomics"><span>Geopolitics &amp; Geoeconomics</span></a></li>
<li><a class="text-light" href="https://afripoli.org/economy-finance-society"><span>Economy &amp; Society</span></a></li>
<li><a class="text-light" href="https://afripoli.org/executive-office"><span>Executive Office</span></a></li>
<li><a class="text-light" href="https://afripoli.org/climate-agenda"><span>Africa&#039;s Climate Agenda</span></a></li>
<li><a class="text-light" href="https://afripoli.org/africas-digital-agenda"><span>Africa’s Digital Agenda</span></a></li>
</ul>
</li>
<li class="has-children"><a class="fw-bold text-light" href="#">Analysis</a><ul class="sub-menu"><li class=""><a class="text-light" href="/analysis/report"><span>Reports</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/analysis/policy-paper"><span>Policy Papers</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/analysis/policy-brief"><span>Policy Briefs</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/analysis/short-analysis"><span>Short Analyses</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/analysis/data-visualisation"><span>Data Visualisations</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/analysis/commentary"><span>Commentaries</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/analysis/expert-interview"><span>Expert Interviews</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/analysis/briefing-note"><span>Briefing Notes</span></a></li>
</ul>
</li>
<li class=""><a class="fw-bold text-light" href="https://afripoli.org/our-projects"><span>Projects</span></a></li>
<li class=""><a class="fw-bold text-light" href="https://afripoli.org/events"><span>Events</span></a></li>
<li class=""><a class="fw-bold text-light" href="https://afripoli.org/experts"><span>Experts</span></a></li>
<li class="has-children"><a class="fw-bold text-light" href="#">About</a><ul class="sub-menu"><li class=""><a class="text-light" href="https://afripoli.org/about"><span>About Us</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/advisory-board"><span>Advisory Board</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/annual-report"><span>Annual Report</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/contact"><span>Contact Us</span></a></li>
<li class=""><a class="text-light" href="https://afripoli.org/opportunities"><span>Opportunities</span></a></li>
</ul>
</li>
<li class="has-children border-0"><a class="fw-bold text-light" href="#">Language</a>
<ul class="sub-menu"><li><a class="text-light" href="https://afripoli.org" class="selected ">En</a></li>
<li><a class="text-light" href="https://afripoli.org/de" class=" ">De</a></li>
</ul>
</li>
</ul>
</nav>
</div>
</div>
</div>
</header>

<div class="search-overlay" id="search-overlay">
    <div class="search-overlay__header">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6 ms-auto col-4">
                    <div class="search-content text-end">
                        <span class="mobile-navigation-close-icon" id="search-close-trigger"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="search-overlay__inner">
        <div class="search-overlay__body">
            <div class="search-overlay__form">
                <form action="https://afripoli.org/search" method="get">
                    <input type="text" name="q" maxlength="300" pattern=".*\S+.*" class="form-control form-input"
                        placeholder="Search..." required>
                </form>
            </div>
        </div>
    </div>
</div>
