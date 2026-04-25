const ApprovalService = require('../services/approval.service');
const { successResponse, errorResponse } = require('../utils/response.util');

/**
 * PATCH /api/approval/:contentId — Principal approves or rejects content
 */
const processApproval = async (req, res) => {
  try {
    const { action, rejection_reason } = req.body;
    const { contentId } = req.params;

    let result;
    if (action === 'approve') {
      result = await ApprovalService.approveContent(contentId, req.user.id);
      return successResponse(res, result, 'Content approved successfully.');
    } else {
      result = await ApprovalService.rejectContent(contentId, req.user.id, rejection_reason);
      return successResponse(res, result, 'Content rejected.');
    }
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

module.exports = { processApproval };
