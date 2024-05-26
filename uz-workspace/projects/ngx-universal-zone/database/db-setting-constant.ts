import { ITableOptions } from "./schema.service";

export class DbSettingConstant {
    public static readonly SETTING = 'setting';
}

export const DbSettingConfig = {
    schema: <ITableOptions>{
      name: DbSettingConstant.SETTING,
      columns: [
        {
          name: 'key',
          isPrimaryKey: true,
          type: 'TEXT',
        },
        {
          name: 'value',
          type: 'TEXT',
        },
      ],
    }
};