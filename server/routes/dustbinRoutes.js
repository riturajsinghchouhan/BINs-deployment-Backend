import express from 'express';
import {
    getDustbins,
    getDustbin,
    createDustbin,
    updateDustbin,
    deleteDustbin,
    updateBinFromDevice
} from '../controllers/dustbinController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getDustbins).post(protect, admin, createDustbin);
router.route('/:id').get(protect, getDustbin).put(protect, updateDustbin).delete(protect, admin, deleteDustbin);
router.post('/update-bin', updateBinFromDevice);
export default router;
