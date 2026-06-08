import { Router } from 'express';
import { exportTransactions } from '../controllers';
import { validate } from '../../../middlewares';
import { exportTransactionsSchema } from '../validators';

const router = Router();

router.get('/transactions', validate(exportTransactionsSchema, 'query'), exportTransactions);

export const exportRoutes = router;