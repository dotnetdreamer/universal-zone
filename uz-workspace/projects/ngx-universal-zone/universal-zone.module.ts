import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { AppSettingService } from "./app-setting.service";
import { DbModule } from "./database";

@NgModule({
    declarations: [],
    imports: [CommonModule, DbModule],
    providers: [
        AppSettingService
    ],
    exports: [],
  })
  export class UniversalZoneModule {}