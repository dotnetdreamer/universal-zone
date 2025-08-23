import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';

import { SchemaService } from './schema.service';
import { DbWebService } from './db-web.service';
import { DbService } from './db-base.service';

export function dbFactory(schemaSvc: SchemaService) {
  const dbConfig = schemaSvc.config;
  return new DbWebService(dbConfig, schemaSvc);
}

export function provideDb(): EnvironmentProviders {
  const providers: Provider[] = [
    SchemaService,
    {
      provide: DbService,
      useFactory: (schemaSvc: SchemaService) => dbFactory(schemaSvc),
      deps: [SchemaService],
    }
  ];

  return makeEnvironmentProviders(providers);
}