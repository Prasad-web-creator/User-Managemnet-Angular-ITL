const Team = require('../models/Team');
const { logActivity } = require('./activityController');

// @desc    Get all teams with pagination, filtering, and sorting
// @route   GET /api/teams
// @access  Public
exports.getTeams = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'createdAt:desc', 
      search = '',
      involvedUser = ''
    } = req.query;

    const query = {};

    // involvedUser filter (PM, Leader, or Member)
    if (involvedUser) {
      query.$or = [
        { projectManager: involvedUser },
        { leader: involvedUser },
        { members: involvedUser }
      ];
    }

    // 1. Search (Team Name or Project Name)
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      if (query.$or) {
        // If we already have $or (from involvedUser), we need to $and it with the search $or
        // Or more simply, just check if search applies to name or projectName
        query.name = searchRegex; // Simplified for now, or use $and
      } else {
        query.$or = [
          { name: searchRegex },
          { projectName: searchRegex }
        ];
      }
    }

    // 2. Sorting
    let sortOptions = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    }

    // 3. Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Team.countDocuments(query);
    const teams = await Team.find(query)
      .populate('leader', 'fullName username')
      .populate('projectManager', 'fullName username')
      .populate('members', 'fullName username')
      .populate('tasks.user', 'fullName username')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({ 
      success: true, 
      data: teams,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const { name, projectName, leader, projectManager, members } = req.body;
    
    // Server-side validation (Business Logic)
    if (leader === projectManager) {
      return res.status(400).json({ success: false, message: 'Team Leader cannot be the same as Project Manager' });
    }
    if (members.includes(projectManager)) {
      return res.status(400).json({ success: false, message: 'Project Manager cannot be a team member' });
    }
    if (members.includes(leader)) {
      return res.status(400).json({ success: false, message: 'Team Leader cannot be a team member' });
    }

    const teamExists = await Team.findOne({ name });
    if (teamExists) {
      return res.status(400).json({ success: false, message: 'Team already exists with this name' });
    }

    const team = await Team.create({ name, projectName, leader, projectManager, members, tasks: [] });
    const populatedTeam = await Team.findById(team._id).populate('leader', 'fullName username').populate('projectManager', 'fullName username').populate('members', 'fullName username').populate('tasks.user', 'fullName username');

    res.status(201).json({ success: true, data: populatedTeam });

    if (req.user) {
      await logActivity(req.user._id, req.user.username, 'Create Team', team.name, `Created new team: ${team.name}`, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('leader', 'fullName username').populate('projectManager', 'fullName username').populate('members', 'fullName username').populate('tasks.user', 'fullName username');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid Team ID', error: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { name, projectName, leader, projectManager, members } = req.body;

    // Server-side validation (Business Logic)
    if (leader && projectManager && leader === projectManager) {
      return res.status(400).json({ success: false, message: 'Team Leader cannot be the same as Project Manager' });
    }
    if (members && projectManager && members.includes(projectManager)) {
      return res.status(400).json({ success: false, message: 'Project Manager cannot be a team member' });
    }
    if (members && leader && members.includes(leader)) {
      return res.status(400).json({ success: false, message: 'Team Leader cannot be a team member' });
    }

    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('leader', 'fullName username').populate('projectManager', 'fullName username').populate('members', 'fullName username').populate('tasks.user', 'fullName username');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.status(200).json({ success: true, data: team });

    if (req.user) {
      await logActivity(req.user._id, req.user.username, 'Update Team', team.name, `Updated team: ${team.name}`, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating team', error: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.status(200).json({ success: true, message: 'Team deleted successfully' });

    if (req.user) {
      await logActivity(req.user._id, req.user.username, 'Delete Team', team.name, `Deleted team ${team.name}`, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting team', error: error.message });
  }
};

exports.deleteMultipleTeams = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No team IDs provided' });
    }

    const result = await Team.deleteMany({ _id: { $in: ids } });
    
    res.status(200).json({ 
      success: true, 
      message: `${result.deletedCount} teams deleted successfully`,
      deletedCount: result.deletedCount
    });

    if (req.user) {
      await logActivity(req.user._id, req.user.username, 'Delete Multiple Teams', 'Multiple', `Deleted ${result.deletedCount} teams`, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting multiple teams', error: error.message });
  }
};
