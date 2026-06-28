import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  addCategory,
  getTournamentCategories,
} from '../controllers/tournament.controller';
import {
  createTournamentSchema,
  updateTournamentSchema,
  addCategorySchema,
} from '../validations/tournament.validation';

import { updateCategory, deleteCategory, generateDraws } from '../controllers/tournament.controller';

const router = Router();

// Public routes (require authentication but not admin)
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);
router.get('/:tournamentId/categories', getTournamentCategories);

// Admin only routes
router.post('/', authenticate, isAdmin, validate(createTournamentSchema), createTournament);
router.patch('/:id', authenticate, isAdmin, validate(updateTournamentSchema), updateTournament);
router.delete('/:id', authenticate, isAdmin, deleteTournament);
router.post('/:tournamentId/categories', authenticate, isAdmin, validate(addCategorySchema), addCategory);

router.patch('/categories/:categoryId', authenticate, isAdmin, updateCategory);
router.delete('/categories/:categoryId', authenticate, isAdmin, deleteCategory);

router.post('/:id/generate-draws', authenticate, isAdmin, generateDraws);

export default router;