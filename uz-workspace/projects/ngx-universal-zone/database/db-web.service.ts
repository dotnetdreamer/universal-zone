import { Injectable, Optional } from '@angular/core';

import Dexie, { Collection, IndexableType, Table } from 'dexie';
import { Observable, Subject, catchError, first, lastValueFrom, map, of, retry, timer } from 'rxjs';

import { SchemaService } from './schema.service';
import { DbService, DbServiceConfig } from './db-base.service';

@Injectable()
export class DbWebService extends Dexie implements DbService {
  private _db!: Dexie;
  private dbInitialized = new Subject<any>();

  constructor(
    private config: DbServiceConfig,
    private schemaService: SchemaService
  ) {
    super(config.dbName);

    const schema: {
      [tableName: string]: string | null;
    } = {};
    schemaService.schema.stores.forEach((s) => {
      let cols = ``;
      for (let c of s.columns) {
        cols += `${c.isPrimaryKey ? `++${c.name}` : `,${c.name}`}`;
      }
      schema[s.name] = cols;
    });
    this.version(1).stores(schema);
    this.open()
      .then((d) => {
        this._db = d;

        this.dbInitialized.next(d);
      })
      .catch((e) => alert(e));
  }
  
  dbInitialized$ = this.dbInitialized.asObservable();

  get Db() {
    return this._db;
  }

  putLocal(store, data): Promise<{ rowsAffected; insertId }> {
    return new Promise(async (resolve, reject) => {
      const schema = this.schemaService.schema.stores.filter(
        (s) => s.name == store
      )[0];
      const key = schema.columns.filter((s) => s.isPrimaryKey)[0];

      const exist = data[key.name] ? await this.get(store, data[key.name]) : null;
      if (exist) {
        //update
        this.Db
          .table(store)
          .update(data[key.name], data)
          .then(
            (r) => resolve(null as any),
            (e) => reject(e)
          );
      } else {
        this.Db
          .table(store)
          .add(data)
          .then(
            (r) => resolve(null as any),
            (e) => reject(e)
          );
      }
    });
  }

  putLocalRx(store, data) {
    return new Observable((observer) => {
      this.putLocal(store, data).then((result) => {
        observer.next(result);
        observer.complete();
      }, (e) => observer.error(e));
    });
  }

  get<T>(store: string, key: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if(!this.Db) {
        return reject('Database not initialized. Please wait for dbInitialized$ to emit.');
      }
      
        this.Db
        .table(store)
        .get(key)
        .then((r) => {
          resolve(<T>r);
        }, (e) => reject(e));
    });
  }

  getRx<T>(store: string, key: any) {
    return new Observable<T>((observer) => {
      this.get<T>(store, key).then((value) => {
        observer.next(value);
        observer.complete();
      });
    });
  }

  getByFieldName<T>(storeName, fieldName, key): Promise<Array<T>> {
    const filter = {};
    filter[fieldName] = key;
    return this.Db.table(storeName).where(filter).toArray();
  }

  getAll<T>(store: string, opt?: DbFilter): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if(!this.Db) {
        return reject('Database not initialized. Please wait for dbInitialized$ to emit.');
      }

      let collection = this.Db.table(store).toCollection();
      if (opt && opt.key && opt.value) {
        if (opt.keyRange) {
          switch (opt.keyRange) {
            case KeyRangeType.equalto:
              collection = this.Db
                .table(store)
                .where(opt.key)
                .equalsIgnoreCase(opt.value);
              break;
            case KeyRangeType.startsWith:
              collection = this.Db
                .table(store)
                .where(opt.key)
                .startsWithIgnoreCase(opt.value);
              break;
          }
        }
      }

      if(opt?.pageIndex != null) {
        collection = collection.offset((opt.pageIndex - 1) * opt.pageSize);
      }

      if(opt?.pageSize != null) {
        collection = collection.limit(opt.pageSize)
      }

      const data = <T>await collection.toArray();
      resolve(data);
    });
  }

  getAllRx<T>(store: string, opt?: DbFilter) {
    return new Observable<T>((observer) => {
      this.getAll<T>(store, opt).then((value) => {
        observer.next(value);
        observer.complete();
      }, (e) => observer.error(e));
    });
  }

  remove(store, key): Promise<any> {
    return this.Db.table(store).delete(key);
  }

  removeRx(store, key): Observable<any> {
    return new Observable((observer) => {
      this.remove(store, key).then((result) => {
        observer.next(result);
        observer.complete();
      }, (e) => observer.error(e));
    });
  }

  async removeAll(store) {
    const all = await this.getAll<any[]>(store);
    const schema = this.schemaService.schema.stores.filter(
      (s) => s.name == store
    )[0];
    const key = schema.columns.filter((s) => s.isPrimaryKey)[0];

    const promises: any = [];
    for (let r of all) {
      promises.push(this.Db.table(store).delete(key.name));
    }

    await Promise.all(promises);
  }

  count(store, opts?: { key }): Promise<number> {
    if (opts && opts.key) {
      const pk = this.schemaService.schema.stores
        .filter((s) => s.name == store)[0]
        .columns.filter((s) => s.isPrimaryKey)[0];
      return this.Db.table(store).where(pk.name).equals(opts.key).count();
    }

    return this.Db.table(store).count();
  }

  countRx(store, opts?: { key }) {
    return new Observable<number>((observer) => {
      this.count(store, opts).then((value) => {
        observer.next(value);
        observer.complete();
      }, (e) => observer.error(e));
    });
  }

  deleteDb() {
    return new Promise(async (resolve, reject) => {
      await this.Db.delete();
      resolve(null);
    });
  }

  deleteTable(store) {
    return new Observable<void>((observer) => {
      this.Db.table(store).clear().then((result) => {
        observer.next(result);
        observer.complete();
      }, (e) => observer.error(e));
    });
  }
}

export interface DbFilter {
  key?: any;
  value?: any;
  keyRange?: KeyRangeType;
  pageIndex?: number;
  pageSize?: number;
}

export enum KeyRangeType {
  equalto = 1,
  startsWith = 2,
}
