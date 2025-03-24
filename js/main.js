/**
 * Clear Seas Solutions Portfolio - Main Application
 * 
 * This file serves as the main entry point for the application,
 * handling user interactions, animations, and WebGL pattern integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  /**
   * ClearSeasApp - Main Application Class
   * Manages the portfolio website's functionality and interactions
   */
  class ClearSeasApp {
    constructor() {
      // Store DOM elements
      this.DOM = {
        loader: document.querySelector('.loader'),
        navigation: document.querySelector('.navigation'),
        menuToggle: document.querySelector('.navigation__menu-toggle'),
        menuItems: document.querySelector('.navigation__items'),
        navLinks: document.querySelectorAll('.navigation__item a'),
        sections: document.querySelectorAll('.section'),
        projectFilterBtns: document.querySelectorAll('.projects__filter-btn'),
        projectItems: document.querySelectorAll('.project'),
        contactForm: document.getElementById('contactForm')
      };

      // Pattern renderers
      this.patternRenderers = [];
      
      // State
      this.isMenuOpen = false;
      this.currentSection = 'home';
      this.isPageLoaded = false;
      
      // Initialize app
      this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
      // Start preloading assets
      this.preloadAssets();
      
      // Initialize components
      this.initNavigation();
      this.initMenuToggle();
      this.initProjectFilters();
      this.initContactForm();
      
      // Initialize patterns and animations on window load
      window.addEventListener('load', () => {
        this.initPatterns();
        this.initAnimations();
        this.hideLoader();
      });
    }
    
    /**
     * Preload essential assets
     */
    preloadAssets() {
      // Critical assets to preload
      const assets = [
        'https://i.imgur.com/w19qtCh.png',  // Red roses pattern
        'https://i.imgur.com/he2HjBd.png',  // Pink roses pattern
        'https://i.imgur.com/Dh9RQuk.jpeg'  // Logo
      ];
      
      let loadedCount = 0;
      const totalAssets = assets.length;
      
      // Update loader progress as assets load
      const updateProgress = () => {
        loadedCount++;
        const progress = loadedCount / totalAssets;
        
        // Update loader progress bar
        if (this.DOM.loader) {
          const progressBar = this.DOM.loader.querySelector('.loader__progress span');
          if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
          }
        }
        
        // Mark as loaded when all assets are ready
        if (loadedCount >= totalAssets) {
          setTimeout(() => {
            this.isPageLoaded = true;
          }, 500);
        }
      };
      
      // Preload images
      assets.forEach(src => {
        const img = new Image();
        img.onload = updateProgress;
        img.onerror = updateProgress; // Count errors as loaded
        img.src = src;
      });
    }
    
    /**
     * Hide the loader when page is ready
     */
    hideLoader() {
      if (this.isPageLoaded && this.DOM.loader) {
        // Fade out loader
        this.DOM.loader.style.opacity = '0';
        
        // Hide loader after fade out
        setTimeout(() => {
          this.DOM.loader.classList.add('is-hidden');
          document.body.classList.remove('no-scroll');
        }, 1000);
      } else {
        // Check again in 500ms if not loaded yet
        setTimeout(() => this.hideLoader(), 500);
      }
    }
    
    /**
     * Initialize navigation functionality
     */
    initNavigation() {
      // Handle navigation item clicks
      this.DOM.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          
          const targetId = link.getAttribute('href').substring(1);
          const targetSection = document.getElementById(targetId);
          
          // Close menu if it's open on mobile
          if (this.isMenuOpen) {
            this.toggleMenu();
          }
          
          // Scroll to target section
          if (targetSection) {
            window.scrollTo({
              top: targetSection.offsetTop,
              behavior: 'smooth'
            });
            
            // Update active nav item
            this.updateActiveNavItem(targetId);
          }
        });
      });
      
      // Change navigation background on scroll
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          this.DOM.navigation.classList.add('is-scrolled');
        } else {
          this.DOM.navigation.classList.remove('is-scrolled');
        }
        
        // Update active nav item based on current section
        this.updateActiveNavFromScroll();
      });
    }
    
    /**
     * Update active navigation based on scroll position
     */
    updateActiveNavFromScroll() {
      // Determine which section is currently visible
      let currentSectionId = this.currentSection;
      
      this.DOM.sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const scrollPosition = window.scrollY + window.innerHeight / 3;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          currentSectionId = section.getAttribute('id');
        }
      });
      
      // Only update if the current section has changed
      if (currentSectionId !== this.currentSection) {
        this.updateActiveNavItem(currentSectionId);
        
        // Trigger pattern animations when section changes
        this.animatePatternForSection(currentSectionId);
      }
    }
    
    /**
     * Update active nav item
     * @param {string} sectionId - The ID of the active section
     */
    updateActiveNavItem(sectionId) {
      // Remove active class from all nav items
      this.DOM.navLinks.forEach(link => {
        link.classList.remove('is-active');
      });
      
      // Add active class to current section's nav item
      const activeNavItem = document.querySelector(`.navigation__item a[href="#${sectionId}"]`);
      if (activeNavItem) {
        activeNavItem.classList.add('is-active');
      }
      
      // Update current section
      this.currentSection = sectionId;
    }
    
    /**
     * Initialize mobile menu toggle
     */
    initMenuToggle() {
      if (this.DOM.menuToggle) {
        this.DOM.menuToggle.addEventListener('click', () => {
          this.toggleMenu();
        });
      }
    }
    
    /**
     * Toggle mobile menu state
     */
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
      
      // Toggle menu active state
      if (this.DOM.menuToggle) {
        this.DOM.menuToggle.classList.toggle('is-active', this.isMenuOpen);
      }
      
      if (this.DOM.menuItems) {
        this.DOM.menuItems.classList.toggle('is-visible', this.isMenuOpen);
      }
      
      // Toggle body scroll
      document.body.classList.toggle('no-scroll', this.isMenuOpen);
    }
    
    /**
     * Initialize WebGL pattern renderers
     */
    initPatterns() {
      // Initialize pattern for hero section (red roses)
      this.patternRenderers[0] = new PatternRenderer({
        canvasId: 'pattern1Canvas',
        patternType: 1,
        hueShift: 0,
        brightness: 1.0,
        saturation: 1.2,
        interactWithMouse: true,
        interactWithScroll: true,
        accentColor: new THREE.Color(1, 0.2, 0.3) // Red accent
      });
      
      // Initialize pattern for about section (pink/yellow roses)
      this.patternRenderers[1] = new PatternRenderer({
        canvasId: 'pattern2Canvas',
        patternType: 2,
        hueShift: 0.1, // Slightly shift hue
        brightness: 1.0,
        saturation: 1.0,
        interactWithMouse: true,
        interactWithScroll: true,
        accentColor: new THREE.Color(1, 0.6, 0.2) // Gold/orange accent
      });
      
      // Initialize expertise section pattern
      this.patternRenderers[2] = new PatternRenderer({
        canvasId: 'expertiseCanvas',
        patternType: 1,
        hueShift: 0.2, // Different hue shift
        brightness: 0.8,
        saturation: 0.9,
        interactWithMouse: true,
        interactWithScroll: true,
        accentColor: new THREE.Color(0.2, 0.7, 0.9) // Blue-teal accent
      });
      
      // Initialize projects section pattern
      this.patternRenderers[3] = new PatternRenderer({
        canvasId: 'projectsCanvas',
        patternType: 2,
        hueShift: 0.5, // More dramatic hue shift
        brightness: 0.9,
        saturation: 0.8,
        interactWithMouse: true,
        interactWithScroll: true,
        accentColor: new THREE.Color(0.2, 0.5, 0.8) // Blue accent
      });
      
      // Initialize contact section pattern
      this.patternRenderers[4] = new PatternRenderer({
        canvasId: 'contactCanvas',
        patternType: 1,
        hueShift: 0.7, // Dramatic hue shift
        brightness: 0.7,
        saturation: 1.1,
        interactWithMouse: true,
        interactWithScroll: true,
        accentColor: new THREE.Color(0.1, 0.8, 0.6) // Teal accent
      });
    }
    
    /**
     * Animate pattern effects based on active section
     * @param {string} sectionId - The ID of the active section
     */
    animatePatternForSection(sectionId) {
      // Skip if no renderers
      if (!this.patternRenderers.length) return;
      
      // Animate pattern effects based on current section
      switch(sectionId) {
        case 'home':
          // Emphasize the red/pink accents for hero
          if (this.patternRenderers[0]) {
            this.patternRenderers[0].animateHueShift(0, 1.5);
            this.patternRenderers[0].animateBrightness(1.2, 1.5);
            this.patternRenderers[0].animateSaturation(1.3, 1.5);
            this.patternRenderers[0].changeAccentColor(new THREE.Color(1, 0.2, 0.3));
            this.patternRenderers[0].simulateScroll(0.8, 1.5);
          }
          break;
          
        case 'about':
          // Enhance the gold/yellow aspects for about
          if (this.patternRenderers[1]) {
            this.patternRenderers[1].animateHueShift(0.05, 1.5);
            this.patternRenderers[1].animateBrightness(1.1, 1.5);
            this.patternRenderers[1].animateSaturation(1.2, 1.5);
            this.patternRenderers[1].changeAccentColor(new THREE.Color(1, 0.7, 0.2));
            this.patternRenderers[1].simulateScroll(0.7, 1.5);
          }
          break;
          
        case 'expertise':
          // More blue-tinted variation for expertise
          if (this.patternRenderers[2]) {
            this.patternRenderers[2].animateHueShift(0.6, 1.5);
            this.patternRenderers[2].animateBrightness(0.9, 1.5);
            this.patternRenderers[2].animateSaturation(1.0, 1.5);
            this.patternRenderers[2].changeAccentColor(new THREE.Color(0.2, 0.6, 1.0));
            this.patternRenderers[2].simulateScroll(0.6, 1.5);
          }
          break;
          
        case 'projects':
          // Cooler tones for projects
          if (this.patternRenderers[3]) {
            this.patternRenderers[3].animateHueShift(0.7, 1.5);
            this.patternRenderers[3].animateBrightness(1.0, 1.5);
            this.patternRenderers[3].animateSaturation(0.9, 1.5);
            this.patternRenderers[3].changeAccentColor(new THREE.Color(0.3, 0.5, 0.9));
            this.patternRenderers[3].simulateScroll(0.7, 1.5);
          }
          break;
          
        case 'contact':
          // Vibrant, attention-grabbing for contact
          if (this.patternRenderers[4]) {
            this.patternRenderers[4].animateHueShift(0.8, 1.5);
            this.patternRenderers[4].animateBrightness(1.2, 1.5);
            this.patternRenderers[4].animateSaturation(1.4, 1.5);
            this.patternRenderers[4].changeAccentColor(new THREE.Color(0.1, 0.9, 0.7));
            this.patternRenderers[4].simulateScroll(0.9, 1.5);
          }
          break;
      }
    }
    
    /**
     * Initialize animations
     */
    initAnimations() {
      // Only proceed if GSAP is available
      if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded. Animations disabled.');
        return;
      }
      
      // Register ScrollTrigger plugin if available
      if (gsap.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }
      
      // Hero section entrance animations
      this.animateHeroEntrance();
      
      // Initialize scroll animations
      this.initScrollAnimations();
    }
    
    /**
     * Animate hero section entrance
     */
    animateHeroEntrance() {
      // Timeline for hero animations
      const heroTimeline = gsap.timeline({ delay: 0.5 });
      
      // Get hero elements
      const heroTitle = document.querySelector('.hero__title');
      const heroSubtitle = document.querySelector('.hero__subtitle');
      const heroDescription = document.querySelector('.hero__description');
      const heroCta = document.querySelector('.hero__cta');
      const heroScroll = document.querySelector('.hero__scroll-indicator');
      
      if (heroTitle) {
        // Animate hero title lines
        heroTimeline.fromTo(heroTitle.querySelectorAll('.hero__title-line'), 
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power2.out' }
        );
      }
      
      if (heroSubtitle) {
        // Animate hero subtitle
        heroTimeline.fromTo(heroSubtitle,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.4' // Overlap with previous animation
        );
      }
      
      if (heroDescription) {
        // Animate hero description
        heroTimeline.fromTo(heroDescription,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.3'
        );
      }
      
      if (heroCta) {
        // Animate CTA buttons
        heroTimeline.fromTo(heroCta.querySelectorAll('.button'),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power2.out' },
          '-=0.3'
        );
      }
      
      if (heroScroll) {
        // Animate scroll indicator
        heroTimeline.fromTo(heroScroll,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.2'
        );
      }
    }
    
    /**
     * Initialize scroll-triggered animations
     */
    initScrollAnimations() {
      // Skip if ScrollTrigger isn't available
      if (!gsap || !gsap.ScrollTrigger) return;
      
      // Animate section headers
      document.querySelectorAll('.section__header').forEach(header => {
        if (header.closest('#home')) return; // Skip home section
        
        gsap.fromTo(header,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            scrollTrigger: {
              trigger: header,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
      
      // Animate timeline items
      document.querySelectorAll('.timeline__item').forEach((item, index) => {
        gsap.fromTo(item,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: index * 0.2,
            scrollTrigger: {
              trigger: item.closest('.timeline'),
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
      
      // Animate expertise areas
      document.querySelectorAll('.expertise__area').forEach((area, index) => {
        gsap.fromTo(area,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: index * 0.2,
            scrollTrigger: {
              trigger: area.closest('.expertise__areas'),
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
      
      // Animate project items
      document.querySelectorAll('.project').forEach((project, index) => {
        gsap.fromTo(project,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: index * 0.1,
            scrollTrigger: {
              trigger: project.closest('.projects__grid'),
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
      
      // Animate contact form
      const contactForm = document.querySelector('.contact__form');
      if (contactForm) {
        gsap.fromTo(contactForm,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            scrollTrigger: {
              trigger: contactForm,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      }
    }
    
    /**
     * Initialize project filtering
     */
    initProjectFilters() {
      // Skip if no filter buttons
      if (!this.DOM.projectFilterBtns.length) return;
      
      // Handle filter button clicks
      this.DOM.projectFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.getAttribute('data-filter');
          
          // Update active button
          this.DOM.projectFilterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Filter projects
          this.filterProjects(filter);
        });
      });
    }
    
    /**
     * Filter projects by category
     * @param {string} filter - The filter category
     */
    filterProjects(filter) {
      // Skip if no projects
      if (!this.DOM.projectItems.length) return;
      
      // Process each project
      this.DOM.projectItems.forEach(project => {
        const category = project.getAttribute('data-category');
        
        if (filter === 'all' || filter === category) {
          // Show project
          project.style.display = 'block';
          gsap.to(project, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
          });
        } else {
          // Hide project
          gsap.to(project, {
            opacity: 0,
            scale: 0.95,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              project.style.display = 'none';
            }
          });
        }
      });
      
      // Animate pattern for visual feedback
      if (this.patternRenderers[3]) {
        this.patternRenderers[3].simulateScroll(0.8, 1.0);
      }
    }
    
    /**
     * Initialize contact form
     */
    initContactForm() {
      // Skip if no form
      if (!this.DOM.contactForm) return;
      
      // Handle form submission
      this.DOM.contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simulate form submission (replace with actual submission in production)
        console.log('Form submitted!');
        
        // Show success message
        this.showFormSuccess();
      });
    }
    
    /**
     * Show form submission success message
     */
    showFormSuccess() {
      // Skip if no form
      if (!this.DOM.contactForm) return;
      
      // Create success message
      const successMessage = document.createElement('div');
      successMessage.className = 'form__success';
      successMessage.innerHTML = `
        <h3>Thank you for your message!</h3>
        <p>I'll get back to you as soon as possible.</p>
      `;
      
      // Replace form with success message
      this.DOM.contactForm.innerHTML = '';
      this.DOM.contactForm.appendChild(successMessage);
      
      // Animate success message
      gsap.fromTo(successMessage,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
      
      // Animate pattern for visual feedback
      if (this.patternRenderers[4]) {
        this.patternRenderers[4].simulateScroll(1.0, 1.0);
        this.patternRenderers[4].changeAccentColor(new THREE.Color(0.2, 1.0, 0.5)); // Green for success
      }
    }
  }

  // Initialize the app
  const app = new ClearSeasApp();
});
