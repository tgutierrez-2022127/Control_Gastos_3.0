import { Router } from 'express';
import { GastosController } from '../controllers/gastos.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(AuthMiddleware.authenticate);

router.get('/resumen', GastosController.resumen);
router.get('/', GastosController.listar);
router.get('/:id', GastosController.obtener);
router.post('/', GastosController.crear);
router.put('/:id', GastosController.actualizar);
router.delete('/:id', GastosController.eliminar);

export default router;
