const path = require('path');
const ContentModel = require('../models/content.model');
const { ContentSlotModel, ContentScheduleModel } = require('../models/schedule.model');
const { UPLOAD_DIR } = require('../middlewares/upload.middleware');

class ContentService {
  /**
   * Upload new content and register it in the scheduling tables.
   */
  static async upload({ title, description, subject, file, uploadedBy, startTime, endTime, rotationDuration }) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;
    const filePath = file.path;
    const fileType = path.extname(file.originalname).toLowerCase().replace('.', '');

    // Persist content record
    const content = await ContentModel.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      subject: subject.trim().toLowerCase(),
      fileUrl,
      filePath,
      fileType,
      fileSize: file.size,
      uploadedBy,
      startTime: startTime || null,
      endTime: endTime || null,
      rotationDuration: rotationDuration ? parseInt(rotationDuration) : 5,
    });

    // Register slot (teacher + subject) and schedule entry
    const slot = await ContentSlotModel.getOrCreate(uploadedBy, subject.trim().toLowerCase());
    await ContentScheduleModel.upsert(content.id, slot.id, null, content.rotation_duration);

    return content;
  }

  static async getTeacherContent(teacherId, filters = {}) {
    return ContentModel.findByTeacher(teacherId, filters);
  }

  static async getAllContent(filters = {}) {
    return ContentModel.findAll(filters);
  }

  static async getPendingContent() {
    return ContentModel.findAll({ status: 'pending' });
  }
}

module.exports = ContentService;
