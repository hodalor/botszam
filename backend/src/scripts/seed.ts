import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { env } from '../config/env';
import {
  CategoryModel,
  DeliveryZoneModel,
  InventoryLogModel,
  ProductModel,
  SettingsModel,
  SETTINGS_KEY,
  UserModel,
} from '../models';
import { zambianPhoneSchema } from '../utils/phone';
import { slugify } from '../utils/slug';

const adminEnvSchema = z.object({
  ADMIN_NAME: z.string().min(1).default('Botszam Admin'),
  ADMIN_EMAIL: z.email('ADMIN_EMAIL must be a valid email'),
  ADMIN_PHONE: zambianPhoneSchema.prefault('0970000000'),
  ADMIN_PASSWORD: z.string().min(10, 'ADMIN_PASSWORD must be at least 10 characters'),
});

const CARE =
  'Wash before first use. Machine wash at 40°C with similar colours. Skip fabric softener — it coats the fibres and reduces absorbency. Tumble dry low or line dry in the shade.';

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  image?: string;
}

interface SeedProduct {
  code: string;
  name: string;
  category: string;
  description: string;
  featured: boolean;
  priceKwacha: number;
  size: string;
  colour: string;
  colourHex: string;
  stock: number;
  image: string;
}

const CATEGORIES: SeedCategory[] = [
  {
    name: 'Swimming',
    slug: 'swimming',
    description: 'Beach and pool towels for sun days',
    sortOrder: 1,
    image: 'beach-velour.jpg',
  },
  {
    name: 'Home use',
    slug: 'home-use',
    description: 'Everyday bath towels and sets for the home',
    sortOrder: 2,
    image: 'large-bath-sheet.jpg',
  },
  {
    name: 'Hotel use',
    slug: 'hotel-use',
    description: 'Hospitality-grade sheets and towels',
    sortOrder: 3,
    image: 'hotel-bath-sheet-colour.jpg',
  },
  {
    name: 'Hotel & home use',
    slug: 'hotel-home',
    description: 'Pieces that work in hotels and at home',
    sortOrder: 4,
    image: 'piece-dyed-h.jpg',
  },
  {
    name: 'Saloon use',
    slug: 'saloon-use',
    description: 'Hand towels for salons and spas',
    sortOrder: 5,
    image: 'hand-towel.jpg',
  },
];

