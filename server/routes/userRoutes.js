const express = require('express');
const { getUsers, createUser, getUser, loginUser, updateUser, deleteUser, deleteMultipleUsers, resetPassword } = require('../controllers/userController');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');


const router = express.Router();


router.post('/login', loginUser);
router.post('/reset-password', resetPassword);

// Apply protection to all routes below
router.use(protect);

router.route('/')
  .get(checkPermission('viewUsers'), getUsers)
  .post(checkPermission('addUser'), createUser);

router.delete('/delete-multiple', checkPermission('deleteUsers'), deleteMultipleUsers);

router.route('/:id')
  .get(checkPermission('viewUsers'), getUser)
  .put(checkPermission('editUsers'), updateUser)
  .delete(checkPermission('deleteUsers'), deleteUser);


module.exports = router;

