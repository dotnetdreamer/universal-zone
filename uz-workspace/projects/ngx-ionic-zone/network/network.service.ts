import { Injectable } from "@angular/core";

import { BehaviorSubject, distinctUntilChanged, Observable, Subject } from "rxjs";
import { Network } from "@capacitor/network";

import { BaseHttpService } from "ngx-ionic-zone";

@Injectable({
  providedIn: 'root'
})
export class NetworkService extends BaseHttpService {
  connected$: Observable<boolean>;
  statusSubject = new BehaviorSubject<boolean>(true);

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
}