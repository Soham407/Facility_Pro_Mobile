// WatermelonDB type declarations
declare module '@nozbe/watermelondb' {
  export class Database {
    constructor(options: { adapter: any; modelClasses: any[] });
    collections: { get<T>(tableName: string): Collection<T>; };
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

declare module '@nozbe/watermelondb/adapters/sqlite' {
  export default class SQLiteAdapter {
    constructor(options: {
      schema: any;
      dbName: string;
      jsi?: boolean;
      onSetUpError?: (error: any) => void;
    });
  }
}

declare module '@nozbe/watermelondb/decorators' {
  export function field(columnName: string): PropertyDecorator;
  export function date(columnName: string): PropertyDecorator;
  export function readonly(target: any, key: string): void;
  export function text(columnName: string): PropertyDecorator;
  export function relation(tableName: string, columnName: string): PropertyDecorator;
  export function children(tableName: string): PropertyDecorator;
  export function json(columnName: string, sanitizer: (raw: any) => any): PropertyDecorator;
  export function lazy(target: any, key: string): void;
  export function action(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor;
  export function writer(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor;
  export function reader(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor;
}

declare module '@nozbe/watermelondb' {
  export function appSchema(schema: {
    version: number;
    tables: any[];
  }): any;

  export function tableSchema(schema: {
    name: string;
    columns: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean';
      isOptional?: boolean;
      isIndexed?: boolean;
    }>;
  }): any;
}

declare module '@nozbe/with-observables' {
  export default function withObservables(
    triggerProps: string[],
    getObservables: (props: any) => { [key: string]: any }
  ): (component: any) => any;
}

// Expo vector icons
declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  export const Ionicons: ComponentType<IconProps> & { glyphMap: Record<string, number> };
  export const MaterialIcons: ComponentType<IconProps>;
  export const FontAwesome: ComponentType<IconProps>;
  export const Feather: ComponentType<IconProps>;
}

// React Native MMKV
declare module 'react-native-mmkv' {
  export class MMKV {
    constructor(options?: { id?: string; encryptionKey?: string });
    getString(key: string): string | undefined;
    set(key: string, value: string | number | boolean): void;
    delete(key: string): void;
    clearAll(): void;
    getAllKeys(): string[];
    contains(key: string): boolean;
  }
}
