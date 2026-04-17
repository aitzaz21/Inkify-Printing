# Inkify Printing — Production v3.0

A full-stack custom t-shirt marketplace platform (MERN) with a designer marketplace, admin earnings panel, secure card payments, and dynamic customization.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)
- Gmail account with App Password enabled

---

### 1. Clone & Install

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Fill in all values in .env
```

**Required values:**
| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Any random 32+ char string |
| `CLOUDINARY_*` | cloudinary.com → Dashboard |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail → Security → App Passwords |
| `GOOGLE_CLIENT_ID` | console.cloud.google.com |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Your choice — used to seed admin |

### 3. Run

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev
```

### 4. First Login

Visit `http://localhost:5173` and log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`.

---

## 📁 Project Structure

```
inkify/
├── server/
│   ├── app.js                        # Express app, middleware, routes
│   ├── server.js                     # Entry point, DB connect, seed
│   ├── .env.example
│   ├── config/
│   │   ├── db.js                     # Mongoose connection
│   │   └── cloudinary.js             # Cloudinary + multer uploaders
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT verification
│   │   └── adminMiddleware.js        # Role check
│   ├── utils/
│   │   ├── emailService.js           # All email templates
│   │   └── otpService.js             # OTP create/verify
│   └── modules/
│       ├── auth/                     # Signup, login, OTP, Google OAuth
│       ├── user/                     # User profile + payment accounts CRUD
│       ├── product/                  # Shirt types CRUD
│       ├── order/                    # Order lifecycle + card payment
│       ├── design/                   # Marketplace designs
│       ├── designer/                 # Earnings tracking + analytics ← NEW
│       ├── content/                  # CMS (hero, banners)
│       └── upload/                   # Cloudinary upload endpoints
│
└── client/
    └── src/
        ├── App.jsx                   # Route tree
        ├── shared/
        │   ├── api/axios.js          # Axios + JWT interceptor
        │   └── context/CartContext   # Cart state with designId
        └── modules/
            ├── home/                 # HomePage, DesignsPage, Navbar, Footer
            ├── customize/            # 3-step customizer
            ├── marketplace/          # Design listings + upload
            ├── checkout/             # Card-on-site payment form ← FIXED
            ├── orders/               # User order history
            ├── shop/                 # ProfilePage + payment accounts ← NEW
            └── admin/
                ├── AdminOrdersPage   # With design view/download ← FIXED
                ├── AdminProductsPage # Shirt CRUD with colors
                ├── AdminDesignsPage  # Approve/reject designs
                ├── AdminEarningsPage # Designer earnings panel ← NEW
                ├── AdminUsersPage    # User/role management
                └── AdminContentPage  # CMS
```

---

## ✅ What Was Built / Fixed in v3

### Backend
| Module | Change |
|---|---|
| `order.model.js` | Added `designId`, `transactionId`, `paymentReference` fields |
| `order.service.js` | Card payment handling, designer earnings recording |
| `user.model.js` | Added `paymentAccounts[]` array |
| `user.routes.js` | Full CRUD for `/me/payment-accounts` |
| `designer/` (NEW) | `DesignerEarning` model, service, routes |
| `emailService.js` | `sendDesignSoldEmail`, `sendPaymentCompleteEmail`, `delivered` status |
| `app.js` | Registered `/api/designer-earnings` route |
| `payfast.routes.js` | Removed redirect builder; kept ITN webhook |

### Frontend
| File | Change |
|---|---|
| `CheckoutPage.jsx` | Card-on-site form with Luhn validation; no PayFast redirect |
| `AdminOrdersPage.jsx` | Design view + download modal per order |
| `AdminEarningsPage.jsx` (NEW) | Summary table, earnings log, top designs, mark paid |
| `ProfilePage.jsx` | Full payment accounts management (add/edit/delete) |
| `ProductCard.jsx` | Display-only; only Buy Now button is interactive |
| `DesignCard.jsx` | Display-only; only Buy Now button is interactive |
| `CartContext.jsx` | `designId` added to line key |
| `CustomizePage.jsx` | Passes `designId` in addItem; handles `preSelectedDesign` |
| `DesignsPage.jsx` | Handles `preSelectedDesign` state from marketplace |
| `Footer.jsx` | All dead links fixed |
| `AdminLayout.jsx` | Earnings link added to sidebar |
| `App.jsx` | `/admin/earnings` route added |

---

## 🔐 Security

- JWT auth on all protected routes
- Role-based access (user / admin)
- Rate limiting on all `/api` routes (stricter on auth)
- Helmet.js security headers
- CORS locked to `CLIENT_URL`
- Card numbers **never stored** — only last 4 digits reach backend
- File uploads validated by mime type + 5MB limit

---

## 💳 Payment Flow

### Cash on Delivery
Order placed → status `pending` → admin processes manually

### Card Payment
1. User fills card form on site
2. Luhn check validates client-side
3. Backend generates transaction ID, marks order `paid` + `confirmed`
4. Confirmation email sent automatically

### PayFast ITN (webhook)
- `POST /api/payment/notify` — signature verified, order updated

---

## 🎨 Designer Earnings Flow

1. User uploads design → Admin approves
2. Customer buys shirt with that design
3. `recordDesignSale()` creates `DesignerEarning` record
4. Designer gets "Design Sold" email automatically
5. Admin visits `/admin/earnings` → sees pending payouts
6. Admin selects earnings → clicks **Mark as Paid**
7. Designer gets "Payment Sent" email

---

## 📧 Email Triggers

| Trigger | Recipient | Template |
|---|---|---|
| Signup | User | OTP verification |
| Forgot password | User | OTP reset |
| Order placed | User | Order summary |
| Order confirmed | User | In production |
| Order dispatched | User | Shipped |
| Order delivered | User | Delivered |
| Design approved | Designer | Approved notification |
| Design rejected | Designer | Rejection + reason |
| Design sold | Designer | Sale notification + earnings |
| Payment marked paid | Designer | Payment sent confirmation |

---

## 🛠 Admin Panel Routes

| URL | Page |
|---|---|
| `/admin` | Dashboard + stats |
| `/admin/orders` | Orders + design download |
| `/admin/products` | Shirt types CRUD |
| `/admin/designs` | Approve/reject marketplace designs |
| `/admin/earnings` | Designer earnings + analytics |
| `/admin/users` | User management + roles |
| `/admin/content` | Homepage CMS |

