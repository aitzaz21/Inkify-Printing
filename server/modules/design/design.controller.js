const designService = require('./design.service');

const respond = (res, status, data) =>
  res.status(status).json({ success: status < 400, ...data });

// Public
const getApprovedDesigns = async (req, res) => {
  try {
    const result = await designService.getApprovedDesigns(req.query);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const getDesignById = async (req, res) => {
  try {
    const design = await designService.getDesignById(req.params.id);
    respond(res, 200, { design });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

// User
const createDesign = async (req, res) => {
  try {
    const design = await designService.createDesign(req.user._id, req.body);
    respond(res, 201, { design });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const getMyDesigns = async (req, res) => {
  try {
    const result = await designService.getUserDesigns(req.user._id, req.query.page, req.query.limit);
    respond(res, 200, result);
  } catch (err) {
    respond(res, 500, { message: err.message });
  }
};

const updateDesign = async (req, res) => {
  try {
    const design = await designService.updateDesign(req.user._id, req.params.id, req.body);
    respond(res, 200, { design });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const deleteDesign = async (req, res) => {
  try {
    await designService.deleteDesign(req.user._id, req.params.id);
    respond(res, 200, { message: 'Design deleted.' });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

// Admin
const getAllDesignsAdmin = async (req, res) => {
  try {
    const result = await designService.getAllDesignsAdmin(req.query);
    respond(res, 200, result);
  } catch (err) {
    respond(res, 500, { message: err.message });
  }
};

const approveDesign = async (req, res) => {
  try {
    const design = await designService.approveDesign(req.params.id);
    respond(res, 200, { design });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const rejectDesign = async (req, res) => {
  try {
    const design = await designService.rejectDesign(req.params.id, req.body.reason);
    respond(res, 200, { design });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const adminDeleteDesign = async (req, res) => {
  try {
    await designService.adminDeleteDesign(req.params.id);
    respond(res, 200, { message: 'Design deleted.' });
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

module.exports = {
  getApprovedDesigns, getDesignById,
  createDesign, getMyDesigns, updateDesign, deleteDesign,
  getAllDesignsAdmin, approveDesign, rejectDesign, adminDeleteDesign,
};
