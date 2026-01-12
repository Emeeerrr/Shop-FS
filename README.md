# Shop-FS (Product Checkout SPA + API)

Single Page App that sells seeded products and charges with credit card using Sandbox environment.
Flow: Product page → Credit card & delivery modal → Summary → Final status → Product page (stock updated).

> Note: Repository name and wording avoid vendor branding requirements.

---

## Tech Stack

**Frontend**
- React + TypeScript
- MUI
- Axios

**Backend**
- NestJS + TypeScript
- Prisma + PostgreSQL
- Swagger

---

## Architecture & Data Model

### Entities
- **Product** (has one Stock, has many Transactions)
- **Stock** (unitsAvailable)
- **Customer** (unique email)
- **Delivery** (belongs to Customer)
- **Transaction** (reference, status: PENDING/APPROVED/DECLINED/ERROR)

See `prisma/schema.prisma`.

---

## API Docs (Swagger)

Run backend and open:

- `http://localhost:3000/docs`

---

## Postman

Collection and environment are included:

- `postman/ShopAPI.postman_collection.json`
- `postman/local.postman_environment.json`

Endpoints:
- `GET /products`
- `GET /wompi/acceptance-tokens`
- `POST /payments`

---

## Local Setup

pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev

## backend vars example:
DATABASE_URL=postgresql://...
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PRIVATE_KEY=prv_stagtest_...
WOMPI_PUBLIC_KEY=pub_stagtest_...
WOMPI_INTEGRITY_SECRET=stagtest_integrity_...

## frontent vars example:
VITE_API_URL=http://localhost:3000
VITE_WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_...
