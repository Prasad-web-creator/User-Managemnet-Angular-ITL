const express = require('express');
const { getUsers, createUser, getUser, loginUser, updateUser, deleteUser, deleteMultipleUsers, resetPassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');


const router = express.Router();


router.post('/login', loginUser);
router.post('/reset-password', resetPassword);

// Apply protection to all routes below
router.use(protect);

router.route('/')
  .get(authorize('Admin', 'HR'), getUsers)
  .post(authorize('Admin'), createUser);

router.delete('/delete-multiple', authorize('Admin'), deleteMultipleUsers);

router.route('/:id')
  .get(getUser)
  .put(authorize('Admin'), updateUser)
  .delete(authorize('Admin'), deleteUser);


module.exports = router;

