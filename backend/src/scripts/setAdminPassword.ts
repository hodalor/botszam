/**
 * One-off: set the admin user's password in the connected database.
 *
 *   NEW_ADMIN_PASSWORD='your-strong-password' npm run set-admin-password
 *   NEW_ADMIN_PASSWORD='...' npm run set-admin-password:prod
 */
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { UserModel } from '../models';

const schema = z.object({
  NEW_ADMIN_PASSWORD: z.string().min(10, 'NEW_ADMIN_PASSWORD must be at least 10 characters'),
  ADMIN_EMAIL: z.email().optional(),
});

async function main() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const email = (parsed.data.ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? 'admin@botszam.com').toLowerCase();
  await connectDatabase();

  const passwordHash = await bcrypt.hash(parsed.data.NEW_ADMIN_PASSWORD, 12);
  const result = await UserModel.updateOne({ role: 'admin', email }, { $set: { passwordHash } });

  if (result.matchedCount === 0) {
    console.error(`No admin user found with email ${email}. Seed first.`);
    process.exit(1);
  }

  console.log(`Updated password for admin ${email}`);
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
