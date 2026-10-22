import Storage from 'expo-sqlite/kv-store';

import { DEFAULT_SETTINGS } from '@/domain/constants';
import type { AppSettings } from '@/domain/types';

const SETTINGS_KEY = 'settings';

export async function loadSettings(): Promise<AppSettings> {
    try {
        const raw = await Storage.getItem(SETTINGS_KEY);

        if (!raw) {
            return DEFAULT_SETTINGS;
        }

        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await Storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
