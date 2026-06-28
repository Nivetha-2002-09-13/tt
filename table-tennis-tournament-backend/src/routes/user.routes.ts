import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isSuperAdminForAdmins, restrictTo } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
    getMyProfile,
    updateMyProfile,
    getAllUsers,
    getUserById,
    updateUserRole,
    getPublicProfile,
    getPublicPlayers,
    deleteUser,
} from '../controllers/user.controller';
import { updateProfileSchema, updateUserRoleSchema } from '../validations/user.validation';
import { upload } from '../middleware/upload.middleware';
import { uploadProfileImage } from '../controllers/user.controller';
import { recordProfileView } from '../controllers/user.controller';
import { isSuperAdmin } from '../middleware/role.middleware';
import { updatePlayerRanking } from '../controllers/user.controller';
import { uploadPaymentReceipt } from '../controllers/user.controller';

const router = Router();

router.get('/public/players' , getPublicPlayers);
router.get('/public/:id' , getPublicProfile);

// All routes require authentication
router.use(authenticate);

router.post(
  '/upload-profile-image',
  authenticate,
  upload.single('profileImage'),
  uploadProfileImage
);

router.post(
  '/upload-payment-receipt',
  authenticate,
  upload.single('paymentReceipt'),
  uploadPaymentReceipt
);

// Profile routes (authenticated users)
router.get('/profile', getMyProfile);
router.patch('/profile', validate(updateProfileSchema), updateMyProfile);

// Admin only routes
router.get('/', isAdmin, getAllUsers);
router.get('/:id', isAdmin, getUserById);
router.patch('/:id/role',authenticate, isAdmin, isSuperAdminForAdmins, updateUserRole);
router.delete('/:id',authenticate, isAdmin,isSuperAdminForAdmins, deleteUser);
router.patch('/:id/ranking',authenticate,isAdmin,updatePlayerRanking);
router.post('/:userId/profile-view', authenticate, recordProfileView);

export default router;