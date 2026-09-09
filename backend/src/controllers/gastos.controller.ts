import { Request, Response } from 'express';
import { GastosService } from '../services/gastos.service';
import { CategoriaGasto, CategoriaGastoType, MetodoGasto, MetodoGastoType } from '../entities/Gasto';
import { AppDataSource } from '../config/database';
import { Ingreso } from '../entities/Ingreso';
import { Gasto } from '../entities/Gasto';

function esFechaFutura(fecha: string): boolean {
  if (!fecha) return false;
  const hoy = new Date().toISOString().split('T')[0];
  const soloFecha = String(fecha).split('T')[0];
  return soloFecha > hoy;
}

async function validarSaldoSuficiente(userId: number, montoNuevo: number, gastoIdExcluir?: number): Promise<{ ok: boolean; disponible: number; totalIngresos: number; totalGastos: number }> {
  const ingresoRepo = AppDataSource.getRepository(Ingreso);
  const gastoRepo = AppDataSource.getRepository(Gasto);
  const ingresos = await ingresoRepo.find({ where: { userId } });
  const gastos = await gastoRepo.find({ where: { userId } });
  const totalIngresos = ingresos.reduce((s, i) => s + Number(i.monto), 0);
  let totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0);
  if (gastoIdExcluir) {
    const existente = gastos.find(g => g.id === gastoIdExcluir);
    if (existente) totalGastos -= Number(existente.monto);
  }
  const disponible = totalIngresos - totalGastos;
  return { ok: montoNuevo <= disponible, disponible, totalIngresos, totalGastos };
}

const service = new GastosService();

function getUserId(req: Request): number {
  const user = (req as any).user;
  return user?.id;
}

export const GastosController = {
  async crear(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const { descripcion, monto, categoria, fecha, metodo } = req.body;

      if (!descripcion || monto === undefined || !fecha) {
        return res.status(400).json({
          success: false,
          message: 'descripcion, monto y fecha son requeridos',
        });
      }

      if (monto <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0',
        });
      }

      if (esFechaFutura(fecha)) {
        return res.status(400).json({
          success: false,
          message: 'No se puede registrar un gasto con fecha futura',
        });
      }

      const saldo = await validarSaldoSuficiente(userId, Number(monto));
      if (!saldo.ok) {
        return res.status(400).json({
          success: false,
          message: `Saldo insuficiente. Disponible Q${saldo.disponible.toFixed(2)} (Ingresos Q${saldo.totalIngresos.toFixed(2)} - Gastos Q${saldo.totalGastos.toFixed(2)}). No puedes gastar Q${Number(monto).toFixed(2)}`,
        });
      }

      const catValidas = Object.values(CategoriaGasto) as string[];
      if (categoria && !catValidas.includes(categoria)) {
        return res.status(400).json({
          success: false,
          message: `Categoria invalida. Opciones: ${catValidas.join(', ')}`,
        });
      }

      const metodoValido = Object.values(MetodoGasto) as string[];
      if (metodo && !metodoValido.includes(metodo)) {
        return res.status(400).json({
          success: false,
          message: `Metodo invalido. Opciones: ${metodoValido.join(', ')}`,
        });
      }

      const gasto = await service.crear({
        descripcion,
        monto,
        categoria: (categoria as CategoriaGastoType) || CategoriaGasto.OTROS,
        metodo: (metodo as MetodoGastoType) || MetodoGasto.EFECTIVO,
        fecha,
        userId,
      });

      return res.status(201).json({
        success: true,
        message: 'Gasto registrado exitosamente',
        data: gasto,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear gasto';
      return res.status(500).json({ success: false, message });
    }
  },

  async listar(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const mes = req.query.mes ? Number(req.query.mes) : undefined;
      const anio = req.query.anio ? Number(req.query.anio) : undefined;

      const gastos = await service.listar(userId, mes, anio);
      return res.json({ success: true, data: gastos });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al listar gastos';
      return res.status(500).json({ success: false, message });
    }
  },

  async obtener(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const gasto = await service.obtenerPorId(id, userId);

      if (!gasto) {
        return res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      }

      return res.json({ success: true, data: gasto });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener gasto';
      return res.status(500).json({ success: false, message });
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const { descripcion, monto, categoria, fecha, metodo } = req.body;

      if (fecha && esFechaFutura(fecha)) {
        return res.status(400).json({
          success: false,
          message: 'No se puede registrar un gasto con fecha futura',
        });
      }

      if (monto !== undefined) {
        const m = Number(monto);
        if (m <= 0) {
          return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
        }
        const saldo = await validarSaldoSuficiente(userId, m, id);
        if (!saldo.ok) {
          return res.status(400).json({
            success: false,
            message: `Saldo insuficiente. Disponible Q${saldo.disponible.toFixed(2)} (Ingresos Q${saldo.totalIngresos.toFixed(2)} - Gastos Q${saldo.totalGastos.toFixed(2)}). No puedes gastar Q${m.toFixed(2)}`,
          });
        }
      }

      if (categoria) {
        const catValidas = Object.values(CategoriaGasto) as string[];
        if (!catValidas.includes(categoria)) {
          return res.status(400).json({
            success: false,
            message: `Categoria invalida. Opciones: ${catValidas.join(', ')}`,
          });
        }
      }

      if (metodo) {
        const metodoValido = Object.values(MetodoGasto) as string[];
        if (!metodoValido.includes(metodo)) {
          return res.status(400).json({
            success: false,
            message: `Metodo invalido. Opciones: ${metodoValido.join(', ')}`,
          });
        }
      }

      const gasto = await service.actualizar(id, userId, {
        descripcion,
        monto,
        categoria,
        fecha,
        metodo,
      });

      if (!gasto) {
        return res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      }

      return res.json({
        success: true,
        message: 'Gasto actualizado',
        data: gasto,
      });
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

      if (!ok) {
        return res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      }

      return res.json({ success: true, message: 'Gasto eliminado' });
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
