import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/refresh', AuthController.refresh);
router.patch('/perfil', AuthController.actualizarPerfil);
router.put('/cambiar-password', AuthController.cambiarPassword);

export default router;