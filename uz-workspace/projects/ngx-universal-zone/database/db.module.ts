import { EnvironmentProviders, makeEnvironmentProviders, Provider, inject, Optional, Type } from '@angular/core';

import { SchemaService } from './schema.service';
import { DbWebService } from './db-web.service';
import { DbService, DbServiceType } from './db-base.service';

// Accept an optional custom DbService provider (e.g., for SQLite)
export function dbFactory(schemaSvc: SchemaService, customDbService?: Type<DbService>) {
  const dbConfig = schemaSvc.config;

  if (customDbService) {
    // If a custom DbService is provided (e.g., SQLite), instantiate it
    return inject(customDbService, { optional: false });
  }

  switch (dbConfig.dbType) {
    case DbServiceType.IndexDd:
      return new DbWebService(dbConfig, schemaSvc);
    // Remove Sqlite case from here
    default:
      throw new Error('Unsupported dbType or missing customDbService');
  }
}

/**
 * Optionally accepts a custom DbService class (e.g., from ngx-ionic-zone).
 */
export function provideDb(customDbService?: Type<DbService>): EnvironmentProviders {
  const providers: Provider[] = [
    SchemaService,
    {
      provide: DbService,
      useFactory: (schemaSvc: SchemaService) => dbFactory(schemaSvc, customDbService),
      deps: [SchemaService],
    }
  ];

  return makeEnvironmentProviders(providers);
}