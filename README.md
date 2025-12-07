## Introduction
This project contains common set of helpers needed for Capacitor (and later maybe NativeScript) apps.

## Development server

Run `cd uz-workspace && npm start` for a dev build in watch mode.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Installation

### Locally
After running `npm run build`, go to **dist/ngx-universal-zone** directory and copy the path. Now go to your app and install it just like any other npm package:

```bash
npm i C:\Git\universal-zone\uz-workspace\dist\ngx-universal-zone
npm i C:\Git\universal-zone\uz-workspace\dist\ngx-ionic-zone
```

## Usage

### Configuration Files

#### tsconfig.json
Make sure in your root `tsconfig.json` file, target, module and lib is set to `es2022`. Add the following path mappings to **compilerOptions**:

```json
"paths": {
  "ngx-universal-zone":  ["./node_modules/ngx-universal-zone/*"],
  "ngx-universal-zone/*":  ["./node_modules/ngx-universal-zone/*"],
  "ngx-universal-zone/database/*":  ["./node_modules/ngx-universal-zone/database/*"],
  "ngx-universal-zone/analytics/*":  ["./node_modules/ngx-universal-zone/analytics/*"],
  "ngx-universal-zone/pipes/*":  ["./node_modules/ngx-universal-zone/pipes/*"],
  "ngx-universal-zone/ui/*":  ["./node_modules/ngx-universal-zone/ui/*"],
  "ngx-ionic-zone":  ["./node_modules/ngx-ionic-zone"],
  "ngx-ionic-zone/*":  ["./node_modules/ngx-ionic-zone/*"],
  "ngx-ionic-zone/network/*":  ["./node_modules/ngx-ionic-zone/network/*"],
  "ngx-ionic-zone/database/*":  ["./node_modules/ngx-ionic-zone/database/*"],
  "rxjs": ["node_modules/rxjs"],
  "rxjs/*": ["node_modules/rxjs/*"]
}
```

#### angular.json
Add `"preserveSymlinks": true` to the build options:

```json
"architect": {
  "build": {
    "builder": "@angular-devkit/build-angular:application",
    "options": {
      "preserveSymlinks": true,
      "outputPath": "dist/web",
      "index": "src/index.html",
      "browser": "src/main.ts",
      "polyfills": ["zone.js"]
    }
  }
}
```

### Database Configuration

Create a file e.g `db-constant.ts` with the following:

```typescript
import { DbServiceConfig, DbSettingConfig, DbSettingConstant, ITableOptions } from "ngx-universal-zone/database";

export class DbConstant {
    public static readonly SETTING = DbSettingConstant.SETTING;
    public static readonly CUSTOMER = 'customer';
}

export const dbConfig: DbServiceConfig = {
    dbName: 'choisy',
    schema: <ITableOptions[]>[
      { ...DbSettingConfig.schema },  // Required to create 'setting' table
      {
        name: DbConstant.CUSTOMER,
        columns: [
          {
            name: 'email',
            isPrimaryKey: true,
            type: 'TEXT',
          },
          {
            name: 'name',
            type: 'TEXT',
          }
        ],
      },
    ],
};
```

### Bootstrap Configuration (Standalone)

In your `main.ts`, configure the application using standalone providers:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { APP_INITIALIZER, importProvidersFrom, Injector } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';

import { AppInjector, provideUniversalZone, FlagBasedPreloadingStrategy } from 'ngx-universal-zone';
import { provideDb, SchemaService } from 'ngx-universal-zone/database';
import { NgxPubSubModule } from 'ngx-universal-zone/pub-sub';
import { APP_CONFIG_TOKEN, provideUniversalZoneIonic } from 'ngx-ionic-zone';
import { provideDbSqlite } from 'ngx-ionic-zone/database';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { AppConfig } from './app/modules/universal/app-constant';
import { dbConfig } from './app/modules/universal/db-constant';

export function provideDependentModules() {
  return importProvidersFrom([
    NgxPubSubModule,
  ]);
}

async function main() {
  const platform = await Capacitor.getPlatform();
  const dbProvider = platform === 'web' ? provideDb() : provideDbSqlite();

  bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideIonicAngular({
        useSetInputAPI: true,
      }),
      provideRouter(routes, withPreloading(FlagBasedPreloadingStrategy)),
      provideHttpClient(),
      {
        provide: APP_INITIALIZER,
        useFactory: (injector: Injector, schemaSvc: SchemaService) => {
          AppInjector.setInjector(injector);
          return async () => {
            schemaSvc.init(dbConfig);
          };
        },
        multi: true,
        deps: [Injector, SchemaService]
      },
      { provide: APP_CONFIG_TOKEN, useValue: AppConfig },
      dbProvider,
      provideDependentModules(),
      provideUniversalZone(),
      provideUniversalZoneIonic(),
    ],
  });
}

main();
```

### Listening to Database Initialization

Once configured, listen to the database initialization event:

```typescript
this.dbSvc.dbInitialized$.subscribe(async () => {
  // Your app should start from here
});
```