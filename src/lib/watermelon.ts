import { Database } from '@nozbe/watermelondb';
import { schema } from '../db/schema';
import { AttendanceLogModel } from '../db/models/AttendanceLog';
import { ChecklistResponseModel } from '../db/models/ChecklistResponse';
import { VisitorModel } from '../db/models/Visitor';
import { PanicAlertModel } from '../db/models/PanicAlert';
import { GpsPointModel } from '../db/models/GpsPoint';

let _database: Database | null = null;
let _initFailed = false;

function initDatabase(): Database | null {
  if (_database) return _database;
  if (_initFailed) return null;

  try {
    // Dynamic require to avoid crash if native module is missing
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;

    const adapter = new SQLiteAdapter({
      schema,
      dbName: 'facilitypro_offline',
      jsi: true,
      onSetUpError: (error: any) => {
        console.error('WatermelonDB setup error:', error);
      },
    });

    _database = new Database({
      adapter,
      modelClasses: [
        AttendanceLogModel,
        ChecklistResponseModel,
        VisitorModel,
        PanicAlertModel,
        GpsPointModel,
      ],
    });

    return _database;
  } catch (error) {
    _initFailed = true;
    console.warn(
      '[WatermelonDB] Native module not available. Offline features are disabled. ' +
      'Rebuild your dev client with `npx expo run:android` to enable WatermelonDB.',
      error
    );
    return null;
  }
}

/**
 * Get the WatermelonDB database instance.
 * Returns null if the native module is not available (e.g. in a dev client
 * that hasn't been rebuilt with WatermelonDB native code).
 */
export function getDatabase(): Database | null {
  return initDatabase();
}

/**
 * @deprecated Use getDatabase() which safely returns null if unavailable.
 * This export is kept for backward compatibility but will throw if native module is missing.
 */
export const database = new Proxy({} as Database, {
  get(_target, prop) {
    const db = initDatabase();
    if (!db) {
      if (prop === 'write' || prop === 'collections') {
        console.warn(`[WatermelonDB] Attempted to access db.${String(prop)} but native module is not available.`);
        // Return safe no-ops
        if (prop === 'write') return async () => {};
        if (prop === 'collections') return {
          get: () => ({
            create: async () => null,
            query: () => ({ fetch: async () => [] }),
          }),
        };
      }
      return undefined;
    }
    return (db as any)[prop];
  },
});