const PRODUCTS: SeedProduct[] = [
  {
    code: 'BVL',
    name: 'Beach Velour 90x160cm',
    category: 'swimming',
    description: 'Soft velour beach towel with a bold check pattern. Generous 90×160 cm — ideal for swimming and poolside.',
    featured: true,
    priceKwacha: 350,
    size: '90 x 160 cm',
    colour: 'Red Check',
    colourHex: '#C43B3B',
    stock: 40,
    image: 'beach-velour.jpg',
  },
  {
    code: 'LBS',
    name: 'Large Bath Sheet 90x175cm',
    category: 'home-use',
    description: 'Oversized honeycomb bath sheet for home. Dense weave, deep colour, wraps you completely.',
    featured: true,
    priceKwacha: 350,
    size: '90 x 175 cm',
    colour: 'Navy',
    colourHex: '#1E3A5F',
    stock: 35,
    image: 'large-bath-sheet.jpg',
  },
  {
    code: 'HBS',
    name: 'Hotel Bath Sheet',
    category: 'hotel-use',
    description: 'Classic white ribbed bath sheet for hotel use. Crisp, absorbent and hospitality-ready.',
    featured: false,
    priceKwacha: 320,
    size: 'Bath sheet',
    colour: 'White',
    colourHex: '#F5F2EC',
    stock: 50,
    image: 'hotel-bath-sheet-white.jpg',
  },
  {
    code: 'BTW',
    name: 'Bath Towel',
    category: 'home-use',
    description: 'Everyday ribbed bath towel in a soft sage tone. Perfect weight for daily home use.',
    featured: true,
    priceKwacha: 300,
    size: 'Bath towel',
    colour: 'Sage',
    colourHex: '#A8B5A0',
    stock: 45,
    image: 'bath-towel.jpg',
  },
  {
    code: 'PDH',
    name: 'Piece dyed H',
    category: 'hotel-home',
    description: 'Piece-dyed towel with a smooth border band. Suited to both hotel and home bathrooms.',
    featured: false,
    priceKwacha: 400,
    size: 'Standard',
    colour: 'Sky Grey',
    colourHex: '#8FA4B0',
    stock: 30,
    image: 'piece-dyed-h.jpg',
  },
  {
    code: 'HND',
    name: 'Hand Towel',
    category: 'saloon-use',
    description: 'Stack-ready hand towels for saloon and spa use. Soft terry, rich blue, built for frequent wash cycles.',
    featured: true,
    priceKwacha: 260,
    size: 'Hand towel',
    colour: 'Royal Blue',
    colourHex: '#2F5FA8',
    stock: 80,
    image: 'hand-towel.jpg',
  },
  {
    code: 'HBC',
    name: 'Hotel Bath Sheet Colour',
    category: 'hotel-use',
    description: 'Vibrant hotel bath sheets in bold colourways. Great for guest rooms that need a splash of colour.',
    featured: true,
    priceKwacha: 360,
    size: 'Bath sheet',
    colour: 'Magenta / Yellow',
    colourHex: '#C2185B',
    stock: 40,
    image: 'hotel-bath-sheet-colour.jpg',
  },
  {
    code: 'HMB',
    name: 'Home Bath Sheet',
    category: 'home-use',
    description: 'White home bath sheet with fine decorative stripes. Soft, clean and gift-ready.',
    featured: false,
    priceKwacha: 360,
    size: 'Bath sheet',
    colour: 'White Stripe',
    colourHex: '#F7F3EE',
    stock: 40,
    image: 'home-bath-sheet.jpg',
  },
  {
    code: 'HNH',
    name: 'His and Her',
    category: 'home-use',
    description: 'His & Hers embroidered towel pair, gift-wrapped. A thoughtful set for couples and newlyweds.',
    featured: true,
    priceKwacha: 550,
    size: 'Pair',
    colour: 'White',
    colourHex: '#FFFFFF',
    stock: 20,
    image: 'his-and-her.jpg',
  },
  {
    code: 'S3P',
    name: 'SETS 3PC',
    category: 'home-use',
    description: 'Three-piece towel set in soft blue packaging. Coordinated sizes for a complete bathroom refresh.',
    featured: true,
    priceKwacha: 5100,
    size: '3-piece set',
    colour: 'Light Blue',
    colourHex: '#9EB8D0',
    stock: 12,
    image: 'sets-3pc.jpg',
  },
];

function catalogUrl(filename: string) {
  return `${env.FRONTEND_URL}/catalog/${filename}`;
}

async function ensureCatalogImages() {
  const root = path.resolve(process.cwd(), '../frontend/public/catalog');
  await fs.mkdir(root, { recursive: true });

  const needed = [...new Set([...CATEGORIES.map((c) => c.image), ...PRODUCTS.map((p) => p.image)].filter(Boolean))];
  const missing: string[] = [];
  for (const file of needed) {
    try {
      await fs.access(path.join(root, file!));
    } catch {
      missing.push(file!);
    }
  }

  if (missing.length === 0) {
    console.log(`Catalog images ready (${needed.length} files)`);
  } else {
    console.warn(
      `Missing catalog images (${missing.join(', ')}). Place JPEGs in frontend/public/catalog or upload in admin.`,
    );
  }
}

async function seedAdmin() {
  const parsed = adminEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding');
  }
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } = parsed.data;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await UserModel.findOneAndUpdate(
    { $or: [{ email: ADMIN_EMAIL.toLowerCase() }, { phone: ADMIN_PHONE }] },
    { name: ADMIN_NAME, email: ADMIN_EMAIL, phone: ADMIN_PHONE, passwordHash, role: 'admin' },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).orFail();

  console.log(`Admin user ready: ${admin.email} / ${admin.phone}`);
  return admin;
}

