// @ts-ignore

import { Observable } from "rxjs";

import { ITableOptions } from "./schema.service";
import { DbFilter } from "./db-web.service";

export class DbServiceConfig {
  dbType!: DbServiceType;
  dbName!: string;
  schema!: ITableOptions[];
}

export enum DbServiceType {
  IndexDd,
  Sqlite
}

export abstract class DbService {
  dbInitialized$ = new Observable<any>();

  get Db(): any {
    return;
  }

  putLocal(store, data): Promise<{ rowsAffected; insertId }> {
    // @ts-ignore

    return;
  }

  putLocalRx(store, data): Observable<any> {
    // @ts-ignore
    return;
  }

  get<T>(store: string, key: any): Promise<T> {
    // @ts-ignore
    return;
  }
  getRx<T>(store: string, key: any): Observable<T> { 
    // @ts-ignore
    return; 
  }

  getAll<T>(store: string, opt?: DbFilter): Promise<T> {
    // @ts-ignore
    return;
  }

  getAllRx<T>(store: string, opt?: DbFilter): Observable<T> {
    // @ts-ignore
    return;
  }

  remove(store, id): Promise<any> {
    // @ts-ignore
    return;
  }

  removeRx(store, key): Observable<any> {
    // @ts-ignore
    return;
  }

  removeAll(store): Promise<any> {
    // @ts-ignore
    return;
  }

  count(store, opts?: { key }): Promise<number> {
    // @ts-ignore
    return;
  }

  countRx(store, opts?: { key }): Observable<number> {
    // @ts-ignore
    return;
  }

  deleteDb(): Promise<any> {
    // @ts-ignore
    return;
  }

  deleteTable(store): Observable<void> {
    // @ts-ignore
    return;
  }
}
