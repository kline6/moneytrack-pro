import { Router } from 'express';
import { submitEvents, listEvents, getConflicts, resolveConflict } from '../controllers';
import { validate } from '../../../middlewares';
import { syncBatchSchema, resolveConflictSchema } from '../validators';

const router = Router();
router.post('/submit', validate(syncBatchSchema), submitEvents);
router.get('/events', listEvents);
router.get('/conflicts', getConflicts);
router.post('/resolve', validate(resolveConflictSchema), resolveConflict);

export const syncRoutes = router;
