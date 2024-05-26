import { CommonModule } from "@angular/common";
import { Injector, NgModule } from "@angular/core";

import { AppSettingService } from "./app-setting.service";
import { DbModule } from "../database";
import { HelperService } from "./helper.service";
import { AppInjector } from "./app-injector";

@NgModule({
    declarations: [],
    imports: [CommonModule, DbModule],
    providers: [
        AppSettingService
        , HelperService
    ],
    exports: [],
  })
  export class UniversalZoneModule {
    constructor(injector: Injector) {
        AppInjector.setInjector(injector);
    }
  }