const Role = require('../models/Role');
const { logActivity } = require('./activityController');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create a role
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const roleExists = await Role.findOne({ name });
    if (roleExists) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }

    const role = await Role.create({
      name,
      description,
      permissions
    });

    res.status(201).json({ success: true, data: role });

    // Log activity
    if (req.user) {
      await logActivity(req.user._id, req.user.username, 'Create Role', role.name, `Created role ${role.name}`, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const changes = [];
    const oldName = role.name;

    // Track Name/Description changes
    if (req.body.name && req.body.name !== role.name) {
      changes.push(`name (${role.name} -> ${req.body.name})`);
    }
    if (req.body.description && req.body.description !== role.description) {
      changes.push(`description updated`);
    }

    // Track Permission changes
    if (req.body.permissions) {
      Object.keys(req.body.permissions).forEach(key => {
        const oldValue = !!role.permissions[key];
        const newValue = !!req.body.permissions[key];
        if (oldValue !== newValue) {
          changes.push(`${key} (${oldValue} -> ${newValue})`);
        }
      });
    }

    // Update fields
    Object.assign(role, req.body);
    await role.save();

    res.status(200).json({ success: true, data: role });

    // Log detailed activity
    if (req.user) {
      const details = changes.length > 0 ? `Changes: ${changes.join(', ')}` : `Updated role ${oldName} (no changes)`;
      await logActivity(req.user._id, req.user.username, 'Edit Role', oldName, details, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating role', error: error.message });
  }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.status(200).json({ success: true, message: 'Role deleted successfully' });

    // Log activity
    if (req.user) {
      await logActivity(req.user._id, req.user.username, 'Delete Role', role.name, `Deleted role ${role.name}`, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting role', error: error.message });
  }
};

// @desc    Get single role by name
// @route   GET /api/roles/name/:name
// @access  Private
exports.getRoleByName = async (req, res) => {
    try {
      const role = await Role.findOne({ name: req.params.name });
      
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }
      
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Error fetching role', error: error.message });
    }
  };
