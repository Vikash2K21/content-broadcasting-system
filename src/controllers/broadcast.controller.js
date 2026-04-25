const BroadcastService = require('../services/broadcast.service');
const UserModel = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.util');

/**
 * GET /content/live/:teacherIdentifier
 * Public endpoint — no auth required.
 * Returns currently active/rotating content for the given teacher.
 * Optional query param: ?subject=maths
 */
const getLiveContent = async (req, res) => {
  try {
    const { teacherIdentifier } = req.params;
    const { subject } = req.query;

    const result = await BroadcastService.getLiveContent(teacherIdentifier, subject || null);

    if (!result.available) {
      // Edge cases: no content, not scheduled, invalid subject, unknown teacher
      return res.status(200).json({
        success: true,
        message: result.message,
        data: null,
      });
    }

    return successResponse(res, result, result.message);
  } catch (error) {
    // Public API — never expose internal errors
    return res.status(200).json({
      success: true,
      message: 'No content available.',
      data: null,
    });
  }
};

/**
 * GET /content/live
 * List all teachers (for discoverability)
 */
const listTeachers = async (req, res) => {
  try {
    const teachers = await UserModel.findAllTeachers();
    const list = teachers.map((t, i) => ({
      alias: `teacher-${i + 1}`,
      id: t.id,
      name: t.name,
      live_endpoint: `/content/live/teacher-${i + 1}`,
    }));
    return successResponse(res, list, 'Teacher list fetched.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getLiveContent, listTeachers };
