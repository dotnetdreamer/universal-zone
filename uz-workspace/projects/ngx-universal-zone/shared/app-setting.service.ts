import { Injectable } from '@angular/core';

import { DbService, SchemaService, DbSettingConstant } from '../database';
import { Observable } from 'rxjs';

@Injectable()
export class AppSettingService {
  protected static settingCache = new Map();

  constructor(private _dbService: DbService, private _schemaSvc: SchemaService) {
  }

  protected get<T>(key: string): Promise<T> {
    if (AppSettingService.settingCache.has(key)) {
      return new Promise((resolve, reject) => {
        let settingCacheMap = AppSettingService.settingCache.get(key);
        resolve(settingCacheMap);
      });
    } else {
      return this._dbService
        .get<any>(this._schemaSvc.tables[DbSettingConstant.SETTING], key)
        .then((setting) => {
          if (setting && setting.value) {
            AppSettingService.settingCache.set(key, setting.value);
            return setting.value;
          }
          return null;
        });
    }
  }

  protected getRx<T>(key: string) {
    return new Observable<T>((obs) => {
      this.get<T>(key).then((setting) => {
        obs.next(setting);
        obs.complete(); 
      }, (error) => obs.error(error));
    });
  }

  protected put(key: string, values) {
    return this._dbService
      .putLocal(this._schemaSvc.tables[DbSettingConstant.SETTING], {
        key: key,
        value: values,
      })
      .then(() => {
        AppSettingService.settingCache.set(key, values);
      });
  }

  protected putRx(key: string, values) {
    return new Observable<void>((obs) => {
      this.put(key, values).then(() => {
        obs.next();
        obs.complete(); 
      }, (error) => obs.error(error));
    });
  }

  protected remove(key: string) {
    return this._dbService
      .remove(this._schemaSvc.tables[DbSettingConstant.SETTING], key)
      .then(() => {
        AppSettingService.settingCache.delete(key);
      });
  }

  protected removeRx(key: string) {
    return new Observable<void>((obs) => {
      this.remove(key).then(() => {
        obs.next();
        obs.complete(); 
      }, (error) => obs.error(error));
    });
  }

  protected removeCache(key: string) {
    AppSettingService.settingCache.delete(key);
  }
}
