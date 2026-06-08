import { Router } from 'express';
import { getDashboard, getMonthlyReport, getTrend, getSmartInsights } from '../controllers';

const router = Router();

router.get('/dashboard', getDashboard);
router.get('/monthly', getMonthlyReport);
router.get('/trend', getTrend);
router.get('/smart-insights', getSmartInsights);

export const analyticsRoutes = router;