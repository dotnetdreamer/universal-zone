import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';
import { SchemaService, DbService, DbServiceConfig, DbFilter, KeyRangeType } from 'ngx-universal-zone/database';

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

      let sql = `SELECT * FROM ${store} WHERE ${pkName} = ? LIMIT 1`;
      const { values } = await this._db.query(sql, [key]);
      
      const result = values[0];
      if (result) {
        return this._processRetrievedData(result, store) as T;
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

  async getByFieldName<T>(storeName: string, fieldName: string, key: any): Promise<Array<T>> {
    try {
      const sql = `SELECT * FROM ${storeName} WHERE ${fieldName} = ?`;
      const { values } = await this._db.query(sql, [key]);
      
      const processedValues = values.map(item => this._processRetrievedData(item, storeName));
      return processedValues as Array<T>;
    } catch (error) {
      throw error;
    }
  }

  getAll<T>(store: string, opt?: DbFilter): Promise<T> {
    return new Promise(async (resolve, reject) => {
      let sql = `SELECT * FROM ${store}`;
      const values: any[] = [];

      try {
        // Build WHERE clause based on filter
        const whereClause = this._buildWhereClause(opt, values);
        if (whereClause) {
          sql += ` WHERE ${whereClause}`;
        }

        // Build ORDER BY clause
        const orderByClause = this._buildOrderByClause(opt);
        if (orderByClause) {
          sql += ` ${orderByClause}`;
        }

        // Build LIMIT and OFFSET for pagination
        const limitClause = this._buildLimitClause(opt);
        if (limitClause) {
          sql += ` ${limitClause}`;
        }

        console.log('getAll executing SQL:', sql, 'with values:', values);
        
        const { values: queryResults } = await this._db.query(sql, values);
        const processedValues = queryResults.map(item => this._processRetrievedData(item, store));
        resolve(processedValues as any);
      } catch (e) {
        reject(e);
      }
    });
  }

  async remove(store, key): Promise<any> {
    try {
      // Get primary key field from schema
      const table: any = this.schemaSvc.schema.stores.filter(
        (s) => s.name === store
      )[0];
      const pk = table.columns.filter((c) => c.isPrimaryKey)[0];
      const pkName = pk.name;

      const sql = `DELETE FROM ${store} WHERE ${pkName} = ?`;
      const result = await this._db.run(sql, [key]);
      
      return {
        rowsAffected: result.changes.changes
      };
    } catch (error) {
      throw error;
    }
  }

  removeRx(store, key): Observable<any> {
    return new Observable((observer) => {
      this.remove(store, key).then((result) => {
        observer.next(result);
        observer.complete();
      }, (error) => {
        observer.error(error);
      });
    });
  }

  async removeAll(store): Promise<any> {
    try {
      const sql = `DELETE FROM ${store}`;
      const result = await this._db.run(sql, []);
      
      return {
        rowsAffected: result.changes.changes
      };
    } catch (error) {
      throw error;
    }
  }

  removeAllRx(store: string): Observable<any> {
    return new Observable((observer) => {
      this.removeAll(store).then((result) => {
        observer.next(result);
        observer.complete();
      }, (error) => {
        observer.error(error);
      });
    });
  }

  count(store, opts?: { key }): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let sql = `SELECT count(*) AS total FROM ${store}`;
      const values: any[] = [];

      if (opts && opts.key !== undefined) {
        // Get primary key field from schema
        const table: any = this.schemaSvc.schema.stores.filter(
          (s) => s.name === store
        )[0];
        const pk = table.columns.filter((c) => c.isPrimaryKey)[0];
        const pkName = pk.name;
        
        sql += ` WHERE ${pkName} = ?`;
        values.push(opts.key);
      }

      try {
        const { values: queryResults } = await this._db.query(sql, values);
        resolve(queryResults[0].total);
      } catch (e) {
        reject(e);
      }
    });
  }

  countRx(store, opts?: { key }) {
    return new Observable<number>((observer) => {
      this.count(store, opts).then((result) => {
        observer.next(result);
        observer.complete();
      }, (error) => observer.error(error));
    });
  }

  async deleteDb(): Promise<any> {
    try {
      await this._db.close();
      await this.deleteDatabase();
      return null;
    } catch (error) {
      throw error;
    }
  }

  
  deleteTable(store): Observable<void> {
    return new Observable<void>((observer) => {
      this.removeAll(store).then((result) => {
        observer.next(result);
        observer.complete();
      }, (error) => {
        observer.error(error);
      });
    });
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
          
          // Add type - convert BOOLEAN to INTEGER for SQLite
          if (col.type) {
            const columnType = col.type.toUpperCase() === 'BOOLEAN' ? 'INTEGER' : col.type;
            sql += ` ${columnType}`;
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
   * Build WHERE clause based on DbFilter options
   */
  private _buildWhereClause(opt?: DbFilter, values?: any[]): string | null {
    if (!opt || !opt.key || opt.value === undefined) {
      return null;
    }

    const keyRange = opt.keyRange || KeyRangeType.equalTo;
    
    switch (keyRange) {
      case KeyRangeType.equalTo:
        values?.push(opt.value);
        return `${opt.key} = ?`;
        
      case KeyRangeType.notEqualTo:
        values?.push(opt.value);
        return `${opt.key} != ?`;
        
      case KeyRangeType.equalToIgnoreCase:
        values?.push(opt.value);
        return `LOWER(${opt.key}) = LOWER(?)`;
        
      case KeyRangeType.startsWithIgnoreCase:
        values?.push(`${opt.value}%`);
        return `LOWER(${opt.key}) LIKE LOWER(?)`;
        
      default:
        values?.push(opt.value);
        return `${opt.key} = ?`;
    }
  }

  /**
   * Build ORDER BY clause based on DbFilter options
   */
  private _buildOrderByClause(opt?: DbFilter): string | null {
    if (!opt?.sortBy) {
      return null;
    }

    const sortType = opt.sortType || 'asc';
    return `ORDER BY ${opt.sortBy} ${sortType.toUpperCase()}`;
  }

  /**
   * Build LIMIT and OFFSET clause for pagination
   */
  private _buildLimitClause(opt?: DbFilter): string | null {
    if (!opt?.pageSize) {
      return null;
    }

    let clause = `LIMIT ${opt.pageSize}`;
    
    if (opt.pageIndex && opt.pageIndex > 0) {
      const offset = (opt.pageIndex - 1) * opt.pageSize;
      clause += ` OFFSET ${offset}`;
    }

    return clause;
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
   * Process value for storage - stringify arrays and objects, convert booleans to integers
   */
  private _processValueForStorage(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle boolean values - convert to integers (SQLite standard)
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    
    if (Array.isArray(value) || (typeof value === 'object' && value.constructor === Object)) {
      return JSON.stringify(value);
    }
    
    return value;
  }

  /**
   * Process retrieved data - parse stringified arrays and objects back to their original form
   * Convert integers back to booleans for BOOLEAN type columns
   */
  private _processRetrievedData(data: any, storeName?: string): any {
    if (!data) {
      return data;
    }

    const processedData = { ...data };
    
    // Get schema information for boolean field identification
    let booleanFields: string[] = [];
    if (storeName) {
      const tableSchema = this.schemaSvc.schema.stores.find(s => s.name === storeName);
      if (tableSchema) {
        // Look for fields with BOOLEAN type
        booleanFields = tableSchema.columns
          .filter(col => col.type === 'BOOLEAN')
          .map(col => col.name);
      }
    }
    
    for (const key in processedData) {
      if (processedData.hasOwnProperty(key)) {
        const value = processedData[key];
        
        // Convert integers to booleans for BOOLEAN type fields
        if (booleanFields.includes(key) && (value === 0 || value === 1)) {
          processedData[key] = Boolean(value);
          continue;
        }
        
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