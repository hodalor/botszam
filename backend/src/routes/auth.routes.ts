import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema, updateMeSchema } from '../validators/auth.validators';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), auth.register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), auth.login);
authRouter.post('/logout', auth.logout);
authRouter.get('/me', requireAuth, auth.me);
authRouter.patch('/me', authLimiter, requireAuth, validate({ body: updateMeSchema }), auth.updateMe);
