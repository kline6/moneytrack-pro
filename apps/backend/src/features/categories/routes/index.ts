import { Router } from 'express';
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers';
import { validate } from '../../../middlewares';
import { createCategorySchema, updateCategorySchema } from '../validators';

const router = Router();

router.get('/', listCategories);
router.get('/:id', getCategory);
router.post('/', validate(createCategorySchema), createCategory);
router.patch('/:id', validate(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export const categoryRoutes = router;