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
