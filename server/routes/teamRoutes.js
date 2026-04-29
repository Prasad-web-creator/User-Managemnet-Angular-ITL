const express = require('express');
const router = express.Router();
const {
  getTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  deleteMultipleTeams
} = require('../controllers/teamController');

router.route('/')
  .get(getTeams)
  .post(createTeam);

router.post('/delete-multiple', deleteMultipleTeams);

router.route('/:id')
  .get(getTeam)
  .put(updateTeam)
  .delete(deleteTeam);

module.exports = router;
