import { Injectable } from "@angular/core";
import { BehaviorSubject, catchError, distinctUntilChanged, Observable, of, shareReplay, Subject, switchMap, takeUntil, tap, timer } from "rxjs";
import { Network } from "@capacitor/network";
import { BaseService } from "./base.service";

@Injectable({
  providedIn: "root",
})
export class NetworkService extends BaseService {
  private _serverAvailableSubject = new BehaviorSubject<boolean>(true);
  private ngDestroy = new Subject<void>();
  private _interval = 3000;
  
  connected$: Observable<boolean>;
  statusSubject = new BehaviorSubject<boolean>(true);
  serverAvailable$ = this._serverAvailableSubject.asObservable().pipe(distinctUntilChanged());

  constructor() {
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
      url: `ping`
    });
  }

  public stopPingingServer() {
    this.ngDestroy.next();
    this.ngDestroy.complete();
  }

  public startPingingServer() {
    const callBack = () => {
      const obs$ = timer(0, this._interval).pipe(
        switchMap(() => this.ping().pipe(
          tap(() => {
            this._serverAvailableSubject.next(true);
          }),
          // tap(() => console.log('Successfully retrieved.')),
          catchError(error => {
            // console.log('Could not retrieve the supported functions. More info: ', error);
            this._serverAvailableSubject.next(false);
            return of(error); // Continue the interval even after an error
          })
        )),
        // retryWhen(errors =>
        //   errors.pipe(
        //     tap(() => console.log('retrying')),
        //     delayWhen(() => timer(this.interval / 2))
        //   )
        // ),
        shareReplay({ bufferSize: 1, refCount: true }),
        takeUntil(this.ngDestroy)
      );

      obs$.subscribe({
        next: (value) => console.log('Server pinged done. Result was: ', value),
        error: e => console.log('There was an error when pinging server', e),
      });
    };
    /**
     * important: Currently if there is a delay in the retrieval of the supported functions then
     * Angular change detection will wait untill 10 seconds to be able to detect the changes.
     * So we for now we are skipping that during regression tests. We need to see if this is a problem
     * also in the production environment, then we can remove the if statement and always run the callback
    */
    // if(environment.regressionTests) {
    //   this.ngZone.run(callBack);
    // } else {
      // this.ngZone.runOutsideAngular(callBack);
      return callBack();
    // }


    // ATTENTION: returning this observable does not mean that subscriving to it will mean retrieving all the
    // emitted values, only one (the current one) will be returned.
    // Better would be to emit every value through
    // this observable. However, since there are plans to stop retrieving the supported functions every secs
    // this change might never come into place.
    // return supportedFunctions$;
  }
}