import { Injector } from '@angular/core';

// https://blogs.msdn.microsoft.com/premier_developer/2018/06/17/angular-how-to-simplify-components-with-typescript-inheritance/
export class AppInjector {
  private static injector: Injector;

  static setInjector(injector: Injector) {
    AppInjector.injector = injector;
  }

  static getInjector(): Injector {
    return AppInjector.injector;
  }
}
