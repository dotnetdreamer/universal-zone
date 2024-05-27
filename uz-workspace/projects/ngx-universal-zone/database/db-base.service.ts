// @ts-ignore

import { Observable } from "rxjs";

import { ITableOptions } from "./schema.service";

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

  putAllLocal(store: string, opts: any): Promise<any> {
    // @ts-ignore
    return;
  }

  get<T>(store: string, key: any): Promise<T> {
    // @ts-ignore
    return;
  }
  getAll<T>(store: string): Promise<T> {
    // @ts-ignore
    return;
  }

  remove(store, id): Promise<any> {
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

  deleteDb(): Promise<any> {
    // @ts-ignore
    return;
  }
}
