import express from 'express';
import {
    registerUser,
    loginUser,
    getMe,
    getWorkers,
    updateWorker,
    deleteWorker,
    updateMe
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/workers', protect, admin, getWorkers);
router.route('/workers/:id').put(protect, admin, updateWorker).delete(protect, admin, deleteWorker);
router.put('/profile', protect, updateMe);

export default router;
