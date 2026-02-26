# WatermelonDB Restore Guide

> This guide documents how to re-add WatermelonDB offline support to FacilityPro Mobile.
> WatermelonDB was temporarily removed to allow UI/UX testing via Expo Go.

---

## Why It Was Removed

WatermelonDB requires native SQLite modules that are **not available in Expo Go**. The app crashed on launch with:

```
TypeError: Cannot read property 'prototype' of undefined
```

This happens because WatermelonDB's native module (`@nozbe/watermelondb/adapters/sqlite`)
is not bundled in Expo Go. A **custom dev client** (built via EAS Build) is required.

---

## Files That Were Modified

### Removed Files (Still in `src/` but NOT imported - safe dead code)

These files still exist in the codebase but are no longer imported by any active code:

| File                                 | Purpose                                |
| ------------------------------------ | -------------------------------------- |
| `src/lib/watermelon.ts`              | Database initialization & proxy export |
| `src/lib/sync.ts`                    | Offline → Supabase sync logic          |
| `src/db/schema.ts`                   | WatermelonDB table schema definition   |
| `src/db/models/AttendanceLog.ts`     | Attendance log model                   |
| `src/db/models/ChecklistResponse.ts` | Checklist response model               |
| `src/db/models/GpsPoint.ts`          | GPS tracking point model               |
| `src/db/models/PanicAlert.ts`        | Panic/SOS alert model                  |
| `src/db/models/Visitor.ts`           | Visitor entry model                    |

### Modified Files (WatermelonDB code stripped)

| File                                    | What was removed                                                     |
| --------------------------------------- | -------------------------------------------------------------------- |
| `src/screens/guard/HomeScreen.tsx`      | `database.write()` blocks for check-in/out, `syncOfflineData()` call |
| `src/screens/guard/SOSScreen.tsx`       | `database.write()` blocks for panic alert create/cancel              |
| `src/screens/guard/VisitorScreen.tsx`   | `database.write()` blocks for visitor log/exit                       |
| `src/screens/guard/ChecklistScreen.tsx` | `database.write()` blocks for checklist response save                |
| `src/tasks/gpsTask.ts`                  | Local DB write for GPS points (now Supabase-only)                    |

### Config Files Changed

| File                | What was removed                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`      | `@nozbe/watermelondb`, `@lovesworking/watermelondb-expo-plugin-sdk-52-plus`, Babel decorator plugins                                                                            |
| `app.json`          | `@lovesworking/watermelondb-expo-plugin-sdk-52-plus` from plugins                                                                                                               |
| `babel.config.js`   | `@babel/plugin-proposal-decorators`, `@babel/plugin-proposal-class-properties`, `@babel/plugin-transform-private-methods`, `@babel/plugin-transform-private-property-in-object` |
| `declarations.d.ts` | All `@nozbe/watermelondb` and `@nozbe/with-observables` type declarations                                                                                                       |
| `tsconfig.json`     | `experimentalDecorators: true`                                                                                                                                                  |

---

## Step-by-Step Restore Instructions

### Step 1: Install WatermelonDB packages

```bash
npm install @nozbe/watermelondb@^0.28.0 @lovesworking/watermelondb-expo-plugin-sdk-52-plus@^1.0.3
```

### Step 2: Install Babel decorator plugins

```bash
npm install -D @babel/plugin-proposal-decorators@^7.29.0 @babel/plugin-proposal-class-properties@^7.18.6 @babel/plugin-transform-private-methods@^7.28.6 @babel/plugin-transform-private-property-in-object@^7.28.6 @babel/plugin-transform-class-properties@^7.28.6
```

### Step 3: Update `babel.config.js`

Add decorator plugins **before** `react-native-reanimated/plugin`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/plugin-proposal-class-properties", { loose: true }],
      ["@babel/plugin-transform-private-methods", { loose: true }],
      ["@babel/plugin-transform-private-property-in-object", { loose: true }],
      "react-native-reanimated/plugin",
    ],
  };
};
```

### Step 4: Update `tsconfig.json`

Add `experimentalDecorators` to compilerOptions:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "experimentalDecorators": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts", "declarations.d.ts"]
}
```

### Step 5: Update `app.json`

Add WatermelonDB Expo plugin to the plugins array:

```json
"plugins": [
  "expo-camera",
  ["expo-location", { ... }],
  "@react-native-firebase/app",
  "@react-native-firebase/messaging",
  "expo-local-authentication",
  "expo-notifications",
  "@lovesworking/watermelondb-expo-plugin-sdk-52-plus",   // <-- ADD THIS
  ["expo-build-properties", { ... }]
]
```

### Step 6: Restore `declarations.d.ts`

Add WatermelonDB type declarations back to the top of `declarations.d.ts`:

```typescript
// WatermelonDB type declarations
declare module "@nozbe/watermelondb" {
  export class Database {
    constructor(options: { adapter: any; modelClasses: any[] });
    collections: { get<T>(tableName: string): Collection<T> };
    write<T>(work: () => Promise<T>): Promise<T>;
  }

