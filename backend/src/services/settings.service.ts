import { SETTINGS_KEY, SettingsModel, type SettingsDocument } from '../models/Settings';

/** Returns the singleton settings document, creating it with defaults if missing. */
export async function getSettings(): Promise<SettingsDocument> {
  return SettingsModel.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).orFail();
}
