// All persistence goes through this interface. Today it is on-device storage only (works offline, NFR2).
// When the database phase starts, add a FirestoreRepository with the same shape and swap the export.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData } from '../data/types';

export interface Repository {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  clear(): Promise<void>;
}

const KEY = 'fitflow:data:v1';

const localRepository: Repository = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AppData) : null;
    } catch {
      return null;
    }
  },
  async save(data) {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable: keep running in memory */
    }
  },
  async clear() {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};

export const repository: Repository = localRepository;
