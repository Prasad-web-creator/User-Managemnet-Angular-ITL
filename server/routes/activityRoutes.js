const express = require('express');
const { getActivities } = require('../controllers/activityController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('viewUsers'), getActivities); // Reusing viewUsers or could create viewLogs

module.exports = router;
