const Activity = require('../models/Activity');

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private/Admin
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(100); // Limit to last 100 for performance

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error fetching activity log', error: error.message });
  }
};

// Helper for other controllers to log activity
exports.logActivity = async (userId, username, action, target, details, ip) => {
  try {
    await Activity.create({
      user: userId,
      username,
      action,
      target,
      details,
      ip
    });
  } catch (error) {
    console.error('Activity Logging Error:', error.message);
  }
};
