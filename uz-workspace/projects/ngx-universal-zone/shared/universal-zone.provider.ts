import { EnvironmentProviders, makeEnvironmentProviders, Provider } from "@angular/core";

import { AppSettingService } from "./app-setting.service";
import { HelperService } from "./helper.service";

export const provideUniversalZone = (): EnvironmentProviders => {
  const providers: Provider[] = [
    AppSettingService, HelperService
  ];

  return makeEnvironmentProviders(providers);
};





