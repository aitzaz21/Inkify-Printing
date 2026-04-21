const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const authRoutes       = require('./modules/auth/auth.routes');
const productRoutes    = require('./modules/product/product.routes');
const orderRoutes      = require('./modules/order/order.routes');
const uploadRoutes     = require('./modules/upload/upload.routes');
const contentRoutes    = require('./modules/content/content.routes');
const designRoutes     = require('./modules/design/design.routes');
const userRoutes       = require('./modules/user/user.routes');
const payfastRoutes    = require('./modules/order/payfast.routes');
const earningsRoutes   = require('./modules/designer/designer.routes');
const withdrawalRoutes = require('./modules/designer/withdrawal.routes');
const shirtConfigRoutes = require('./modules/shirtconfig/shirtconfig.routes');
const blogRoutes        = require('./modules/blog/blog.routes');
const faqRoutes         = require('./modules/faq/faq.routes');
const reviewRoutes      = require('./modules/review/review.routes');
const footerRoutes      = require('./modules/footer/footer.routes');
const statsRoutes       = require('./modules/stats/stats.routes');
const contactRoutes     = require('./modules/contact/contact.routes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));


const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://inkify-printing.vercel.app/", // 🔥 replace with your real Vercel URL
];



app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      origin.includes("localhost") ||
      origin.includes("vercel.app")
    ) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

const limiter = rateLimit({ windowMs: 15*60*1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20 });
app.use('/api/auth/login',  authLimiter);
app.use('/api/auth/signup', authLimiter);

// Contact form rate limit (prevent spam)
const contactLimiter = rateLimit({ windowMs: 60*60*1000, max: 10 });
app.use('/api/contact', contactLimiter);

app.use('/api/upload', uploadRoutes);
app.use('/api/payment', payfastRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'Inkify API v7 🚀', timestamp: new Date().toISOString() })
);

app.use('/api/auth',              authRoutes);
app.use('/api/products',          productRoutes);
app.use('/api/orders',            orderRoutes);
app.use('/api/content',           contentRoutes);
app.use('/api/designs',           designRoutes);
app.use('/api/users',             userRoutes);
app.use('/api/designer-earnings', earningsRoutes);
app.use('/api/withdrawals',       withdrawalRoutes);
app.use('/api/shirt-config',      shirtConfigRoutes);
app.use('/api/blog',              blogRoutes);
app.use('/api/faq',               faqRoutes);
app.use('/api/reviews',           reviewRoutes);
app.use('/api/footer',            footerRoutes);
app.use('/api/stats',             statsRoutes);
app.use('/api/contact',           contactRoutes);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` })
);

app.use((err, _req, res, _next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
