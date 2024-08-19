## Intorduction
This project contains common set of helpers needed for capacitor(for now, later maybe NativeScript) apps

## Development server

Run `npm start` for a dev build in watch mode

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Installation

### Locally
After running `npm run build` go to **dist/ngx-universal-zone** directory and copy the path. Now go to your app and install it just like any other npm package e.g `npm i C:\Git\universal-zone\uz-workspace\dist\ngx-universal-zone`

## Usage
Make sure in your root `tsconfig.json` file, target, module and lib is set to `es2022`. Next create a file e.g `db-constant.ts` with following class

```
import { DbServiceConfig, DbServiceType, DbSettingConfig, DbSettingConstant } from "ngx-universal-zone/database";
import { ITableOptions } from "ngx-universal-zone/database";

export class DbConstant {
    public static readonly SETTING = DbSettingConstant.SETTING;
    public static readonly CUSTOMER = 'customer';
}

export const dbConfig: DbServiceConfig = {
    dbType: DbServiceType.IndexDd,
    dbName: 'choisy',
    schema: <ITableOptions[]>[
      { ...DbSettingConfig.schema },  //must needed in order to crate 'setting' table
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
}
```

Now add `UniversalZoneModule` and `DbModule` in your root `AppModule` imports. Provide your own implementation of schema.

```
function initializeDb(schemaSvc: SchemaService) {
  return async () => {
    const platform = await Capacitor.getPlatform();
    dbConfig.dbType = platform === 'web' ? DbServiceType.IndexDd : DbServiceType.Sqlite;

    return schemaSvc.init(dbConfig);
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    UniversalZoneModule.forRoot(),
    DbModule.forRoot()
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDb,
      multi: true,
      deps: [SchemaService]
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(injector: Injector) {
    AppInjector.setInjector(injector);
  }
}

```

If you are testing the library locall then also go to your app root tsconfig.json file and add the following to **compilerOptions**:

```
"paths": {
  "ngx-universal-zone/*":  ["./node_modules/ngx-universal-zone/*"],
}
```

and in `angular.json` add `"preserveSymlinks": true` as shown below:

```
"architect": {
  "build": {
    "builder": "@angular-devkit/build-angular:application",
    "options": {
      "outputPath": "dist/web",
      "index": "src/index.html",
      "browser": "src/main.ts",
      **"preserveSymlinks": true**, //This might not be needed. Only add if needed
      "polyfills": [
        "zone.js"
      ],

```

Now listen to dbinit and the rest do your magic!

```
this.dbSvc.dbInitialized$.subscribe(async () => {
  //Your app should start from here
});

```