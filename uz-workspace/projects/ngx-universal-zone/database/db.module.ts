import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SchemaService } from './schema.service';
import { DbWebService } from './db-web.service';
import { DbService, DbServiceConfig, DbServiceType } from './db-base.service';
import { DbSqliteService } from './db-sql.service';

export function DbFactory(schemaSvc: SchemaService) {
  const dbConfig = schemaSvc.config;
  
  switch (dbConfig.dbType) {
    case DbServiceType.IndexDd:
      return new DbWebService(dbConfig, schemaSvc);
    break;
    case DbServiceType.Sqlite:
      return new DbSqliteService(dbConfig, schemaSvc);
    break;
  }
}

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    SchemaService, 
    {
      provide: DbService,
      useFactory: DbFactory,
      deps: [SchemaService],
    }],
  exports: [],
})
export class DbModule {}
