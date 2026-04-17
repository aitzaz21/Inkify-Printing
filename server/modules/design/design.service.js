const Design = require('./design.model');
const { deleteByUrl } = require('../../config/cloudinary');
const { sendDesignStatusEmail } = require('../../utils/emailService');

// ── Public ────────────────────────────────────────────────────
const getApprovedDesigns = async ({ search, page = 1, limit = 24 } = {}) => {
  const query = { status: 'approved' };
  if (search) {
    const re = new RegExp(search, 'i');
    query.$or = [{ title: re }, { description: re }, { tags: re }];
  }
  const [designs, total] = await Promise.all([
    Design.find(query)
      .populate('creator', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Design.countDocuments(query),
  ]);
  return { designs, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const getDesignById = async (id) => {
  const design = await Design.findById(id).populate('creator', 'firstName lastName avatar');
  if (!design) throw { status: 404, message: 'Design not found.' };
  return design;
};

// ── User ──────────────────────────────────────────────────────
const createDesign = async (userId, { title, description, imageUrl, price, tags }) => {
  if (!title?.trim()) throw { status: 422, message: 'Title is required.' };
  if (!imageUrl)      throw { status: 422, message: 'Image is required.' };
  if (price < 0)      throw { status: 422, message: 'Price cannot be negative.' };

  return Design.create({
    creator: userId,
    title: title.trim(),
    description: description?.trim() || '',
    imageUrl,
    price: parseFloat(price) || 0,
    tags: Array.isArray(tags) ? tags : [],
    status: 'pending',
  });
};

const getUserDesigns = async (userId, page = 1, limit = 24) => {
  const [designs, total] = await Promise.all([
    Design.find({ creator: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Design.countDocuments({ creator: userId }),
  ]);
  return { designs, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const updateDesign = async (userId, designId, updates) => {
  const design = await Design.findOne({ _id: designId, creator: userId });
  if (!design) throw { status: 404, message: 'Design not found or not yours.' };

  let needsReApproval = false;

  // Name/description/tags update instantly (no re-approval)
  if (updates.title !== undefined)       design.title       = updates.title;
  if (updates.description !== undefined) design.description = updates.description;
  if (updates.tags !== undefined)        design.tags        = updates.tags;

  // Price change requires re-approval
  if (updates.price !== undefined && Number(updates.price) !== design.price) {
    design.price = Number(updates.price);
    needsReApproval = true;
  }

  // Image change requires re-approval
  if (updates.imageUrl && updates.imageUrl !== design.imageUrl) {
    await deleteByUrl(design.imageUrl);
    design.imageUrl = updates.imageUrl;
    needsReApproval = true;
  }

  if (needsReApproval && design.status === 'approved') {
    design.status = 'pending';
    design.adminNote = 'Re-submitted for review (image or price changed).';
  }

  return design.save();
};

const deleteDesign = async (userId, designId) => {
  const design = await Design.findOne({ _id: designId, creator: userId });
  if (!design) throw { status: 404, message: 'Design not found or not yours.' };
  await deleteByUrl(design.imageUrl);
  await design.deleteOne();
};

// ── Admin ─────────────────────────────────────────────────────
const getAllDesignsAdmin = async ({ status, search, page = 1, limit = 24 } = {}) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    const re = new RegExp(search, 'i');
    query.$or = [{ title: re }, { description: re }, { tags: re }];
  }
  const [designs, total] = await Promise.all([
    Design.find(query)
      .populate('creator', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Design.countDocuments(query),
  ]);
  return { designs, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const approveDesign = async (designId) => {
  const design = await Design.findByIdAndUpdate(
    designId,
    { status: 'approved', adminNote: '' },
    { new: true }
  ).populate('creator', 'firstName email');
  if (!design) throw { status: 404, message: 'Design not found.' };
  await sendDesignStatusEmail('approved', design);
  return design;
};

const rejectDesign = async (designId, reason = '') => {
  const design = await Design.findByIdAndUpdate(
    designId,
    { status: 'rejected', adminNote: reason },
    { new: true }
  ).populate('creator', 'firstName email');
  if (!design) throw { status: 404, message: 'Design not found.' };
  await sendDesignStatusEmail('rejected', design, reason);
  return design;
};

const adminDeleteDesign = async (designId) => {
  const design = await Design.findById(designId);
  if (!design) throw { status: 404, message: 'Design not found.' };
  await deleteByUrl(design.imageUrl);
  await design.deleteOne();
};

module.exports = {
  getApprovedDesigns, getDesignById,
  createDesign, getUserDesigns, updateDesign, deleteDesign,
  getAllDesignsAdmin, approveDesign, rejectDesign, adminDeleteDesign,
};
