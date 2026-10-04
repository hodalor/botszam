# PROJECT_SPEC.md

> This is the single source of truth for this project. Every future task must follow it.

## Project

**botszam** — premium e-commerce store selling towels imported from Botswana, serving customers in Zambia.

## Structure

- `/frontend` — React + Vite + TypeScript + Tailwind
- `/backend` — Node.js + Express + TypeScript + MongoDB Atlas via Mongoose

## Currency

- Zambian Kwacha, displayed as `K 250.00`.
- Store all money as **integers in ngwee** (K1 = 100 ngwee) to avoid float errors.

## Phone Numbers

- Zambian numbers, normalised to `+260XXXXXXXXX`.
- Accept `09X` / `07X` / `+2609X` / `+2607X` formats.

## Customers

- Guest checkout allowed.
- Optional accounts (email/phone + password) to save addresses and view order history.
- Guest orders are tracked by **order number + phone**.

## Payment Methods

1. **Mobile Money (manual for now)**: after placing the order, the customer sees our MTN / Airtel / Zamtel numbers and account name (from admin settings), pays the exact total, then submits the transaction reference and the number they paid from. Admin verifies and marks the order paid.
2. **Pay on Delivery**: cash or mobile money on delivery.

Payments are designed behind a `PaymentProvider` interface (`backend/src/payments/`) with a `manual` implementation, so an API provider can be added later without touching order logic.

## Order Statuses

- **Mobile Money:** `awaiting_payment` → `payment_submitted` → `paid` → `processing` → `out_for_delivery` → `delivered`
- **Pay on Delivery:** `pending_confirmation` → `confirmed` → `processing` → `out_for_delivery` → `delivered`
- **Also:** `cancelled`, `payment_rejected`
- A rejected payment can be resubmitted (`payment_rejected` → `payment_submitted`); stock released on rejection is re-reserved at that point, and the resubmission fails if it has sold out.
- Customers can cancel online only while `awaiting_payment` or `pending_confirmation`.

Order numbers are human-friendly: `[PREFIX]-YYMMDD-XXXX` (e.g. `TWL-261004-4821`).

## Inventory

- Products have variants (size + colour), each with its own SKU, price, and stock count.
- Stock is decremented when an order is placed and restored if the order is cancelled or the payment rejected.
- Every stock change writes an `InventoryLog` entry (reason, quantity change, user, order ref).
- Low-stock threshold per variant.

## Delivery

Delivery zones with fees, managed by admin (e.g. "Lusaka Central", "Lusaka Outskirts", "Outside Lusaka - courier").

## Security Rules

- The server **ALWAYS** recalculates prices, delivery fees and totals from the database; never trust totals sent by the client.
- Validate all input with **zod**.
- Use **helmet**, **CORS** restricted to the frontend URL, and **rate limiting** on auth and order endpoints.
- Passwords are hashed with **bcrypt**.
- Admin routes require a **JWT with `role=admin`**.

## Design Direction

- Premium, calm, tactile, like a boutique home-linen brand.
- Warm neutral palette:
  - Background (off-white/linen): `#F7F3EE`
  - Text (deep charcoal): `#1F1D1B`
  - Muted sand: `#E6DCCF`
  - Accent terracotta (CTAs): `#B5603E`
- Typography: serif display font (Fraunces or Cormorant Garamond) for headings; clean sans (Inter or DM Sans) for body.
- Generous whitespace, large product imagery, subtle motion (Framer Motion), `rounded-md` corners, no harsh shadows.
- **Mobile-first**: most customers will be on phones.
