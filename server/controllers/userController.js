const User = require('../models/User');
const Role = require('../models/Role');
const { logActivity } = require('./activityController');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Public
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, username, password, role, department, status, joiningDate, profileImage, address } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      username,
      password,
      role,
      department,
      status,
      joiningDate,
      profileImage,
      address
    });

    res.status(201).json({ success: true, data: user });

    // Log activity with details
    if (req.user) {
      const details = `Created new user: ${user.username} (Role: ${user.role}, Dept: ${user.department})`;
      await logActivity(req.user._id, req.user.username, 'Create User', user.username, details, req.ip);
    }
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
  }
};


// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid User ID', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an username and password' });
    }

    // Check for user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Fetch role permissions
    const roleDoc = await Role.findOne({ name: user.role });

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        department: user.department,
        profileImage: user.profileImage,
        address: user.address,
        permissions: roleDoc ? roleDoc.permissions : null
      }
    });

    // Log login activity
    await logActivity(user._id, user.username, 'Login', 'System', `User ${user.username} logged in`, req.ip);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
exports.updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Don't update password if it's empty
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Detect changes for logging
    const changes = [];
    const fieldsToTrack = ['fullName', 'email', 'phoneNumber', 'role', 'department', 'status', 'username', 'joiningDate', 'address'];
    
    fieldsToTrack.forEach(field => {
      if (updateData[field] !== undefined) {
        // Compare values (normalization for dates or nulls)
        const oldValue = user[field] ? String(user[field]) : 'N/A';
        const newValue = String(updateData[field]);
        
        if (oldValue !== newValue) {
          changes.push(`${field} (${oldValue} -> ${newValue})`);
        }
        user[field] = updateData[field];
      }
    });

    // Also handle password separately (just log that it changed)
    if (updateData.password) {
      changes.push('password (updated)');
      user.password = updateData.password;
    }

    if (updateData.profileImage !== undefined) {
      if (user.profileImage !== updateData.profileImage) {
        changes.push('profile picture (updated)');
      }
      user.profileImage = updateData.profileImage;
    }

    await user.save();

    res.status(200).json({ success: true, data: user });

    // Log detailed activity
    if (req.user) {
      const details = changes.length > 0 ? `Changes: ${changes.join(', ')}` : `Updated user ${user.username} (no fields changed)`;
      await logActivity(req.user._id, req.user.username, 'Edit User', user.username, details, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });

    // Log activity
    if (req.user) {
      await logActivity(req.user._id, req.user.username, 'Delete User', user.username, `Deleted user ${user.username}`, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

// @desc    Delete multiple users
// @route   DELETE /api/users/multiple
// @access  Public
exports.deleteMultipleUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of user IDs' });
    }

    const result = await User.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ 
      success: true, 
      message: `${result.deletedCount} users deleted successfully`,
      deletedCount: result.deletedCount
    });

    // Log activity
    if (req.user) {
      await logActivity(req.user._id, req.user.username, 'Delete Multiple Users', 'Multiple', `Deleted ${result.deletedCount} users`, req.ip);
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting multiple users', error: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email and new password' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error resetting password', error: error.message });
  }
};
