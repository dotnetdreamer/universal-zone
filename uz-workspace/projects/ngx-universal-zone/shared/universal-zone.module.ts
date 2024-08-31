import { CommonModule } from "@angular/common";
import { ModuleWithProviders, NgModule } from "@angular/core";

import { AppSettingService } from "./app-setting.service";
import { HelperService } from "./helper.service";
@NgModule({
    imports: [CommonModule],
})
export class UniversalZoneModule {
  static forRoot(config?: UniversalZoneModuleConfig): ModuleWithProviders<UniversalZoneModule> {
    return {
      ngModule: UniversalZoneModule,
      providers: [ AppSettingService, HelperService ]
    }
  }
}
export interface UniversalZoneModuleConfig {
}





