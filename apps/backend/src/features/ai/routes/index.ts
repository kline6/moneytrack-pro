import { Router } from 'express';
import { getMonthlyReport, askQuestion } from '../controllers';
import { validate } from '../../../middlewares';
import { aiMonthlyReportSchema, aiQuestionSchema } from '../validators';

const router = Router();

router.get('/report', validate(aiMonthlyReportSchema, 'query'), getMonthlyReport);
router.post('/ask', validate(aiQuestionSchema), askQuestion);

export const aiRoutes = router;
