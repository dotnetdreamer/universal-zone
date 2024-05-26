import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { AppSettingService } from "./shared/app-setting.service";
import { DbModule } from "./database";
import { HelperService } from "./shared/helper.service";

@NgModule({
    declarations: [],
    imports: [CommonModule, DbModule],
    providers: [
        AppSettingService
        , HelperService
    ],
    exports: [],
  })
  export class UniversalZoneModule {}