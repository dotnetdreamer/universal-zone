import { Injectable } from '@angular/core';

import Dexie, { IndexableType } from 'dexie';
import { forkJoin, Observable, of, Subject, switchMap } from 'rxjs';

import { SchemaService } from './schema.service';
import { DbService, DbServiceConfig } from './db-base.service';

// @Injectable()
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

      let table = this.Db.table(store);
      let collection = table.toCollection();

      if(opt?.sortBy) {
        collection = table.orderBy(opt.sortBy);
      }

      if(opt?.sortType && opt?.sortType == 'desc') {
        collection = table.reverse();
      }

      // collection = this.Db.table(store).toCollection();
      if (opt && opt.key && opt.value) {
        if(!opt.keyRange) {
          opt.keyRange = KeyRangeType.equalTo;
        }

        switch (opt.keyRange) {
          case KeyRangeType.startsWithIgnoreCase:
            collection = this.Db
              .table(store)
              .where(opt.key)
              .startsWithIgnoreCase(opt.value);
            break;
            case KeyRangeType.equalTo:
              collection = this.Db
                .table(store)
                .where(opt.key)
                .equals(opt.value);
              break;
            case KeyRangeType.notEqualTo:
              collection = this.Db
                .table(store)
                .where(opt.key)
                .notEqual(opt.value);
              break;
            case KeyRangeType.equalToIgnoreCase:
              collection = this.Db
                .table(store)
                .where(opt.key)
                .equalsIgnoreCase(opt.value);
              break;
        }
      }

      if(opt?.pageIndex != null) {
        collection = collection.offset((opt.pageIndex - 1) * opt.pageSize);
      }

      if(opt?.pageSize != null) {
        collection = collection.limit(opt.pageSize)
      }

      // let data!: T;
      // if(opt?.sortBy) {
      //   data = <T>await collection.sortBy(opt.sortBy);
      // } else {
      //   data = <T>await collection.toArray();
      // }

      // if(opt.sortType == 'desc') {
      //   data = <T>(<any[]>data).reverse();
      // }

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

  removeAllRx(store: string) {
    return this.getAllRx<any[]>(store).pipe(
      switchMap((entries) => {
        const observables: Array<Observable<any>> = [];
        for(let entry of entries) {
          observables.push(this.removeRx(store, entry.id));
        }
    
        if(!observables.length) {
          return of(null);
        }

        return forkJoin(observables);
      })
    );
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
  sortBy?: any;
  sortType?: 'asc' | 'desc';
}

export enum KeyRangeType {
  equalToIgnoreCase = 1,
  startsWithIgnoreCase = 2,
  equalTo = 3,
  notEqualTo = 4
}
