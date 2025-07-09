import { Injectable } from '@angular/core';

export interface IAnalyticsConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export interface IAnalyticsService {
  /**
   * Track page view
   */
  trackPageView(pageName: string, pageTitle?: string): void;
  
  /**
   * Track button click events
   */
  trackButtonClick(buttonName: string, buttonLocation?: string): void;
  
  /**
   * Track user navigation events
   */
  trackNavigation(from: string, to: string, method?: string): void;
  
  /**
   * Track user actions in the app
   */
  trackUserAction(action: string, category: string, label?: string, value?: number): void;
  
  /**
   * Track business-specific events
   */
  trackBusinessEvent(eventName: string, parameters: { [key: string]: any }): void;
  
  /**
   * Track errors that occur in the app
   */
  trackError(errorMessage: string, errorLocation: string, errorType?: string): void;
  
  /**
   * Set user ID for analytics
   */
  setUserId(userId: string): void;
  
  /**
   * Set user properties
   */
  setUserProperties(properties: { [key: string]: any }): void;
  
  /**
   * Test analytics functionality
   */
  testAnalytics(): void;
  
  /**
   * Get analytics debug info
   */
  getDebugInfo(): any;
}

@Injectable({
  providedIn: 'root'
})
export abstract class BaseAnalyticsService implements IAnalyticsService {
  protected isDebugMode = false;
  protected eventCount = 0;
  
  abstract trackPageView(pageName: string, pageTitle?: string): void;
  abstract trackButtonClick(buttonName: string, buttonLocation?: string): void;
  abstract trackNavigation(from: string, to: string, method?: string): void;
  abstract trackUserAction(action: string, category: string, label?: string, value?: number): void;
  abstract trackBusinessEvent(eventName: string, parameters: { [key: string]: any }): void;
  abstract trackError(errorMessage: string, errorLocation: string, errorType?: string): void;
  abstract setUserId(userId: string): void;
  abstract setUserProperties(properties: { [key: string]: any }): void;
  abstract testAnalytics(): void;
  abstract getDebugInfo(): any;
  
  /**
   * Internal method to track event count in debug mode
   */
  protected incrementEventCount() {
    if (this.isDebugMode) {
      this.eventCount++;
      console.log(`[Analytics] Total events tracked: ${this.eventCount}`);
    }
  }

  /**
   * Log debug information
   */
  protected logDebug(message: string, data?: any) {
    if (this.isDebugMode) {
      console.log(`[Analytics] ${message}`, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }
}
