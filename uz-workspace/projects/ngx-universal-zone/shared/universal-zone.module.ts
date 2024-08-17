import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { AppSettingService } from "./app-setting.service";
import { DbModule } from "../database";
import { HelperService } from "./helper.service";

@NgModule({
    imports: [CommonModule, DbModule],
  })
  export class UniversalZoneModule {
    static forRoot() {
      return {
        ngModule: UniversalZoneModule,
        providers: [ AppSettingService, HelperService ]
      }
    }
  }