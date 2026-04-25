const ContentService = require('../services/content.service');
const ContentModel = require('../models/content.model');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.util');

/**
 * POST /api/content/upload — Teacher uploads content
 */
const upload = async (req, res) => {
  try {
    const { title, description, subject, start_time, end_time, rotation_duration } = req.body;
    const content = await ContentService.upload({
      title,
      description,
      subject,
      file: req.file,
      uploadedBy: req.user.id,
      startTime: start_time,
      endTime: end_time,
      rotationDuration: rotation_duration,
    });
    return successResponse(res, content, 'Content uploaded successfully. Awaiting approval.', 201);
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * GET /api/content/my — Teacher views their own content
 */
const getMyContent = async (req, res) => {
  try {
    const { status, subject } = req.query;
    const content = await ContentService.getTeacherContent(req.user.id, { status, subject });
    return successResponse(res, content, 'Content fetched successfully.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/content — Principal views all content (with filters)
 */
const getAllContent = async (req, res) => {
  try {
    const { status, subject, teacher_id, page = 1, limit = 20 } = req.query;
    const result = await ContentService.getAllContent({
      status,
      subject,
      uploadedBy: teacher_id,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
    });
    return paginatedResponse(res, result, 'Content fetched successfully.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/content/pending — Principal views pending content
 */
const getPendingContent = async (req, res) => {
  try {
    const result = await ContentService.getPendingContent();
    return successResponse(res, result.data, 'Pending content fetched.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/content/:id — Get single content item
 */
const getContentById = async (req, res) => {
  try {
    const content = await ContentModel.findById(req.params.id);
    if (!content) return errorResponse(res, 'Content not found.', 404);

    // Teachers can only view their own content
    if (req.user.role === 'teacher' && content.uploaded_by !== req.user.id) {
      return errorResponse(res, 'Access denied.', 403);
    }

    return successResponse(res, content, 'Content fetched successfully.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { upload, getMyContent, getAllContent, getPendingContent, getContentById };
