/**
 * Universal GTM Tracking Library
 * For Unshakable Families Book Campaign
 * GTM Container: GTM-PLXHCM4T
 */

(function() {
    'use strict';

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Utility function to push events
    function pushEvent(eventName, eventData = {}) {
        window.dataLayer.push({
            event: eventName,
            ...eventData
        });
        console.log(`📊 GTM Event: ${eventName}`, eventData);
    }

    /**
     * 1. PAGE VIEW TRACKING
     */
    function trackPageView() {
        // Get UTM parameters from localStorage (if previously stored)
        const storedUtm = localStorage.getItem('utm_params');
        const utmData = storedUtm ? JSON.parse(storedUtm) : {};

        pushEvent('page_view', {
            page_location: window.location.href,
            page_title: document.title,
            page_path: window.location.pathname,
            ...utmData
        });
    }

    /**
     * 2. SCROLL DEPTH TRACKING
     */
    function initScrollTracking() {
        const scrollThresholds = [25, 50, 75, 100];
        const triggered = {};

        window.addEventListener('scroll', function() {
            const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;

            scrollThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !triggered[threshold]) {
                    triggered[threshold] = true;
                    pushEvent('scroll_depth', {
                        scroll_depth_threshold: threshold,
                        scroll_depth_units: 'percent',
                        page_location: window.location.href
                    });
                }
            });
        });
    }

    /**
     * 3. VIDEO PLAY TRACKING
     */
    function initVideoTracking() {
        // Track Vimeo iframes
        const vimeoIframes = document.querySelectorAll('iframe[src*="vimeo.com"]');

        vimeoIframes.forEach((iframe, index) => {
            const player = new Vimeo.Player(iframe);

            player.on('play', function() {
                pushEvent('video_start', {
                    video_provider: 'vimeo',
                    video_title: iframe.getAttribute('title') || `Video ${index + 1}`,
                    video_url: iframe.src,
                    page_location: window.location.href
                });
            });

            player.on('pause', function(data) {
                pushEvent('video_pause', {
                    video_provider: 'vimeo',
                    video_title: iframe.getAttribute('title') || `Video ${index + 1}`,
                    video_current_time: data.seconds,
                    video_percent: data.percent * 100
                });
            });

            player.on('ended', function() {
                pushEvent('video_complete', {
                    video_provider: 'vimeo',
                    video_title: iframe.getAttribute('title') || `Video ${index + 1}`,
                    page_location: window.location.href
                });
            });

            // Track 25%, 50%, 75% milestones
            [0.25, 0.50, 0.75].forEach(milestone => {
                player.on('timeupdate', function(data) {
                    if (data.percent >= milestone && data.percent < milestone + 0.01) {
                        pushEvent('video_progress', {
                            video_provider: 'vimeo',
                            video_title: iframe.getAttribute('title') || `Video ${index + 1}`,
                            video_percent: Math.round(milestone * 100)
                        });
                    }
                });
            });
        });
    }

    /**
     * 4. BUTTON CLICK TRACKING
     */
    function trackButton(element, buttonName, additionalData = {}) {
        pushEvent('button_click', {
            button_name: buttonName,
            button_text: element.textContent.trim().substring(0, 50),
            button_url: element.href || element.getAttribute('onclick') || 'N/A',
            page_location: window.location.href,
            ...additionalData
        });
    }

    function initButtonTracking() {
        // Track all CTA buttons
        document.addEventListener('click', function(e) {
            const target = e.target.closest('button, .btn, a[class*="btn"]');

            if (target) {
                const buttonText = target.textContent.trim();
                let buttonName = 'unknown';

                // Determine button name based on text/class
                if (buttonText.includes('Order') || buttonText.includes('Add to Cart')) {
                    buttonName = 'add_to_cart_button';
                } else if (buttonText.includes('Checkout') || buttonText.includes('Proceed')) {
                    buttonName = 'proceed_to_checkout';
                } else if (buttonText.includes('Chapter') || buttonText.includes('Preview')) {
                    buttonName = 'view_chapter_preview';
                } else if (buttonText.includes('Contact')) {
                    buttonName = 'contact_button';
                } else if (buttonText.includes('Speak') || buttonText.includes('Book')) {
                    buttonName = 'book_speaker';
                } else if (buttonText.includes('Bundle')) {
                    buttonName = 'view_bundle';
                } else if (buttonText.includes('Share')) {
                    buttonName = 'social_share';
                }

                trackButton(target, buttonName, {
                    button_location: getSectionName(target)
                });
            }
        });
    }

    /**
     * 5. SOCIAL LINK TRACKING
     */
    function initSocialTracking() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="x.com"]');

            if (target) {
                const url = target.href;
                let network = 'unknown';

                if (url.includes('facebook')) network = 'facebook';
                else if (url.includes('twitter') || url.includes('x.com')) network = 'twitter';
                else if (url.includes('instagram')) network = 'instagram';
                else if (url.includes('linkedin')) network = 'linkedin';

                pushEvent('social_click', {
                    social_network: network,
                    link_url: url,
                    link_domain: new URL(url).hostname,
                    page_location: window.location.href
                });
            }
        });
    }

    /**
     * 6. FORM SUBMISSION TRACKING
     */
    function initFormTracking() {
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const formName = form.id || form.name || 'unnamed_form';

            pushEvent('form_submit', {
                form_name: formName,
                form_destination: form.action || window.location.href,
                page_location: window.location.href
            });
        });
    }

    /**
     * 7. DOWNLOAD/LINK TRACKING
     */
    function initDownloadTracking() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a');

            if (target && target.href) {
                // Track PDF downloads
                if (target.href.endsWith('.pdf')) {
                    pushEvent('file_download', {
                        file_name: target.href.split('/').pop(),
                        file_extension: 'pdf',
                        link_text: target.textContent.trim(),
                        link_url: target.href
                    });
                }

                // Track mailto links
                if (target.href.startsWith('mailto:')) {
                    pushEvent('email_link_click', {
                        email_address: target.href.replace('mailto:', '').split('?')[0],
                        link_text: target.textContent.trim()
                    });
                }

                // Track external links
                if (target.host && target.host !== window.location.host) {
                    pushEvent('outbound_click', {
                        link_url: target.href,
                        link_domain: target.host,
                        link_text: target.textContent.trim()
                    });
                }
            }
        });
    }

    /**
     * 8. FORMAT/LANGUAGE SELECTION TRACKING
     */
    function trackSelectionChange(selectElement, selectionType) {
        selectElement.addEventListener('change', function() {
            pushEvent('selection_change', {
                selection_type: selectionType,
                selection_value: this.value,
                selection_text: this.options[this.selectedIndex].text,
                page_location: window.location.href
            });
        });
    }

    function initSelectionTracking() {
        // Track format selection (paperback/ebook)
        const formatSelectors = document.querySelectorAll('#bookFormat, [name="format"]');
        formatSelectors.forEach(select => trackSelectionChange(select, 'book_format'));

        // Track language selection
        const languageSelectors = document.querySelectorAll('#bookLanguage, [name="language"]');
        languageSelectors.forEach(select => trackSelectionChange(select, 'book_language'));

        // Track shipping selection
        const shippingSelectors = document.querySelectorAll('[name="shipping"], #shippingMethod');
        shippingSelectors.forEach(select => trackSelectionChange(select, 'shipping_method'));
    }

    /**
     * 9. TIME ON PAGE TRACKING
     */
    function initTimeTracking() {
        const startTime = Date.now();
        const timeThresholds = [30, 60, 120, 300]; // seconds
        const triggered = {};

        setInterval(function() {
            const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

            timeThresholds.forEach(threshold => {
                if (timeOnPage >= threshold && !triggered[threshold]) {
                    triggered[threshold] = true;
                    pushEvent('time_on_page', {
                        time_threshold: threshold,
                        time_unit: 'seconds',
                        page_location: window.location.href
                    });
                }
            });
        }, 1000);
    }

    /**
     * 10. VISIBILITY/IMPRESSION TRACKING
     */
    function initImpressionTracking() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.dataset.impressionTracked) {
                        entry.target.dataset.impressionTracked = 'true';

                        pushEvent('element_visible', {
                            element_name: entry.target.dataset.trackName || entry.target.id || 'unnamed',
                            element_type: entry.target.dataset.trackType || 'section',
                            page_location: window.location.href
                        });
                    }
                });
            }, {
                threshold: 0.5 // Element is 50% visible
            });

            // Track important sections
            document.querySelectorAll('[data-track-impression]').forEach(el => {
                observer.observe(el);
            });
        }
    }

    /**
     * UTILITY FUNCTIONS
     */
    function getSectionName(element) {
        // Find the closest section/container with an ID or class
        const section = element.closest('section, [class*="section"], .hero, .pricing, .testimonials, header, footer');
        if (section) {
            return section.id || section.className.split(' ')[0] || 'unknown_section';
        }
        return 'unknown_section';
    }

    /**
     * INITIALIZE ALL TRACKING
     */
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('🚀 Initializing comprehensive GTM tracking...');

        // Track page view
        trackPageView();

        // Initialize all trackers
        initScrollTracking();
        initButtonTracking();
        initSocialTracking();
        initFormTracking();
        initDownloadTracking();
        initSelectionTracking();
        initTimeTracking();
        initImpressionTracking();

        // Initialize video tracking if Vimeo player is available
        if (typeof Vimeo !== 'undefined') {
            initVideoTracking();
        } else {
            // Load Vimeo player API if iframes detected
            const vimeoIframes = document.querySelectorAll('iframe[src*="vimeo.com"]');
            if (vimeoIframes.length > 0) {
                const script = document.createElement('script');
                script.src = 'https://player.vimeo.com/api/player.js';
                script.onload = initVideoTracking;
                document.head.appendChild(script);
            }
        }

        console.log('✅ GTM tracking initialized');
    }

    // Auto-initialize
    init();

    // Expose tracking functions globally for custom tracking
    window.GTMTracking = {
        trackButton: trackButton,
        pushEvent: pushEvent,
        trackPageView: trackPageView
    };

})();
