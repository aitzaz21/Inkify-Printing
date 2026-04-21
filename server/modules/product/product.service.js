const Product = require('./product.model');

const getAllProducts = async ({ category, search, activeOnly = true } = {}) => {
  const query = {};
  if (activeOnly) query.isActive = true;
  if (category && category !== 'All') query.category = category;
  if (search) {
    const re = new RegExp(search, 'i');
    query.$or = [{ name: re }, { description: re }, { category: re }, { tags: re }];
  }
  return Product.find(query).sort({ sortOrder: 1, createdAt: -1 });
};

const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw { status: 404, message: 'Product not found.' };
  return product;
};

const getCategories = async () => {
  return Product.distinct('category', { isActive: true });
};

const createProduct = async (data) => Product.create(data);

const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) throw { status: 404, message: 'Product not found.' };
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw { status: 404, message: 'Product not found.' };
};

const seedProducts = async () => {
  const count = await Product.countDocuments();
  if (count > 0) return;

  const samples = [
    {
      name: 'Classic Crew Tee',
      description: 'Our signature 180gsm 100% cotton crew-neck. Relaxed fit, pre-shrunk, and made to take any print beautifully.',
      category: 'T-Shirt',
      badge: 'Bestseller',
      basePrice: 1999,
      sortOrder: 1,
      tags: ['tshirt', 'cotton', 'classic'],
      colors: [
        { name: 'White',  hex: '#FFFFFF' },
        { name: 'Black',  hex: '#0B0B0B' },
        { name: 'Brown',  hex: '#6B4226' },
        { name: 'Navy',   hex: '#1a2e4a' },
        { name: 'Ash',    hex: '#B2B2B2' },
      ],
      sizePricing: { XL: 200, XXL: 400 },
    },
    {
      name: 'Premium Oversized Tee',
      description: 'Dropped shoulders, heavyweight 220gsm cotton. The oversized silhouette that photography loves.',
      category: 'T-Shirt',
      badge: 'Popular',
      basePrice: 2499,
      sortOrder: 2,
      tags: ['tshirt', 'oversized', 'premium'],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Black', hex: '#0B0B0B' },
        { name: 'Sand',  hex: '#D4B896' },
        { name: 'Olive', hex: '#6B7A4B' },
      ],
      sizePricing: { XL: 200, XXL: 400 },
    },
    {
      name: 'Fitted V-Neck',
      description: 'Clean lines and a tailored fit. 160gsm combed cotton for the days when you need to look sharp.',
      category: 'T-Shirt',
      badge: null,
      basePrice: 2199,
      sortOrder: 3,
      tags: ['tshirt', 'vneck', 'fitted'],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Black', hex: '#0B0B0B' },
        { name: 'Grey',  hex: '#6B6460' },
      ],
      sizePricing: { XL: 200, XXL: 400 },
    },
    {
      name: 'Vintage Wash Tee',
      description: 'Garment-dyed for a lived-in feel right out of the box. 200gsm ring-spun cotton with a soft hand.',
      category: 'T-Shirt',
      badge: 'New',
      basePrice: 2699,
      sortOrder: 4,
      tags: ['tshirt', 'vintage', 'garment-dyed'],
      colors: [
        { name: 'Faded Brown', hex: '#8B6550' },
        { name: 'Washed Black', hex: '#2A2A2A' },
        { name: 'Dusty Rose',  hex: '#C9967A' },
      ],
      sizePricing: { XL: 200, XXL: 400 },
    },
    {
      name: 'Performance Dry-Fit',
      description: 'Moisture-wicking polyester blend built for movement. Holds colour through repeated washes.',
      category: 'T-Shirt',
      badge: null,
      basePrice: 2299,
      sortOrder: 5,
      tags: ['tshirt', 'dryfit', 'sport'],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Black', hex: '#0B0B0B' },
        { name: 'Royal Blue', hex: '#2B5EA7' },
      ],
      sizePricing: { XL: 200, XXL: 400 },
    },
    {
      name: 'Long-Sleeve Heavyweight',
      description: '260gsm long-sleeve tee with reinforced cuffs. Serious weight, serious print quality.',
      category: 'Long Sleeve',
      badge: null,
      basePrice: 2999,
      sortOrder: 6,
      tags: ['longsleeve', 'heavyweight', 'winter'],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Black', hex: '#0B0B0B' },
        { name: 'Brown', hex: '#6B4226' },
      ],
      sizePricing: { XL: 300, XXL: 500 },
    },
  ];

  await Product.insertMany(samples);
  console.log('✅ Products seeded (v2 with colours & pricing).');
};

const migrateProductPrices = async () => {
  const products = await Product.find({ basePrice: { $lt: 100 } });
  if (!products.length) return;
  for (const p of products) {
    const newBase = Math.round(p.basePrice * 100);
    const newSizePricing = {};
    if (p.sizePricing) {
      for (const [k, v] of Object.entries(Object.fromEntries ? Object.fromEntries(p.sizePricing instanceof Map ? p.sizePricing : new Map(Object.entries(p.sizePricing))) : p.sizePricing)) {
        newSizePricing[k] = Math.round(Number(v) * 100);
      }
    }
    await Product.findByIdAndUpdate(p._id, { basePrice: newBase, sizePricing: newSizePricing });
  }
  console.log(`✅ Migrated ${products.length} product(s) to PKR pricing.`);
};

module.exports = { getAllProducts, getProductById, getCategories, createProduct, updateProduct, deleteProduct, seedProducts, migrateProductPrices };
