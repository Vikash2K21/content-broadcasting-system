/**
 * Scheduling / Rotation Logic
 *
 * How it works:
 * 1. All approved content for a teacher + subject is fetched and sorted by creation order.
 * 2. Each piece of content has a `rotation_duration` (minutes).
 * 3. We calculate a "cycle length" = sum of all durations in the rotation.
 * 4. Using the current time and the earliest `start_time` of content in the group,
 *    we compute `elapsed = (now - epoch) % cycleLength` and walk the slots to find
 *    which content is currently active.
 * 5. If content has an explicit start_time / end_time window, content outside that
 *    window is skipped during rotation selection.
 */

/**
 * Given a list of live content items for a teacher (already filtered: approved,
 * within start_time/end_time), group them by subject and return the currently
 * active item per subject.
 *
 * @param {Array} liveItems - rows from content table (approved, within time window)
 * @returns {Object} { subject: activeContentItem }
 */
const determineActiveContent = (liveItems) => {
  if (!liveItems || liveItems.length === 0) return {};

  // Group by subject
  const bySubject = {};
  for (const item of liveItems) {
    const key = item.subject.toLowerCase();
    if (!bySubject[key]) bySubject[key] = [];
    bySubject[key].push(item);
  }

  const active = {};
  const now = Date.now(); // milliseconds

  for (const [subject, items] of Object.entries(bySubject)) {
    if (items.length === 0) continue;

    // Sort by created_at to keep a stable rotation order
    items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (items.length === 1) {
      // Only one item — it's always active (already verified in time window)
      active[subject] = items[0];
      continue;
    }

    // Calculate total cycle length in milliseconds
    const totalCycleMs = items.reduce((sum, item) => {
      const durationMs = (item.rotation_duration || 5) * 60 * 1000;
      return sum + durationMs;
    }, 0);

    if (totalCycleMs === 0) {
      active[subject] = items[0];
      continue;
    }

    // Use the earliest start_time in this subject group as the rotation epoch
    const epoch = Math.min(
      ...items.map((item) => new Date(item.start_time).getTime())
    );

    // How many ms into the current cycle are we?
    const elapsed = (now - epoch) % totalCycleMs;

    // Walk the slots
    let cursor = 0;
    let chosen = items[0];
    for (const item of items) {
      const durationMs = (item.rotation_duration || 5) * 60 * 1000;
      if (elapsed >= cursor && elapsed < cursor + durationMs) {
        chosen = item;
        break;
      }
      cursor += durationMs;
    }

    active[subject] = chosen;
  }

  return active;
};

/**
 * Get a single active content item for a teacher, optionally filtered by subject.
 *
 * @param {Array} liveItems
 * @param {string|null} subject
 * @returns {Object|null} single content item or null
 */
const getActiveContentForSubject = (liveItems, subject = null) => {
  const active = determineActiveContent(liveItems);

  if (subject) {
    return active[subject.toLowerCase()] || null;
  }

  // Return all active content (one per subject) as array
  return Object.values(active);
};

module.exports = { determineActiveContent, getActiveContentForSubject };
