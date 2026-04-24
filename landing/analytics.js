/**
 * NeuralShell Landing Page Analytics
 * 
 * Privacy-respecting analytics for launch tracking.
 * No third-party cookies. Self-hosted or anonymous.
 */

(function() {
  'use strict';
  
  const Analytics = {
    version: '1.0.0',
    endpoint: 'https://api.neuralshell.app/analytics', // Replace with actual endpoint
    
    // Initialize tracking
    init() {
      this.sessionId = this.generateId();
      this.startTime = Date.now();
      this.track('page_view', {
        url: window.location.href,
        referrer: document.referrer,
        screen: `${window.screen.width}x${window.screen.height}`,
        lang: navigator.language
      });
      
      this.setupEventListeners();
      this.trackScrollDepth();
    },
    
    // Generate anonymous session ID
    generateId() {
      return 'ns_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Track event
    track(event, data = {}) {
      const payload = {
        event,
        session: this.sessionId,
        timestamp: new Date().toISOString(),
        data: {
          ...data,
          url: window.location.href,
          path: window.location.pathname
        }
      };
      
      // Send to endpoint (or console for now)
      if (this.endpoint && this.endpoint !== 'DISABLED') {
        fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {}); // Silent fail for privacy
      }
      
      // Also log to console for debugging
      console.log('[Analytics]', event, data);
    },
    
    // Setup click tracking
    setupEventListeners() {
      // Download button clicks
      document.querySelectorAll('a[href*="releases"], .btn-primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.track('download_click', {
            button: e.target.textContent.trim(),
            href: e.target.href
          });
        });
      });
      
      // GitHub link clicks
      document.querySelectorAll('a[href*="github"]').forEach(link => {
        link.addEventListener('click', () => {
          this.track('github_click', {
            location: link.closest('nav') ? 'nav' : 'body'
          });
        });
      });
      
      // Navigation clicks
      document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
          this.track('nav_click', {
            section: e.target.getAttribute('href')
          });
        });
      });
      
      // Feature card engagement
      document.querySelectorAll('.feature-card').forEach(card => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.track('feature_view', {
                feature: card.querySelector('.feature-title')?.textContent
              });
              observer.unobserve(card);
            }
          });
        }, { threshold: 0.5 });
        observer.observe(card);
      });
    },
    
    // Track scroll depth
    trackScrollDepth() {
      const depths = [25, 50, 75, 90];
      const tracked = new Set();
      
      window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        
        depths.forEach(depth => {
          if (scrollPercent >= depth && !tracked.has(depth)) {
            tracked.add(depth);
            this.track('scroll_depth', { percent: depth });
          }
        });
      }, { passive: true });
    },
    
    // Track time on page
    getTimeOnPage() {
      return Math.floor((Date.now() - this.startTime) / 1000);
    }
  };
  
  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
  } else {
    Analytics.init();
  }
  
  // Track page unload
  window.addEventListener('beforeunload', () => {
    Analytics.track('page_exit', {
      duration: Analytics.getTimeOnPage()
    });
  });
  
  // Expose globally for manual tracking
  window.NeuralAnalytics = Analytics;
})();
