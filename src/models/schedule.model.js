const { query } = require('../config/database');

class ContentSlotModel {
  /**
   * Get or create a slot for a given teacher + subject combination.
   */
  static async getOrCreate(teacherId, subject) {
    const existing = await query(
      `SELECT * FROM content_slots WHERE teacher_id = $1 AND LOWER(subject) = LOWER($2)`,
      [teacherId, subject]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    const created = await query(
      `INSERT INTO content_slots (teacher_id, subject) VALUES ($1, $2) RETURNING *`,
      [teacherId, subject.toLowerCase()]
    );
    return created.rows[0];
  }

  static async findByTeacherAndSubject(teacherId, subject) {
    const result = await query(
      `SELECT * FROM content_slots WHERE teacher_id = $1 AND LOWER(subject) = LOWER($2)`,
      [teacherId, subject]
    );
    return result.rows[0] || null;
  }
}

class ContentScheduleModel {
  static async upsert(contentId, slotId, rotationOrder, duration) {
    // Remove any existing schedule for this content
    await query(`DELETE FROM content_schedule WHERE content_id = $1`, [contentId]);

    // Get next rotation order if not provided
    if (rotationOrder === null || rotationOrder === undefined) {
      const maxResult = await query(
        `SELECT COALESCE(MAX(rotation_order), 0) AS max_order FROM content_schedule WHERE slot_id = $1`,
        [slotId]
      );
      rotationOrder = maxResult.rows[0].max_order + 1;
    }

    const result = await query(
      `INSERT INTO content_schedule (content_id, slot_id, rotation_order, duration)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slot_id, rotation_order)
       DO UPDATE SET content_id = $1, duration = $4
       RETURNING *`,
      [contentId, slotId, rotationOrder, duration]
    );
    return result.rows[0];
  }

  static async findBySlot(slotId) {
    const result = await query(
      `SELECT cs.*, c.title, c.subject, c.file_url, c.start_time, c.end_time, c.status
       FROM content_schedule cs
       JOIN content c ON cs.content_id = c.id
       WHERE cs.slot_id = $1
       ORDER BY cs.rotation_order ASC`,
      [slotId]
    );
    return result.rows;
  }

  static async deleteByContentId(contentId) {
    await query(`DELETE FROM content_schedule WHERE content_id = $1`, [contentId]);
  }
}

module.exports = { ContentSlotModel, ContentScheduleModel };
