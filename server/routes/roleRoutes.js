const express = require('express');
const router = express.Router();
const { getRoles, createRole, updateRole, deleteRole, getRoleByName } = require('../controllers/roleController');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');

// Check if user has any of the permissions that require seeing the role list
const canSeeRoles = (req, res, next) => {
    const permissions = ['roles', 'addUser', 'editUsers', 'viewUsers'];
    const Role = require('../models/Role');
    Role.findOne({ name: req.user.role }).then(roleDoc => {
        if (!roleDoc) return res.status(403).json({ success: false, message: 'Role not found' });
        const hasAny = permissions.some(p => roleDoc.permissions[p] === true);
        if (hasAny) return next();
        return res.status(403).json({ success: false, message: 'Permission denied: roles access required.' });
    }).catch(err => res.status(500).json({ success: false, message: 'Server Error' }));
};

router.get('/', protect, canSeeRoles, getRoles);
router.post('/', protect, checkPermission('roles'), createRole);
router.put('/:id', protect, checkPermission('roles'), updateRole);
router.delete('/:id', protect, checkPermission('roles'), deleteRole);
router.get('/name/:name', protect, getRoleByName);

module.exports = router;
