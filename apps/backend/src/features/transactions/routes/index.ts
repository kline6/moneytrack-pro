import { Router } from 'express';
import {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  batchUpdateCategory,
  batchDelete,
  mergeTransactions
} from '../controllers';
import { validate } from '../../../middlewares';
import { createTransactionSchema, updateTransactionSchema } from '../validators';
import { batchUpdateCategorySchema, batchDeleteSchema, mergeTransactionsSchema } from '../validators/batch';

const router = Router();

router.get('/', listTransactions);
router.get('/:id', getTransaction);
router.post('/', validate(createTransactionSchema), createTransaction);
router.patch('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);
router.post('/batch-update-category', validate(batchUpdateCategorySchema), batchUpdateCategory);
router.post('/batch-delete', validate(batchDeleteSchema), batchDelete);
router.post('/merge', validate(mergeTransactionsSchema), mergeTransactions);

export const transactionRoutes = router;