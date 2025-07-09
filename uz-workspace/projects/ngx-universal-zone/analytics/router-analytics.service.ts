import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FirebaseAnalyticsService } from './firebase-analytics.service';

@Injectable({
  providedIn: 'root'
})
export class RouterAnalyticsService {
  private previousUrl: string = '';
  private currentUrl: string = '';

  constructor(
    private router: Router,
    private analyticsService: FirebaseAnalyticsService
  ) {
    this.initializeRouterTracking();
  }

  private initializeRouterTracking() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
        
        // Track page view
        this.trackPageView(event.url);
        
        // Track navigation if we have a previous URL
        if (this.previousUrl && this.previousUrl !== this.currentUrl) {
          this.trackNavigation(this.previousUrl, this.currentUrl);
        }
      });
  }

  private trackPageView(url: string) {
    try {
      const pageName = this.getPageNameFromUrl(url);
      if (this.analyticsService && typeof this.analyticsService.trackPageView === 'function') {
        this.analyticsService.trackPageView(pageName, `Page: ${pageName}`);
      }
    } catch (error) {
      console.warn('[RouterAnalytics] Error tracking page view:', error);
    }
  }

  private trackNavigation(from: string, to: string) {
    try {
      const fromPage = this.getPageNameFromUrl(from);
      const toPage = this.getPageNameFromUrl(to);
      if (this.analyticsService && typeof this.analyticsService.trackNavigation === 'function') {
        this.analyticsService.trackNavigation(fromPage, toPage, 'router_navigation');
      }
    } catch (error) {
      console.warn('[RouterAnalytics] Error tracking navigation:', error);
    }
  }

  private getPageNameFromUrl(url: string): string {
    // Remove query parameters and fragments
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    // Handle specific routes
    if (cleanUrl === '/' || cleanUrl === '/home') return 'dashboard';
    if (cleanUrl.startsWith('/admin')) return 'admin';
    if (cleanUrl.startsWith('/checkout')) return 'checkout';
    if (cleanUrl.startsWith('/auth')) return 'auth';
    if (cleanUrl.startsWith('/store')) return 'store';
    
    // Default: remove leading slash and take first segment
    return cleanUrl.replace('/', '').split('/')[0] || 'unknown';
  }
}
