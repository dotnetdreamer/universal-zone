import { Inject, Injectable } from "@angular/core";

import { BehaviorSubject, catchError, distinctUntilChanged, EMPTY, Observable, of, shareReplay, Subject, switchMap, takeUntil, tap, timer } from "rxjs";
import { Network } from "@capacitor/network";

import { APP_CONFIG_TOKEN, BaseService, IAppConfig } from "ngx-ionic-zone";

@Injectable({
  providedIn: 'root'
})
export class NetworkService extends BaseService {
  private _pingRunning = new BehaviorSubject(true);
  private _isPingRunning = true;
  private ngDestroy = new Subject<void>();
  
  connected$: Observable<boolean>;
  statusSubject = new BehaviorSubject<boolean>(true);

  constructor(@Inject(APP_CONFIG_TOKEN) private appConfig: IAppConfig) {
    // super();

    Network.getStatus().then((status) =>
      this.statusSubject.next(status.connected)
    );

    this.connected$ = this.statusSubject.asObservable()
    .pipe(distinctUntilChanged());

    Network.addListener("networkStatusChange", (status) => {
      this.statusSubject.next(status.connected);
    });
  }

  ping() {
    return this.getDataRx<boolean>({
      url: this.appConfig.ping?.url || 'ping',
      retryCount: 0 //Do not retry
    });
  }

  public stopPingingServer() {
    this.ngDestroy.next();
    this.ngDestroy.complete();
  }
}