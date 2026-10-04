import type { RequestHandler } from 'express';
import { validated } from '../../middleware/validate';
import { SettingsModel, SETTINGS_KEY } from '../../models/Settings';
import { getSettings } from '../../services/settings.service';
import { settingsSchema } from '../../validators/admin.validators';

export const get: RequestHandler = async (_req, res) => {
  res.json({ settings: await getSettings() });
};

export const put: RequestHandler = async (req, res) => {
  const settings = await SettingsModel.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { ...validated(settingsSchema, req.body), key: SETTINGS_KEY },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.json({ settings });
};
