import express from 'express';
import { loginUser } from '../api/login';
import { createUser } from '../api/signup';
import { verifyUser } from '../api/emailverifier';
import { checkAuth } from '../api/checkauth';


const router = express.Router();


router.post('/login', loginUser);
router.post('/checkauth', checkAuth);
router.post('/users', createUser);
router.post('/verify', verifyUser);


export default router;