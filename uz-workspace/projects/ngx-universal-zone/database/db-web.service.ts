import { Injectable, Optional } from '@angular/core';

import Dexie, { Collection, IndexableType, Table } from 'dexie';
import { Subject } from 'rxjs';

import { SchemaService } from './schema.service';
import { DbService, DbServiceConfig } from './db-base.service';

@Injectable()
export class DbWebService extends Dexie implements DbService {
  private db!: Dexie;
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
        this.db = d;

        this.dbInitialized.next(d);
      })
      .catch((e) => alert(e));
  }
  
  dbInitialized$ = this.dbInitialized.asObservable();

  get Db() {
    return this.db;
  }

  putLocal(store, data): Promise<{ rowsAffected; insertId }> {
    return new Promise(async (resolve, reject) => {
      const schema = this.schemaService.schema.stores.filter(
        (s) => s.name == store
      )[0];
      const key = schema.columns.filter((s) => s.isPrimaryKey)[0];

      const exist = await this.get(store, data[key.name]);
      if (exist) {
        //update
        this.db
          .table(store)
          .update(data[key.name], data)
          .then(
            (r) => resolve(null as any),
            (e) => reject(e)
          );
      } else {
        this.db
          .table(store)
          .add(data)
          .then(
            (r) => resolve(null as any),
            (e) => reject(e)
          );
      }
    });
  }

  putAllLocal(store: string, opts: any): Promise<any> {
    return this.db.table(store).bulkAdd(opts);
  }

  get<T>(store: string, key: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db
        .table(store)
        .get(key)
        .then((r) => {
          resolve(<T>r);
        });
    });
  }

  getByFieldName<T>(storeName, fieldName, key): Promise<Array<T>> {
    const filter = {};
    filter[fieldName] = key;
    return this.db.table(storeName).where(filter).toArray();
  }

  getAll<T>(store: string, opt?: DbFilter): Promise<T> {
    return new Promise(async (resolve, reject) => {
      let collection = this.db.table(store).toCollection();
      if (opt && opt.key && opt.value) {
        if (opt.keyRange) {
          switch (opt.keyRange) {
            case KeyRangeType.equalto:
              collection = this.db
                .table(store)
                .where(opt.key)
                .equalsIgnoreCase(opt.value);
              break;
            case KeyRangeType.startsWith:
              collection = this.db
                .table(store)
                .where(opt.key)
                .startsWithIgnoreCase(opt.value);
              break;
          }
        }

        const data = <any>await collection.toArray();
        resolve(<T>data);
      } else {
        this.db.table(store).toCollection;
      }
    });
  }

  remove(store, key): Promise<any> {
    return this.db.table(store).delete(key);
  }

  async removeAll(store) {
    const all = await this.getAll<any[]>(store);
    const schema = this.schemaService.schema.stores.filter(
      (s) => s.name == store
    )[0];
    const key = schema.columns.filter((s) => s.isPrimaryKey)[0];

    const promises: any = [];
    for (let r of all) {
      promises.push(this.db.table(store).delete(key.name));
    }

    await Promise.all(promises);
  }

  count(store, opts?: { key }): Promise<number> {
    if (opts && opts.key) {
      const pk = this.schemaService.schema.stores
        .filter((s) => s.name == store)[0]
        .columns.filter((s) => s.isPrimaryKey)[0];
      return this.db.table(store).where(pk.name).equals(opts.key).count();
    }

    return this.db.table(store).count();
  }

  deleteDb() {
    return new Promise(async (resolve, reject) => {
      await this.db.delete();
      resolve(null);
    });
  }
}

export interface DbFilter {
  key?: any;
  value: any;
  keyRange?: KeyRangeType;
}

export enum KeyRangeType {
  equalto = 1,
  startsWith = 2,
}
