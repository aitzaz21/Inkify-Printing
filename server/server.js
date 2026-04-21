require('dotenv').config();
const app       = require('./app');
const connectDB = require('./config/db');
const { seedProducts, migrateProductPrices } = require('./modules/product/product.service');
const User = require('./modules/user/user.model');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 5000;

const seedAdmin = async () => {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName  = process.env.ADMIN_LAST_NAME  || 'User';

  if (!email || !password) {
    console.log('ℹ️  No ADMIN_EMAIL/ADMIN_PASSWORD in .env — skipping admin seed.');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    // Ensure role is admin
    if (existing.role !== 'admin') {
      await User.findByIdAndUpdate(existing._id, { role: 'admin' });
      console.log(`✅ Upgraded ${email} to admin.`);
    } else {
      console.log(`✅ Admin user (${email}) already exists.`);
    }
    return;
  }

  await User.create({
    firstName,
    lastName,
    email,
    password,
    role: 'admin',
    isVerified: true,
    isProfileComplete: true,
    gender: 'prefer_not_to_say',
  });
  console.log(`✅ Admin user created: ${email}`);
};

const startServer = async () => {
  await connectDB();
  await seedProducts();
  await migrateProductPrices();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`\n🚀 Inkify Printing Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api\n`);
  });
};

startServer();
