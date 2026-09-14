import { Router } from 'express';
import { IngresosController } from '../controllers/ingresos.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(AuthMiddleware.authenticate);

router.get('/resumen', IngresosController.resumen);
router.get('/', IngresosController.listar);
router.get('/:id', IngresosController.obtener);
router.post('/', IngresosController.crear);
router.put('/:id', IngresosController.actualizar);
router.delete('/:id', IngresosController.eliminar);

export default router;
