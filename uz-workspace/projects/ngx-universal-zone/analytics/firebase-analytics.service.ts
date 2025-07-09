import { Injectable } from '@angular/core';
import { BaseAnalyticsService, IAnalyticsConfig } from './base-analytics.service';

// Firebase Analytics types (to avoid importing Firebase directly in the base library)
export interface IFirebaseAnalytics {
  logEvent: (eventName: string, parameters?: { [key: string]: any }) => void;
  setUserId: (userId: string) => void;
  setUserProperties: (properties: { [key: string]: any }) => void;
  setCurrentScreen: (screenName: string) => void;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseAnalyticsService extends BaseAnalyticsService {
  private analytics: IFirebaseAnalytics | null = null;
  private config: IAnalyticsConfig | null = null;
  
  constructor() {
    super();
  }

  /**
   * Initialize Firebase Analytics
   */
  initialize(analytics: IFirebaseAnalytics, config: IAnalyticsConfig, isDebugMode: boolean = false) {
    this.analytics = analytics;
    this.config = config;
    this.isDebugMode = isDebugMode;
    
    if (this.isDebugMode) {
      console.log('[Firebase Analytics] Service initialized in debug mode');
      console.log('[Firebase Analytics] Config:', config);
      this.monitorGtagCalls();
    }
  }

  /**
   * Monitor gtag calls for debugging
   */
  private monitorGtagCalls() {
    const originalGtag = (window as any).gtag;
    if (originalGtag) {
      (window as any).gtag = (...args: any[]) => {
        console.log('[Firebase Analytics] gtag call:', args);
        return originalGtag.apply(window, args);
      };
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, pageTitle?: string): void {
    if (!this.analytics) return;
    
    this.logDebug(`Page View: ${pageName}`, { page_title: pageTitle });
    
    // Set current screen
    this.analytics.setCurrentScreen(pageName);
    
    // Log page view event
    this.analytics.logEvent('page_view', {
      page_name: pageName,
      page_title: pageTitle || pageName
    });
    
    this.incrementEventCount();
  }

  /**
   * Track button click events
   */
  trackButtonClick(buttonName: string, buttonLocation?: string): void {
    if (!this.analytics) return;
    
    this.logDebug(`Button Click: ${buttonName}`, { location: buttonLocation });
    
    this.analytics.logEvent('button_click', {
      button_name: buttonName,
      button_location: buttonLocation || 'unknown'
    });
    
    this.incrementEventCount();
  }

  /**
   * Track user navigation events
   */
  trackNavigation(from: string, to: string, method: string = 'click'): void {
    if (!this.analytics) return;
    
    this.logDebug(`Navigation: ${from} -> ${to}`, { method });
    
    this.analytics.logEvent('navigation', {
      from_page: from,
      to_page: to,
      method: method
    });
    
    this.incrementEventCount();
  }

  /**
   * Track user actions in the app
   */
  trackUserAction(action: string, category: string, label?: string, value?: number): void {
    if (!this.analytics) return;
    
    this.logDebug(`User Action: ${action}`, { category, label, value });
    
    this.analytics.logEvent('user_action', {
      action: action,
      category: category,
      label: label || '',
      value: value || 0
    });
    
    this.incrementEventCount();
  }

  /**
   * Track business-specific events
   */
  trackBusinessEvent(eventName: string, parameters: { [key: string]: any }): void {
    if (!this.analytics) return;
    
    this.logDebug(`Business Event: ${eventName}`, parameters);
    
    this.analytics.logEvent(eventName, parameters);
    
    this.incrementEventCount();
  }

  /**
   * Track errors that occur in the app
   */
  trackError(errorMessage: string, errorLocation: string, errorType: string = 'runtime'): void {
    if (!this.analytics) return;
    
    this.logDebug(`Error: ${errorMessage}`, { location: errorLocation, type: errorType });
    
    this.analytics.logEvent('error', {
      error_message: errorMessage,
      error_location: errorLocation,
      error_type: errorType
    });
    
    this.incrementEventCount();
  }

  /**
   * Set user ID for analytics
   */
  setUserId(userId: string): void {
    if (!this.analytics) return;
    
    this.logDebug(`Set User ID: ${userId}`);
    
    this.analytics.setUserId(userId);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: { [key: string]: any }): void {
    if (!this.analytics) return;
    
    this.logDebug(`Set User Properties:`, properties);
    
    this.analytics.setUserProperties(properties);
  }

  /**
   * Test analytics functionality
   */
  testAnalytics(): void {
    console.log('[Analytics] Testing Firebase Analytics...');
    console.log('[Analytics] Analytics initialized:', !!this.analytics);
    console.log('[Analytics] Config:', this.config);
    
    if (!this.analytics) {
      console.error('[Analytics] Analytics not initialized! Call initialize() first.');
      return;
    }
    
    // Test events
    this.trackBusinessEvent('analytics_test', {
      test_type: 'manual_validation',
      timestamp: Date.now(),
      user_agent: navigator.userAgent
    });
    
    this.trackPageView('test_page', 'Analytics Test Page');
    this.trackButtonClick('test_button', 'analytics_validation');
    
    console.log('[Analytics] Test events sent.');
  }

  /**
   * Get analytics debug info
   */
  getDebugInfo(): any {
    return {
      isDebugMode: this.isDebugMode,
      eventCount: this.eventCount,
      analyticsInitialized: !!this.analytics,
      config: this.config
    };
  }

  /**
   * Dashboard specific events
   */
  trackDashboardEvents = {
    dashboardViewed: () => {
      this.trackPageView('dashboard', 'Dashboard');
    },
    
    dashboardButtonClicked: (buttonType: string) => {
      this.trackButtonClick(`dashboard_${buttonType}`, 'dashboard');
      this.trackBusinessEvent('dashboard_action', {
        action_type: buttonType,
        screen: 'dashboard'
      });
    },
    
    storeInfoClicked: () => {
      this.trackButtonClick('store_info', 'dashboard');
      this.trackBusinessEvent('store_interaction', {
        action: 'info_clicked',
        screen: 'dashboard'
      });
    },
    
    lottieAnimationCompleted: () => {
      this.trackUserAction('lottie_animation_completed', 'ui_interaction', 'dashboard');
    },
    
    syncStatusViewed: (status: string) => {
      this.trackBusinessEvent('sync_status_viewed', {
        status: status,
        screen: 'dashboard'
      });
    }
  };
}
