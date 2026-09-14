import { Request, Response } from 'express';
import { IngresosService } from '../services/ingresos.service';
import { CategoriaIngreso, CategoriaIngresoType } from '../entities/Ingreso';

function esFechaFutura(fecha: string): boolean {
  if (!fecha) return false;
  const hoy = new Date().toISOString().split('T')[0];
  const soloFecha = String(fecha).split('T')[0];
  return soloFecha > hoy;
}

const service = new IngresosService();

function getUserId(req: Request): number {
  const user = (req as any).user;
  return user?.id;
}

export const IngresosController = {
  async crear(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const { descripcion, monto, categoria, fecha } = req.body;

      if (!descripcion || monto === undefined || !fecha) {
        return res.status(400).json({
          success: false,
          message: 'descripcion, monto y fecha son requeridos',
        });
      }

      if (monto <= 0) {
        return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
      }

      if (esFechaFutura(fecha)) {
        return res.status(400).json({ success: false, message: 'No se puede registrar un ingreso con fecha futura' });
      }

      const catValidas = Object.values(CategoriaIngreso) as string[];
      if (categoria && !catValidas.includes(categoria)) {
        return res.status(400).json({ success: false, message: `Categoria invalida: ${catValidas.join(', ')}` });
      }

      const ingreso = await service.crear({
        descripcion,
        monto,
        categoria: (categoria as CategoriaIngresoType) || CategoriaIngreso.OTROS,
        fecha,
        userId,
      });

      return res.status(201).json({ success: true, message: 'Ingreso registrado', data: ingreso });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear ingreso';
      return res.status(500).json({ success: false, message });
    }
  },

  async listar(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const mes = req.query.mes ? Number(req.query.mes) : undefined;
      const anio = req.query.anio ? Number(req.query.anio) : undefined;
      const ingresos = await service.listar(userId, mes, anio);
      return res.json({ success: true, data: ingresos });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar ingresos';
      return res.status(500).json({ success: false, message });
    }
  },

  async obtener(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const ingreso = await service.obtenerPorId(id, userId);
      if (!ingreso) return res.status(404).json({ success: false, message: 'Ingreso no encontrado' });
      return res.json({ success: true, data: ingreso });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener ingreso';
      return res.status(500).json({ success: false, message });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const { descripcion, monto, categoria, fecha } = req.body;

      if (fecha && esFechaFutura(fecha)) {
        return res.status(400).json({ success: false, message: 'No se puede registrar un ingreso con fecha futura' });
      }

      if (monto !== undefined && Number(monto) <= 0) {
        return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
      }

      if (categoria) {
        const catValidas = Object.values(CategoriaIngreso) as string[];
        if (!catValidas.includes(categoria)) {
          return res.status(400).json({ success: false, message: `Categoria invalida: ${catValidas.join(', ')}` });
        }
      }

      const ingreso = await service.actualizar(id, userId, { descripcion, monto, categoria, fecha });
      if (!ingreso) return res.status(404).json({ success: false, message: 'Ingreso no encontrado' });
      return res.json({ success: true, message: 'Ingreso actualizado', data: ingreso });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar';
      return res.status(500).json({ success: false, message });
    }
  },

  async eliminar(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const ok = await service.eliminar(id, userId);
      if (!ok) return res.status(404).json({ success: false, message: 'Ingreso no encontrado' });
      return res.json({ success: true, message: 'Ingreso eliminado' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar';
      return res.status(500).json({ success: false, message });
    }
  },

  async resumen(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const data = await service.resumen(userId);
      return res.json({ success: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener resumen';
      return res.status(500).json({ success: false, message });
    }
  },
};
