const productService = require('./product.service');

const respond = (res, status, data) =>
  res.status(status).json({ success: status < 400, ...data });

const getAllProducts = async (req, res) => {
  try {
    const { category, search, activeOnly } = req.query;
    // Default to active only for public; admin passes activeOnly=false
    const onlyActive = activeOnly === 'false' ? false : true;
    const products = await productService.getAllProducts({ category, search, activeOnly: onlyActive });
    respond(res, 200, { products });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message || 'Server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await productService.getCategories();
    respond(res, 200, { categories: ['All', ...categories] });
  } catch (err) {
    respond(res, 500, { message: 'Server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    respond(res, 200, { product });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    respond(res, 201, { product });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    respond(res, 200, { product });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    respond(res, 200, { message: 'Product deleted.' });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

module.exports = { getAllProducts, getCategories, getProductById, createProduct, updateProduct, deleteProduct };
