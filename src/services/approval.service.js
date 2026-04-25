const ContentModel = require('../models/content.model');
const { ContentScheduleModel } = require('../models/schedule.model');

class ApprovalService {
  static async approveContent(contentId, principalId) {
    const content = await ContentModel.findById(contentId);
    if (!content) {
      const err = new Error('Content not found.');
      err.statusCode = 404;
      throw err;
    }
    if (content.status !== 'pending') {
      const err = new Error(`Content is already ${content.status}. Only pending content can be actioned.`);
      err.statusCode = 400;
      throw err;
    }

    const updated = await ContentModel.approve(contentId, principalId);
    return updated;
  }

  static async rejectContent(contentId, principalId, rejectionReason) {
    const content = await ContentModel.findById(contentId);
    if (!content) {
      const err = new Error('Content not found.');
      err.statusCode = 404;
      throw err;
    }
    if (content.status !== 'pending') {
      const err = new Error(`Content is already ${content.status}. Only pending content can be actioned.`);
      err.statusCode = 400;
      throw err;
    }

    const updated = await ContentModel.reject(contentId, principalId, rejectionReason);

    // Remove from rotation schedule since it's rejected
    await ContentScheduleModel.deleteByContentId(contentId);

    return updated;
  }
}

module.exports = ApprovalService;
