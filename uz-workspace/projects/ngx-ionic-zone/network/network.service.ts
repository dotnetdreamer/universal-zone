import { Inject, Injectable } from "@angular/core";

import { BehaviorSubject, catchError, distinctUntilChanged, EMPTY, Observable, of, shareReplay, Subject, switchMap, takeUntil, tap, timer } from "rxjs";
import { Network } from "@capacitor/network";

import { APP_CONFIG_TOKEN, BaseService, IAppConfig } from "ngx-ionic-zone";

@Injectable({
  providedIn: 'root'
})
export class NetworkService extends BaseService {
  private _serverAvailableSubject = new BehaviorSubject<boolean>(true);
  private _pingRunning = new BehaviorSubject(true);
  private _isPingRunning = true;
  private ngDestroy = new Subject<void>();
  
  connected$: Observable<boolean>;
  statusSubject = new BehaviorSubject<boolean>(true);
  serverAvailable$ = this._serverAvailableSubject.asObservable().pipe(distinctUntilChanged());

  constructor(@Inject(APP_CONFIG_TOKEN) private appConfig: IAppConfig) {
    super();

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

  public startPingingServer() {
    const callBack = () => {
      const obs$ = timer(0, this.appConfig.ping?.interval || 3000).pipe(
        switchMap(() => this._pingRunning.pipe(
          switchMap(isRunning => isRunning ? this.ping() : EMPTY),
          tap(() => {
            this._serverAvailableSubject.next(true);
          }),
          catchError(error => {
            this._serverAvailableSubject.next(false);
            return of(error); // Continue the interval even after an error
          })
        )),
        shareReplay({ bufferSize: 1, refCount: true }),
        takeUntil(this.ngDestroy)
      );

      obs$.subscribe({
        next: (value) => console.log('Server pinged done. Result was: ', value),
        error: e => console.log('There was an error when pinging server', e),
      });
    };
    
    return callBack();
  }

  pausePinging() {
    if (this._isPingRunning) {
      this._isPingRunning = false;
      this._pingRunning.next(false);
      console.log('Pinging paused.');
    }
  }

  resumePinging() {
    if (!this._isPingRunning) {
      this._isPingRunning = true;
      this._pingRunning.next(true);
      console.log('Pinging resumed.');
    }
  }
}