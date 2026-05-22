import { Injectable } from "@angular/core";

import { BehaviorSubject, distinctUntilChanged, Observable } from "rxjs";
import { Network } from "@capacitor/network";

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  connected$: Observable<boolean>;
  statusSubject = new BehaviorSubject<boolean>(true);

  constructor() {

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