# E-Commerce Backend API

NestJS backend for e-commerce apps. Comes with JWT auth, request/response encryption, file uploads, and the usual CRUD stuff.

## Getting Started

You'll need:
- Node.js 18+ 
- PostgreSQL 12+ 
- npm or yarn

### Setup

1. Clone the repo and `cd` into it

2. Install dependencies:
```bash
npm install
```

3. Copy the `.env.example` to `.env`:
```bash
cp .env.example .env
```

4. Fill in your `.env` file. The important ones are your database credentials and the encryption key.

5. Generate an AES key (you'll need this for encryption):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy that output and paste it as `AES_KEY` in your `.env`.

6. Fire it up:
```bash
npm run start:dev
```

Should be running on `http://localhost:3000` (or whatever port you set).

## Environment Variables

Here's what you need in your `.env`:

```env
# Database - pretty self explanatory
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name

# Server config
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
CORS_ORIGIN=*

# JWT stuff
JWT_SECRET=make_this_at_least_32_chars_long_and_random
JWT_EXPIRES_IN=24h

# Encryption - use the key you generated earlier
AES_KEY=your_base64_encoded_32_byte_key_here
AES_IV_LENGTH=16

# Admin user (created automatically on first run)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_in_production

# File uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES=jpg,jpeg,png,webp
```

**Quick notes:**
- `JWT_SECRET`: Just make it long and random. I usually use `openssl rand -hex 32` or similar.
- `AES_KEY`: Must be exactly 32 bytes when decoded. Use the command from the setup section.
- `DB_PASS`: If your password is empty, make sure it's still a string (even `DB_PASS=""` works).

## API Endpoints

Most endpoints need a JWT token. Add it to your requests like this:
```
Authorization: Bearer <your_token_here>
```

### Auth

- `POST /auth/register` - Sign up (public)
  - Send: `{ email, password, name }`
  - Get back: user object + JWT token

- `POST /auth/login` - Log in (public)
  - Send: `{ email, password }`
  - Get back: user object + JWT token

- `POST /auth/logout` - Log out (needs auth)
  - Just returns a success message

### Users

**Your own profile:**
- `GET /users/profile` - Get your profile
- `PATCH /users/profile` - Update your profile
- `DELETE /users/profile` - Delete your account (bye!)

**Admin only (user management):**
- `GET /users` - List all users
- `GET /users/:id` - Get specific user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Categories

- `POST /categories` - Create category (admin only)
  - Body: `{ name, description? }`

- `GET /categories` - List all (public)
- `GET /categories/:id` - Get one (public)

- `PATCH /categories/:id` - Update (admin only)
- `DELETE /categories/:id` - Delete (admin only)

### Subcategories

- `POST /subcategories` - Create subcategory (admin only)
  - Body: `{ name, description?, categoryId }`

- `GET /subcategories` - List all (public)
  - Optional query: `?categoryId=xxx` to filter

- `GET /subcategories/:id` - Get one (public)

- `PATCH /subcategories/:id` - Update (admin only)
- `DELETE /subcategories/:id` - Delete (admin only)

### Products

- `POST /products` - Create product (admin only)
  - Form data with fields: `name`, `description?`, `price`, `stock`, `categoryId`, `subcategoryId`
  - Also include `image` file (optional)

- `GET /products` - List products (public)
  - Query params: `page`, `limit`, `categoryId`, `subcategoryId`, `search`
  - Supports pagination

- `GET /products/:id` - Get product (public)

- `PATCH /products/:id` - Update product (admin only)
  - Form data: any fields you want to update (all optional)
  - Can include new `image` file

- `DELETE /products/:id` - Delete product (admin only)

## Encryption

Everything is encrypted with AES-256-GCM (except file uploads - those are a pain to encrypt and decrypt, so we skip them).

### How it works

When you send a request, encrypt your JSON body and send it like this:
```json
{
  "encrypted": "base64_encoded_encrypted_data",
  "iv": "base64_encoded_iv"
}
```

The backend decrypts it automatically, processes your request, then encrypts the response and sends it back in the same format.

**Why?** Extra layer of security. Even if someone intercepts the traffic, they can't read it without the key.

### Client-side encryption example

Here's how you'd encrypt on the client (Node.js example):

```javascript
const crypto = require('crypto');

function encryptData(data, key) {
  const algorithm = 'aes-256-gcm';
  const keyBuffer = Buffer.from(key, 'base64');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  
  // Combine encrypted data with auth tag
  const combined = Buffer.concat([
    Buffer.from(encrypted, 'base64'),
    authTag
  ]);
  
  return {
    encrypted: combined.toString('base64'),
    iv: iv.toString('base64')
  };
}

// Usage
const payload = { email: 'user@example.com', password: 'secret123' };
const encrypted = encryptData(payload, process.env.AES_KEY);
// Send encrypted to API
```

For decryption, do the reverse - extract the auth tag, decrypt, and parse the JSON.

## Images

Product images go in `public/images/products/{productId}/`. 

The image service handles:
- File type validation (jpg, jpeg, png, webp only)
- Size check (default 5MB max, configurable)
- Unique filename generation (UUIDs)
- Auto cleanup when products are deleted

If you delete a product, its images get wiped automatically. Nice and clean.

## Roles

Two roles:
- **USER**: Can manage their own profile, view products/categories
- **ADMIN**: Can do everything, including managing users and products

New users get the USER role by default.

## Admin Seeder

On first startup, it automatically creates an admin user if one doesn't exist. Uses the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

It's idempotent - won't create duplicates if you restart the app. Safe to run multiple times.

You can also run it manually:
```bash
npm run seed
```

The seeder code is in `src/seeds/` if you want to customize it.

## Error Responses

All errors come back in this format:
```json
{
  "statusCode": 400,
  "timestamp": "2026-01-31T12:00:00.000Z",
  "path": "/api/products",
  "message": "Product not found",
  "error": "Not Found"
}
```

Pretty standard NestJS error format.

## Troubleshooting

### "client password must be a string" error

This usually means `DB_PASS` is undefined. Check:
1. Your `.env` file actually has `DB_PASS=something`
2. Even if your password is empty, make it `DB_PASS=""` (as a string)
3. Restart the app after changing `.env`

### Encryption not working

- Make sure `AES_KEY` is exactly 32 bytes when base64 decoded
- Verify it's properly base64 encoded (no weird characters)
- Client and server must use the same key (obviously)

### File uploads failing

- Check file size (default 5MB limit)
- Make sure it's jpg, jpeg, png, or webp
- The `public/images` directory needs write permissions

### JWT issues

- `JWT_SECRET` needs to be at least 32 characters
- Tokens expire after 24h by default (configurable)
- Make sure you're sending: `Authorization: Bearer <token>` (with the space!)

## Project Structure

```
src/
├── auth/              # Login, register, JWT stuff
│   └── strategies/    # JWT strategy
├── users/             # User CRUD
├── categories/        # Category management
├── subcategories/    # Subcategory management
├── products/          # Products + image handling
│   └── entities/      # Database entities
├── seeds/             # Database seeders
│   ├── user.seed.ts
│   └── seeds.service.ts
└── shared/            # Reusable stuff
    ├── guards/        # Auth & role guards
    ├── interceptors/  # Encryption interceptor
    ├── decorators/    # Custom decorators (@Public, @Roles, etc.)
    ├── filters/       # Exception filters
    └── services/      # Encryption & image services
```

Pretty standard NestJS structure. Each module has its own controller, service, DTOs, and entity.

## Swagger Docs

Once the app is running, check out the interactive API docs:
```
http://localhost:3000/api
```

You can test endpoints directly from there. Use the "Authorize" button to add your JWT token, then try out the endpoints.

## Development Commands

```bash
npm run start:dev    # Start with hot reload
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint the code
npm run seed         # Run seeder manually
```

## Production Checklist

Before deploying:

- [ ] Set `NODE_ENV=production` (disables TypeORM auto-sync)
- [ ] Use proper migrations instead of `synchronize: true`
- [ ] Store secrets in a proper secrets manager (not in `.env` files)
- [ ] Set proper CORS origins (not `*`)
- [ ] Enable HTTPS
- [ ] Set up logging/monitoring
- [ ] Add rate limiting
- [ ] Configure database backups
- [ ] Change default admin password
- [ ] Review file upload size limits

## License

UNLICENSED - do whatever you want with it.
