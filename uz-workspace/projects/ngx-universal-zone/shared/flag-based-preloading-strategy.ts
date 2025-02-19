import { Injectable } from "@angular/core";
import { PreloadingStrategy, Route, Router } from "@angular/router";

import { delay, Observable, of, switchMap } from "rxjs";

declare const navigator: any;

@Injectable({ providedIn: "root" })
export class FlagBasedPreloadingStrategy extends PreloadingStrategy {
  constructor(private router: Router) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const preload = route.data?.["preload"];
    const preloadNextRoutes = this.getCurrentRouteData()?.['preloadNextRoutes'] as string[] ?? [];

    if(preload || preloadNextRoutes.length) {
      if(preload) {
        return load();
      }

      if(preloadNextRoutes.includes(route.path)) {
        const delayTime = route.data?.["delay"] ?? 0;
        return of(null).pipe(
          delay(delayTime),
          switchMap(() => this.waitForNetworkIdle()),
          switchMap(() => {
            return load();
          })
        );
      }
    }
    
    return of(null);
  }

  private getCurrentRouteData() {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data;
  }

  private waitForNetworkIdle(): Observable<void> {
    return new Observable<void>((observer) => {
      if (navigator.connection && navigator.connection.downlink > 0) {
        observer.next();
        observer.complete();
      } else {
        const onNetworkIdle = () => {
          if (navigator.connection.downlink > 0) {
            observer.next();
            observer.complete();
            navigator.connection.removeEventListener('change', onNetworkIdle);
          }
        };
        navigator.connection.addEventListener('change', onNetworkIdle);
      }
    });
  }
}
