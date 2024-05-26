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
Add `UniversalZoneModule` and `DbModule` in your root `AppModule` imports. Provide your own implementation of schema.

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
    UniversalZoneModule,
    DbModule
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