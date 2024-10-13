import { ModuleWithProviders, NgModule } from "@angular/core";

@NgModule({
    imports: [],
    providers: []
})
export class UniversalZoneIonicModule {
  static forRoot(): ModuleWithProviders<UniversalZoneIonicModule> {
    return {
      ngModule: UniversalZoneIonicModule
    }
  }
}




