import { Router } from 'express';
import { register, login, getProfile } from '../controllers';
import { validate } from '../../../middlewares';
import { registerSchema, loginSchema } from '../validators';
import { authGuard } from '../services/authGuard';
import { asyncHandler } from '../../../utils';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.get('/me', authGuard, asyncHandler(getProfile));

export const authRoutes = router;