async function seedDeliveryZones() {
  await DeliveryZoneModel.deleteMany({});
  const zones = await DeliveryZoneModel.insertMany([
    { name: 'Lusaka Central', feeNgwee: 5_000, estimatedDays: 'Same or next day', active: true },
    { name: 'Lusaka Outskirts', feeNgwee: 10_000, estimatedDays: '1-2 days', active: true },
    { name: 'Outside Lusaka - courier', feeNgwee: 15_000, estimatedDays: '2-5 days', active: true },
  ]);
  console.log(`Delivery zones: ${zones.length}`);
}

async function seedSettings() {
  await SettingsModel.findOneAndUpdate(
    { key: SETTINGS_KEY },
    {
      key: SETTINGS_KEY,
      storeName: 'botszam',
      contactPhone: '+260970000000',
      whatsappNumber: '+260970000000',
      email: 'hello@botszam.com',
      mobileMoneyAccounts: [
        { network: 'MTN', number: '+260960000000', accountName: 'BOTSZAM LIMITED' },
        { network: 'Airtel', number: '+260970000000', accountName: 'BOTSZAM LIMITED' },
        { network: 'Zamtel', number: '+260950000000', accountName: 'BOTSZAM LIMITED' },
      ],
      paymentInstructions:
        'Send the exact order total to one of the numbers below and use your order number as the reference. Then enter your transaction ID and the number you paid from. We will confirm your payment within a few hours.',
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  console.log('Settings saved (placeholder mobile money numbers - update before launch)');
}

async function seedCategories() {
  await CategoryModel.deleteMany({});
  const docs = CATEGORIES.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    sortOrder: c.sortOrder,
    active: true,
    imageUrl: c.image ? catalogUrl(c.image) : null,
  }));
  await CategoryModel.insertMany(docs);
  console.log(`Categories: ${docs.length}`);
}

async function seedProducts(adminId: unknown) {
  await InventoryLogModel.deleteMany({});
  await ProductModel.deleteMany({});

  const docs = PRODUCTS.map((spec) => ({
    name: spec.name,
    slug: slugify(spec.name),
    description: spec.description,
    careInstructions: CARE,
    category: spec.category,
    featured: spec.featured,
    active: true,
    images: [{ url: catalogUrl(spec.image), publicId: null }],
    variants: [
      {
        sku: `BTZ-${spec.code}-01`,
        size: spec.size,
        colour: spec.colour,
        colourHex: spec.colourHex,
        priceNgwee: Math.round(spec.priceKwacha * 100),
        stock: spec.stock,
        lowStockThreshold: 5,
        active: true,
      },
    ],
  }));

  const products = await ProductModel.insertMany(docs);

  const logs = products.flatMap((product) =>
    product.variants
      .filter((v) => v.stock > 0)
      .map((v) => ({
        product: product._id,
        variantSku: v.sku,
        change: v.stock,
        reason: 'restock' as const,
        user: adminId,
        note: 'Initial stock (seed)',
      })),
  );
  await InventoryLogModel.insertMany(logs);

  console.log(`Products: ${products.length} (real catalogue prices, ${logs.length} inventory logs)`);
}

async function main() {
  if (env.isProduction && !process.argv.includes('--force')) {
    throw new Error('Refusing to seed in production (it deletes products and zones). Pass --force to override.');
  }

  await ensureCatalogImages();
  await connectDatabase();
  await Promise.all([
    UserModel.init(),
    CategoryModel.init(),
    ProductModel.init(),
    DeliveryZoneModel.init(),
    SettingsModel.init(),
  ]);

  const admin = await seedAdmin();
  await seedDeliveryZones();
  await seedSettings();
  await seedCategories();
  await seedProducts(admin._id);

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
