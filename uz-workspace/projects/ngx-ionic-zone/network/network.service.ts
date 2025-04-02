import { Inject, Injectable } from "@angular/core";

import { BehaviorSubject, distinctUntilChanged, Observable, Subject } from "rxjs";
import { Network } from "@capacitor/network";

import { APP_CONFIG_TOKEN, BaseHttpService, IAppConfig } from "ngx-ionic-zone";

@Injectable({
  providedIn: 'root'
})
export class NetworkService extends BaseHttpService {
  private ngDestroy = new Subject<void>();
  
  connected$: Observable<boolean>;
  statusSubject = new BehaviorSubject<boolean>(true);

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
}