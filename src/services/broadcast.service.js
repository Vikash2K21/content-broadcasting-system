const ContentModel = require('../models/content.model');
const UserModel = require('../models/user.model');
const { getActiveContentForSubject } = require('../utils/scheduler.util');

class BroadcastService {
  /**
   * Get the currently live/active content for a given teacher.
   *
   * Steps:
   * 1. Verify teacher exists.
   * 2. Fetch all approved content within the teacher's scheduled time windows.
   * 3. Apply rotation logic to determine which content is active right now.
   * 4. Optionally filter by subject.
   *
   * Edge cases:
   * - Teacher not found → return empty
   * - No approved content → return empty
   * - Approved but outside time window → return empty
   * - Invalid subject filter → return empty
   *
   * @param {string} teacherIdentifier - teacher id or "teacher-N" alias
   * @param {string|null} subject - optional subject filter
   * @returns {{ available: boolean, content: Object|Array|null, message: string }}
   */
  static async getLiveContent(teacherIdentifier, subject = null) {
    // Resolve teacher by id or by ordinal alias "teacher-1", "teacher-2" etc.
    let teacher = null;

    // Check if identifier is UUID-like
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(teacherIdentifier)) {
      teacher = await UserModel.findById(teacherIdentifier);
    } else {
      // Try ordinal: teacher-1 → first teacher by created_at
      const ordinalMatch = teacherIdentifier.match(/^teacher-(\d+)$/i);
      if (ordinalMatch) {
        const index = parseInt(ordinalMatch[1]) - 1; // 0-based
        const teachers = await UserModel.findAllTeachers();
        teacher = teachers[index] || null;
      }
    }

    // Edge case: teacher not found — return empty, not error
    if (!teacher || teacher.role === 'principal') {
      return { available: false, content: null, message: 'No content available.' };
    }

    // Fetch all approved, currently scheduled (within time window) content
    const liveItems = await ContentModel.findLiveByTeacher(teacher.id);

    // Edge case: no approved/live content
    if (!liveItems || liveItems.length === 0) {
      return { available: false, content: null, message: 'No content available.' };
    }

    // Apply scheduling / rotation
    const activeContent = getActiveContentForSubject(liveItems, subject || null);

    if (subject) {
      // Single subject filter
      if (!activeContent) {
        return { available: false, content: null, message: 'No content available.' };
      }
      return {
        available: true,
        teacher: { id: teacher.id, name: teacher.name },
        subject: subject.toLowerCase(),
        content: formatContent(activeContent),
        message: 'Content retrieved successfully.',
      };
    }

    // All subjects
    if (!Array.isArray(activeContent) || activeContent.length === 0) {
      return { available: false, content: null, message: 'No content available.' };
    }

    return {
      available: true,
      teacher: { id: teacher.id, name: teacher.name },
      content: activeContent.map(formatContent),
      message: 'Content retrieved successfully.',
    };
  }
}

/**
 * Strip internal fields before sending to public API.
 */
function formatContent(item) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    subject: item.subject,
    file_url: item.file_url,
    file_type: item.file_type,
    rotation_duration_minutes: item.rotation_duration,
    active_until: computeActiveUntil(item),
  };
}

/**
 * Compute when the current rotation slot ends for this item.
 * (helpful for client-side countdown/refresh)
 */
function computeActiveUntil(item) {
  try {
    const durationMs = (item.rotation_duration || 5) * 60 * 1000;
    const epoch = new Date(item.start_time).getTime();
    const now = Date.now();
    const elapsed = (now - epoch) % durationMs;
    const remainingMs = durationMs - elapsed;
    return new Date(now + remainingMs).toISOString();
  } catch {
    return null;
  }
}

module.exports = BroadcastService;