  export class Collection<T> {
    create(updater: (record: T) => void): Promise<T>;
    query(...args: any[]): { fetch(): Promise<T[]> };
  }

  export const Q: any;

  export class Model {
    static table: string;
    id: string;
    update(updater: (record: this) => void): Promise<this>;
    destroyPermanently(): Promise<void>;
  }

  export class Query<T> {}
  export class Relation<T> {}
}

declare module "@nozbe/watermelondb/adapters/sqlite" {
  export default class SQLiteAdapter {
    constructor(options: {
      schema: any;
      dbName: string;
      jsi?: boolean;
      onSetUpError?: (error: any) => void;
    });
  }
}

declare module "@nozbe/watermelondb/decorators" {
  export function field(columnName: string): PropertyDecorator;
  export function date(columnName: string): PropertyDecorator;
  export function readonly(target: any, key: string): void;
  export function text(columnName: string): PropertyDecorator;
  export function relation(
    tableName: string,
    columnName: string,
  ): PropertyDecorator;
  export function children(tableName: string): PropertyDecorator;
  export function json(
    columnName: string,
    sanitizer: (raw: any) => any,
  ): PropertyDecorator;
  export function lazy(target: any, key: string): void;
  export function action(
    target: any,
    key: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor;
  export function writer(
    target: any,
    key: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor;
  export function reader(
    target: any,
    key: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor;
}

declare module "@nozbe/watermelondb" {
  export function appSchema(schema: { version: number; tables: any[] }): any;

  export function tableSchema(schema: {
    name: string;
    columns: Array<{
      name: string;
      type: "string" | "number" | "boolean";
      isOptional?: boolean;
      isIndexed?: boolean;
    }>;
  }): any;
}

declare module "@nozbe/with-observables" {
  export default function withObservables(
    triggerProps: string[],
    getObservables: (props: any) => { [key: string]: any },
  ): (component: any) => any;
}
```

### Step 7: Re-add WatermelonDB imports to screen files

For each of these files, add back the WatermelonDB imports and `database.write()` blocks.

Reference the existing dead-code files for the exact model structure:

- `src/lib/watermelon.ts` — import `{ database }` from here
- `src/lib/sync.ts` — import `{ syncOfflineData }` from here

**HomeScreen.tsx** — Add back:

```typescript
import { database } from "../../lib/watermelon";
import { AttendanceLogModel } from "../../db/models/AttendanceLog";
import { syncOfflineData } from "../../lib/sync";
```

**SOSScreen.tsx** — Add back:

```typescript
import { database } from "../../lib/watermelon";
import { PanicAlertModel } from "../../db/models/PanicAlert";
```

**VisitorScreen.tsx** — Add back:

```typescript
import { database } from "../../lib/watermelon";
import { VisitorModel } from "../../db/models/Visitor";
```

**ChecklistScreen.tsx** — Add back:

```typescript
import { database } from "../../lib/watermelon";
import { ChecklistResponseModel } from "../../db/models/ChecklistResponse";
```

**gpsTask.ts** — Add back:

```typescript
import { database } from "../lib/watermelon";
import { GpsPointModel } from "../db/models/GpsPoint";
```

> **Tip:** Check the git history for these files to see the exact `database.write()` blocks
> that were removed. Use `git diff` or `git log --follow -p <filename>` to restore them.

### Step 8: Build a Custom Dev Client

WatermelonDB **will NOT work in Expo Go**. You must build a custom dev client:

```bash
# Install EAS CLI if not installed
npm install -g eas-cli

# Build development client
eas build --profile development --platform android

# OR locally (requires Android SDK)
npx expo run:android
```

### Step 9: Start with Dev Client

```bash
npx expo start --dev-client
```

---

## Important Notes

1. **Never use Expo Go with WatermelonDB** — it will always crash
2. The `src/db/` and `src/lib/watermelon.ts` / `src/lib/sync.ts` files are preserved as dead code
3. The old `database` export in `watermelon.ts` uses a safe Proxy pattern that gracefully handles missing native modules
4. All WatermelonDB schema and models are intact and ready to use
5. Commit this restore before running `npm install` so you can easily revert if needed

---

## Quick Verification

After restoring, verify:

- [ ] `npm install` completes without errors
- [ ] `npx expo prebuild --clean` generates native projects
- [ ] `eas build --profile development --platform android` succeeds
- [ ] App launches without `TypeError: Cannot read property 'prototype' of undefined`
- [ ] Offline data saves to local SQLite via WatermelonDB
- [ ] `syncOfflineData()` pushes local records to Supabase when online
