import { Injectable } from '@angular/core';
import { DbServiceConfig } from './db-base.service';


export interface ITableOptions {
  name: string;
  columns: Array<{ name; isPrimaryKey?; type? }>;
}

@Injectable()
export class SchemaService {
  schema = {
    stores: <ITableOptions[]>[]
  };
  tables: Record<string, string> = {};

  private _config!: DbServiceConfig

  /**
   * Represents a SchemaService that manages the database schema.
   */
  constructor() {

  }

  get config() {
    return this._config;
  }

  init(config: DbServiceConfig) {
    this._config = config;

    if(config.schema && config.schema.length) {
      this.schema.stores = this.config.schema;
      this.schema.stores.forEach((s) => this.tables[s.name] = s.name);
    }
  }
}