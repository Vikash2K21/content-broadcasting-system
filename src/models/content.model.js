const { query } = require('../config/database');

class ContentModel {
  static async create({ title, description, subject, fileUrl, filePath, fileType, fileSize, uploadedBy, startTime, endTime, rotationDuration }) {
    const result = await query(
      `INSERT INTO content
         (title, description, subject, file_url, file_path, file_type, file_size,
          uploaded_by, status, start_time, end_time, rotation_duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11)
       RETURNING *`,
      [title, description, subject, fileUrl, filePath, fileType, fileSize,
       uploadedBy, startTime || null, endTime || null, rotationDuration || 5]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `SELECT c.*, u.name AS uploader_name, u.email AS uploader_email,
              p.name AS approver_name
       FROM content c
       JOIN users u ON c.uploaded_by = u.id
       LEFT JOIN users p ON c.approved_by = p.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll({ status, subject, uploadedBy, page = 1, limit = 20 } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (subject) { conditions.push(`LOWER(c.subject) = LOWER($${idx++})`); params.push(subject); }
    if (uploadedBy) { conditions.push(`c.uploaded_by = $${idx++}`); params.push(uploadedBy); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT c.*, u.name AS uploader_name, p.name AS approver_name
       FROM content c
       JOIN users u ON c.uploaded_by = u.id
       LEFT JOIN users p ON c.approved_by = p.id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM content c ${where}`,
      params
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  static async findByTeacher(uploadedBy, { status, subject } = {}) {
    const conditions = [`c.uploaded_by = $1`];
    const params = [uploadedBy];
    let idx = 2;

    if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (subject) { conditions.push(`LOWER(c.subject) = LOWER($${idx++})`); params.push(subject); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT c.*, p.name AS approver_name
       FROM content c
       LEFT JOIN users p ON c.approved_by = p.id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    return result.rows;
  }

  static async approve(id, approvedBy) {
    const result = await query(
      `UPDATE content
       SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [approvedBy, id]
    );
    return result.rows[0] || null;
  }

  static async reject(id, approvedBy, rejectionReason) {
    const result = await query(
      `UPDATE content
       SET status = 'rejected', approved_by = $1, rejection_reason = $2,
           approved_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [approvedBy, rejectionReason, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Fetch all approved, currently active (within time window) content
   * for a specific teacher, grouped by subject.
   */
  static async findLiveByTeacher(teacherId) {
    const result = await query(
      `SELECT *
       FROM content
       WHERE uploaded_by = $1
         AND status = 'approved'
         AND start_time IS NOT NULL
         AND end_time IS NOT NULL
         AND NOW() BETWEEN start_time AND end_time
       ORDER BY subject, created_at ASC`,
      [teacherId]
    );
    return result.rows;
  }
}

module.exports = ContentModel;
