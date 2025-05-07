import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { SchemaService } from 'ngx-universal-zone/database';
import { DbService } from 'ngx-universal-zone/database';
import { DbSqliteService } from './db-sql.service';

export function dbSqliteFactory(schemaSvc: SchemaService) {
  const dbConfig = schemaSvc.config;
  return new DbSqliteService(dbConfig, schemaSvc);
}

export const provideDbSqlite = (): EnvironmentProviders => {
  const providers: Provider[] = [
    SchemaService,
    {
      provide: DbService,
      useFactory: dbSqliteFactory,
      deps: [SchemaService],
    }
  ];

  return makeEnvironmentProviders(providers);
};
