const { errorResponse } = require('../utils/response.util');

/**
 * Validates content upload request fields.
 */
const validateContentUpload = (req, res, next) => {
  const errors = [];
  const { title, subject, start_time, end_time } = req.body;

  if (!title || title.trim().length === 0) {
    errors.push('Title is required.');
  }
  if (title && title.trim().length > 255) {
    errors.push('Title must be 255 characters or fewer.');
  }
  if (!subject || subject.trim().length === 0) {
    errors.push('Subject is required.');
  }
  if (!req.file) {
    errors.push('File is required (JPG, PNG, or GIF, max 10MB).');
  }

  // Validate timestamps if provided
  if (start_time) {
    const st = new Date(start_time);
    if (isNaN(st.getTime())) errors.push('start_time must be a valid ISO date.');
  }
  if (end_time) {
    const et = new Date(end_time);
    if (isNaN(et.getTime())) errors.push('end_time must be a valid ISO date.');
  }
  if (start_time && end_time) {
    if (new Date(end_time) <= new Date(start_time)) {
      errors.push('end_time must be after start_time.');
    }
  }
  // Either both or neither
  if ((start_time && !end_time) || (!start_time && end_time)) {
    errors.push('Both start_time and end_time must be provided together.');
  }

  if (errors.length > 0) {
    // Clean up the uploaded file if validation fails
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, () => {});
    }
    return errorResponse(res, 'Validation failed.', 400, errors);
  }

  next();
};

/**
 * Validates approval/rejection request body.
 */
const validateApproval = (req, res, next) => {
  const { action, rejection_reason } = req.body;
  const errors = [];

  if (!action || !['approve', 'reject'].includes(action)) {
    errors.push('Action must be either "approve" or "reject".');
  }
  if (action === 'reject' && (!rejection_reason || rejection_reason.trim().length === 0)) {
    errors.push('rejection_reason is required when action is "reject".');
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed.', 400, errors);
  }
  next();
};

/**
 * Validates registration body.
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) errors.push('Name is required.');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Valid email is required.');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters.');
  if (!role || !['principal', 'teacher'].includes(role)) errors.push('Role must be "principal" or "teacher".');

  if (errors.length > 0) return errorResponse(res, 'Validation failed.', 400, errors);
  next();
};

module.exports = { validateContentUpload, validateApproval, validateRegister };
