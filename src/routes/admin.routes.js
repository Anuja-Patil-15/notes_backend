import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getDashboardStats, getAllUsers, deleteUser } from '../controllers/admin.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.delete('/users/:userId', deleteUser);

export default router;
