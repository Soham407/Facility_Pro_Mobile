import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../db/schema';
import { AttendanceLogModel } from '../db/models/AttendanceLog';
import { ChecklistResponseModel } from '../db/models/ChecklistResponse';
import { VisitorModel } from '../db/models/Visitor';
import { PanicAlertModel } from '../db/models/PanicAlert';
import { GpsPointModel } from '../db/models/GpsPoint';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'facilitypro_offline',
  jsi: true,
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    AttendanceLogModel,
    ChecklistResponseModel,
    VisitorModel,
    PanicAlertModel,
    GpsPointModel,
  ],
});
