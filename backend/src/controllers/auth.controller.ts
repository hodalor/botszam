import type { RequestHandler } from 'express';
import { authUserId } from '../middleware/auth';
import { validated } from '../middleware/validate';
import {
  clearSession,
  getUser,
  issueSession,
  loginUser,
  registerUser,
  updateUser,
} from '../services/auth.service';
import { loginSchema, registerSchema, updateMeSchema } from '../validators/auth.validators';

export const register: RequestHandler = async (req, res) => {
  const user = await registerUser(validated(registerSchema, req.body));
  const token = issueSession(res, user);
  res.status(201).json({ user, token });
};

export const login: RequestHandler = async (req, res) => {
  const user = await loginUser(validated(loginSchema, req.body));
  const token = issueSession(res, user);
  res.json({ user, token });
};

export const logout: RequestHandler = (_req, res) => {
  clearSession(res);
  res.status(204).end();
};

export const me: RequestHandler = async (req, res) => {
  res.json({ user: await getUser(authUserId(req)) });
};

export const updateMe: RequestHandler = async (req, res) => {
  const user = await updateUser(authUserId(req), validated(updateMeSchema, req.body));
  res.json({ user });
};
