import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SchemaService } from './schema.service';
import { DbWebService } from './db-web.service';
import { DbService, DbServiceType } from './db-base.service';
import { DbSqliteService } from './db-sql.service';

export function dbFactory(schemaSvc: SchemaService) {
  const dbConfig = schemaSvc.config;

  switch (dbConfig.dbType) {
    case DbServiceType.IndexDd:
      return new DbWebService(dbConfig, schemaSvc);
    case DbServiceType.Sqlite:
      return new DbSqliteService(dbConfig, schemaSvc);
  }
}
@NgModule({
  imports: [CommonModule],
})
export class DbModule { 
  static forRoot(): ModuleWithProviders<DbModule> {
    return {
      ngModule: DbModule,
      providers: [ 
        SchemaService,
        {
          provide: DbService,
          useFactory: dbFactory,
          deps: [SchemaService],
        }
       ]
    }
  }
}
