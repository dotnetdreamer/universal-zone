import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

// import { CapacitorHttp } from '@capacitor/core';

import { Observable } from 'rxjs';
import { APP_CONFIG_TOKEN, IAppConfig } from './app-config';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  private config: IAppConfig;

  protected http: HttpClient;
  
  constructor() {
    this.http = inject(HttpClient);
    this.config = inject(APP_CONFIG_TOKEN);
  }

  protected getDataRx<T>(args: HttpParams) {
    if (!args.overrideUrl) {
      args.url = `${this.config.baseApiUrl + args.url}`;
    }
      args.body = args.body || {};

      for (let prop in args.body) {
        if (args.body.hasOwnProperty(prop) && args.body[prop]) {
          if (args.url.includes('?')) {
            args.url += '&';
          } else {
            args.url += '?';
          }
          args.url += `${prop}=${args.body[prop]}`;
        }
      }

      // return new Observable<T>((observer) => {
      //   CapacitorHttp.get({
      //     url: args.url,
      //     headers: args.headers
      //   }).then(response => {
      //     observer.next(<T>response.data);
      //     observer.complete();
      //   }).catch(error => {
      //     observer.error(error);
      //   });
      // });
      return this.http.get<T>(args.url, { headers: args.headers });
  }

  protected postDataRx<T>(args: HttpParams){
    let newUrl;
    if (!args.overrideUrl) {
      newUrl = `${this.config.baseApiUrl + args.url}`;
    } else {
      newUrl = args.url;
    }

    args.url = newUrl;

    let body = args.body;
    return this.http.post<T>(args.url, body, { headers: args.headers });
  }

  protected async handleError(e: HttpErrorResponse, args: HttpParams) {
    switch (e.status) {
      // case 401:
      //     const u = await this.userSettingSvc.getCurrentUser();
      //     if(u) {
      //         //TODO: check for token expiration...
      //         //kickout...
      //         this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDOUT, { clearCache: true, displayLoginDialog: true });
      //     }
      // break;
      default:
        if (!args.errorCallback) {
          let msg;
          //the error might be thrown by e.g a plugin wasn't install properly. In that case text() will not be available
          if (e.message) {
            msg = e.message;
          } else {
            msg = e.error.toString();
          }
          // setTimeout(async () => {
          //     await this.helperSvc.alert(msg);
          // });
        } else {
          args.errorCallback(e, args);
        }
        break;
    }
  }
}

export interface HttpParams {
  url: any;
  body?: any;
  errorCallback?;
  ignoreContentType?: boolean;
  overrideUrl?: boolean;
  headers?: { [key: string]: string };
}

export interface ApiResponse<T> {
  statusCode: number;
  message: any;
  data: T;
  exception: any;
}
