import { InjectionToken } from "@angular/core";

export const APP_CONFIG_TOKEN = new InjectionToken<IAppConfig>('APP_CONFIG');

export interface IAppConfig {
    baseUrl: string;
    baseApiUrl: string;
    ping?: IAppConfigPing;
    http?: IAppConfigHttp;
}

export interface IAppConfigPing {
    url?: string;
    interval: number;
}

export interface IAppConfigHttp {
    useNativeHttp: boolean;
}