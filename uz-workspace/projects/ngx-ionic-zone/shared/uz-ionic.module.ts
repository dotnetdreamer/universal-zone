import { EnvironmentProviders, makeEnvironmentProviders, Provider } from "@angular/core";

export const provideUniversalZoneIonic = (): EnvironmentProviders => {
  const providers: Provider[] = [
  ];

  return makeEnvironmentProviders(providers);
};
