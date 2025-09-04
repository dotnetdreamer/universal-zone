import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';
import { SchemaService, DbService, DbServiceConfig, DbFilter } from 'ngx-universal-zone/database';

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
@Injectable()
export class DbSqliteService implements DbService {
  private _dbName: string;
  private _db: SQLiteDBConnection;
  private _isDbInitialized = false;
  private dbInitialized = new Subject<any>();

  constructor(
    private config: DbServiceConfig, private schemaSvc: SchemaService
  ) {
    this._dbName = config.dbName;

    this.open();
    this.initializeDb();
  }
  
  async deleteDatabase(): Promise<void> {
    try {
      await CapacitorSQLite.deleteDatabase({ database: this._dbName });
    } catch (error) {
      throw error;
    }
  }

  async open() {
    try {
      const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
      const ret = await sqlite.checkConnectionsConsistency();
      const isConnConsistent = ret.result;
      if (isConnConsistent) {
        this._db = await sqlite.retrieveConnection(this._dbName, false);
      } else {
        this._db = await sqlite.createConnection(
          this._dbName,
          false,
          'no-encryption',
          1,
          false
        );
      }

      await this._db.open();
      // await this._prepareTables();
      // this.dbInitialized.next(this._db);
      this._isDbInitialized = true;
    } catch (error) {
      this._dbError(error);
    }
  }

  initializeDb() {
    const delay = 50;
    //workaround: don't proceed unless db is initialized...wait everytime 50ms
    const _self = this;
    let timerId: any = setTimeout(async function request() {
      if (!_self._isDbInitialized) {
        //retry
        timerId = setTimeout(request, delay);
      } else {
        //clear timeout
        clearTimeout(timerId);
        timerId = null;

        await _self._prepareTables.call(_self);

        // heavy database operations should start from this...
        _self.dbInitialized.next(_self._db);
      }
    }, delay);
  }

  getAllRx<T>(store: string, opt?: DbFilter): Observable<T> {
    return new Observable((observer) => {
      this.getAll<T>(store, opt).then((result) => {
        observer.next(result);
        observer.complete();
      }, (error) => {
        observer.error(error);
      });
    });
  }

  dbInitialized$ = this.dbInitialized.asObservable();
  get Db() {
    return this._db;
  }

  async putLocal(store, data: any): Promise<{ rowsAffected; insertId }> {
    let sql = ``;
    const values: any[] = [];

    // Get primary key field from schema
    const table: any = this.schemaSvc.schema.stores.filter(
      (s) => s.name === store
    )[0];
    const pk = table.columns.filter((c) => c.isPrimaryKey)[0];
    const pkName = pk.name;
    const pkValue = data[pkName];

    // Check if record exists by primary key
    let recordExists = false;
    if (pkValue !== undefined && pkValue !== null) {
      recordExists = await this._recordExists(store, pkName, pkValue);
    }

    if (recordExists) {
      //update
      sql = `UPDATE ${store} SET `;
      //columns
      for (let prop in data) {
        if (data.hasOwnProperty(prop)) {
          const processedValue = this._processValueForStorage(data[prop]);
          sql += `${prop}=?,`;
          values.push(processedValue);
        }
      }
      //remove extra ',' at the end
      sql = sql.substr(0, sql.length - 1);
      sql += ` WHERE ${pkName} = ?`;
      values.push(pkValue);
    } else {
      //insert
      sql = `INSERT INTO ${store} `;
      //columns
      sql += `(`;
      for (let prop in data) {
        if (data.hasOwnProperty(prop)) {
          sql += `${prop},`;
        }
      }
      //remove extra ',' at the end
      sql = sql.substr(0, sql.length - 1);
      sql += `)`;

      //values
      sql += ` VALUES (`;
      for (let prop in data) {
        sql += `?,`;
        const processedValue = this._processValueForStorage(data[prop]);
        values.push(processedValue);
      }
      sql = sql.substr(0, sql.length - 1);
      sql += `)`;
    }

    console.log('putLocal executing: ', sql, values);
    const result = await this._db.run(sql, values);
    console.log('putLocal result: ', result);

    return {
      rowsAffected: result.changes.changes,
      insertId: result.changes.lastId,
    };
    // this._db.transaction(async (tx) => {
    //     const res = await this._executeSql<{ rowsAffected, insertId }>(tx, sql, values);
    //     resolve(res);
    // }, (error) => reject(error));
  }

  putLocalRx(store, data) {
    return new Observable((observer) => {
      this.putLocal(store, data).then((result) => {
        observer.next(result);
        observer.complete();
      });
    });
  }

