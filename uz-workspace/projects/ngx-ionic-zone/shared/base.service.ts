import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpContext, HttpContextToken } from '@angular/common/http';

// import { CapacitorHttp } from '@capacitor/core';

import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { APP_CONFIG_TOKEN, IAppConfig } from './app-config';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  private config: IAppConfig;
  private _httpInProgressRequest = new BehaviorSubject<HttpParams>(null);

  protected http: HttpClient;

  httpInProgressRequest$ = this._httpInProgressRequest.asObservable();

  constructor() {
    this.http = inject(HttpClient);
    this.config = inject(APP_CONFIG_TOKEN);
  }

  protected getDataRx<T>(args: HttpParams) {
    this._httpInProgressRequest.next(args);

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

      // if(!this.config.http?.useNativeHttp) {
        let headers = new HttpHeaders();
        for (let prop in args.headers) {
          if (args.headers.hasOwnProperty(prop) && args.headers[prop]) {
            headers = headers.set(prop, args.headers[prop]);
          }
        }

        let context = new HttpContext();
        if(args.retryCount != null) {
          context.set(RETRY_COUNT, args.retryCount);
        }
        
        if(args.retryDelay != null) {
          context.set(RETRY_DELAY, args.retryCount);
        }
        
        return this.http.get<T>(args.url, { headers: headers, context: context })
          .pipe(
            tap(() => this._httpInProgressRequest.next(null)),
            catchError((error) => {
              this._httpInProgressRequest.next(null);
    
              //pass error to the caller
              return throwError(() => error);
            }));
      // }
      
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
  }

  protected postDataRx<T>(args: HttpParams) {
    this._httpInProgressRequest.next(args);

    let newUrl;
    if (!args.overrideUrl) {
      newUrl = `${this.config.baseApiUrl + args.url}`;
    } else {
      newUrl = args.url;
    }

    args.url = newUrl;

    let context = new HttpContext();
    if(args.retryCount != null) {
      context.set(RETRY_COUNT, args.retryCount);
    }

    if(args.retryDelay != null) {
      context.set(RETRY_DELAY, args.retryCount);
    }

    let body = args.body;
    return this.http.post<T>(args.url, body, { headers: new HttpHeaders(args.headers), context: context })
      .pipe(
        tap(() => this._httpInProgressRequest.next(null)),
        catchError((error) => {
          this._httpInProgressRequest.next(null);

          //pass error to the caller
          return throwError(() => error);
        })
      );
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
  url: string;
  body?: any;
  errorCallback?;
  ignoreContentType?: boolean;
  overrideUrl?: boolean;
  headers?: { [key: string]: string };
  retryCount?: number;
  retryDelay?: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: any;
  data: T;
  exception: any;
}


export const RETRY_COUNT = new HttpContextToken(() => 3);
export const RETRY_DELAY = new HttpContextToken(() => 5000);