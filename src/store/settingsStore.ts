import { create } from 'zustand';

import { loadSettings as dbLoadSettings, saveSettings as dbSaveSettings } from '@/db/settings';
import { DEFAULT_SETTINGS } from '@/domain/constants';
import type { AppSettings } from '@/domain/types';

interface SettingsState {
    settings: AppSettings;
    loaded: boolean;
    loadSettings: () => Promise<void>;
    updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: DEFAULT_SETTINGS,
    loaded: false,

    loadSettings: async () => {
        const settings = await dbLoadSettings();
        set({ settings, loaded: true });
    },

    updateSettings: async (patch) => {
        const next = { ...get().settings, ...patch };
        set({ settings: next });
        await dbSaveSettings(next);
    },
}));
