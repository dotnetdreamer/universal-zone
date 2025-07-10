import { EnvironmentProviders, makeEnvironmentProviders, Provider } from "@angular/core";

import { HapticsService } from "./haptics.service";

export const provideUniversalZoneIonic = (): EnvironmentProviders => {
  const providers: Provider[] = [
    HapticsService
  ];

  return makeEnvironmentProviders(providers);
};
