import { Provider } from '@angular/core';
import { BaseAnalyticsService, NoOpAnalyticsService } from './base-analytics.service';
import { RouterAnalyticsService } from './router-analytics.service';

export function provideUzAnalytics(): Provider[] {
  return [
    {
      provide: BaseAnalyticsService,
      useClass: NoOpAnalyticsService
    },
    RouterAnalyticsService,
  ];
}