  async get<T>(store: string, key: any): Promise<T> {
      //get primary key field form schema
      const table: any = this.schemaSvc.schema.stores.filter(
        (s) => s.name === store
      )[0];
      const pk = table.columns.filter((c) => c.isPrimaryKey)[0];
      const pkName = pk.name;

      let sql = `SELECT * FROM ${store} WHERE ${pkName} = '${key}' LIMIT 1`;
      const { values } = await this._db.query(sql);
      
      const result = values[0];
      if (result) {
        return this._processRetrievedData(result) as T;
      }
      return result as T;
  }

  getRx<T>(store: string, key: any): Observable<T> {
    return new Observable((observer) => {
      this.get<T>(store, key).then((result) => {
        observer.next(result);
        observer.complete();
      }, (e) => {
        observer.error(e);
      });
    });
  }

  getAll<T>(store: string, opt?: DbFilter): Promise<T> {
    return new Promise(async (resolve, reject) => {
      let sql = `SELECT * FROM ${store}`;

      try {
        const { values } = await this._db.query(sql);
        const processedValues = values.map(item => this._processRetrievedData(item));
        resolve(processedValues as any);
      } catch (e) {
        reject(e);
      }
    });
  }

  remove(store, key): Promise<any> {
    return new Promise((resolve, reject) => {
      throw 'remove not impleted in db-sql yet';
    });
  }

  removeRx(store, key): Observable<any> {
    throw 'remove not impleted in db-sql yet';
  }

  removeAll(store) {
    return new Promise((resolve, reject) => {
      throw 'removeAll not impleted in db-sql yet';
    });
  }

  removeAllRx(store: string): Observable<any> {
    throw 'removeAllRx not impleted in db-sql yet';
  }

  count(store, opts?: { key }): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let sql = `SELECT count(*) AS total FROM ${store} `;

      try {
        const { values } = await this._db.query(sql);
        resolve(values[0].total);
      } catch (e) {
        reject(e);
      }    });
  }

  countRx(store, opts?: { key }) {
    return new Observable<number>((observer) => {
      this.count(store, opts).then((result) => {
        observer.next(result);
        observer.complete();
      }, (error) => observer.error(error));
    });
  }

  async deleteDb() {
  }

  
  deleteTable(store): Observable<void> {
    throw 'deleteTable not impleted in db-sql yet';
  }

  private async _prepareTables() {
      const schemas = this.schemaSvc.schema.stores;

      const promises: any[] = [];
      for (let schema of schemas) {
        // let sql = `BEGIN TRANSACTION;`;
        let sql = '';

        sql += `CREATE TABLE IF NOT EXISTS ${schema.name} `;
        sql += `(`;

        for (let col of schema.columns) {
          // Check if primary key and is INTEGER type for auto increment
          const isPrimaryKey = col['isPrimaryKey'];
          const isIntegerType = col['type'] && col['type'].toUpperCase() === 'INTEGER';
          
          sql += `${col.name}`;
          
          // Add type
          if (col.type) {
            sql += ` ${col.type}`;
          }
          
          // Add PRIMARY KEY with AUTOINCREMENT for INTEGER primary keys
          if (isPrimaryKey) {
            if (isIntegerType) {
              sql += ` PRIMARY KEY AUTOINCREMENT`;
            } else {
              sql += ` PRIMARY KEY`;
            }
          }
          
          sql += `,`;
        }

        //remove extra ',' at the end
        sql = sql.substr(0, sql.length - 1);
        sql += `)`;

        // sql += `COMMIT TRANSACTION;`;

        const promise = this._db.execute(sql);
        promises.push(promise);        
      }
      await Promise.all(promises);
  }

  /**
   * Check if a record exists by primary key
   */
  private async _recordExists(store: string, pkName: string, pkValue: any): Promise<boolean> {
    try {
      const sql = `SELECT 1 FROM ${store} WHERE ${pkName} = ? LIMIT 1`;
      const { values } = await this._db.query(sql, [pkValue]);
      return values && values.length > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Process value for storage - stringify arrays and objects
   */
  private _processValueForStorage(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    if (Array.isArray(value) || (typeof value === 'object' && value.constructor === Object)) {
      return JSON.stringify(value);
    }
    
    return value;
  }

  /**
   * Process retrieved data - parse stringified arrays and objects back to their original form
   */
  private _processRetrievedData(data: any): any {
    if (!data) {
      return data;
    }

    const processedData = { ...data };
    
    for (const key in processedData) {
      if (processedData.hasOwnProperty(key)) {
        const value = processedData[key];
        
        // Try to parse if it's a string that looks like JSON
        if (typeof value === 'string') {
          try {
            // Check if it starts and ends with array or object brackets
            if ((value.startsWith('[') && value.endsWith(']')) || 
                (value.startsWith('{') && value.endsWith('}'))) {
              processedData[key] = JSON.parse(value);
            }
          } catch (e) {
            // If parsing fails, keep the original string value
            // This ensures we don't break regular string data
          }
        }
      }
    }
    
    return processedData;
  }

  private _dbError(err) {
    alert('Open database ERROR: ' + JSON.stringify(err));
  }
}