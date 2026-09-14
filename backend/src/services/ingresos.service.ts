import { AppDataSource } from '../config/database';
import { Ingreso, CategoriaIngresoType } from '../entities/Ingreso';
import { Repository } from 'typeorm';

export class IngresosService {
  private repo: Repository<Ingreso>;

  constructor() {
    this.repo = AppDataSource.getRepository(Ingreso);
  }

  async crear(data: {
    descripcion: string;
    monto: number;
    categoria: CategoriaIngresoType;
    fecha: string;
    userId: number;
  }) {
    const ingreso = this.repo.create(data);
    return this.repo.save(ingreso);
  }

  async listar(userId: number, mes?: number, anio?: number) {
    const qb = this.repo
      .createQueryBuilder('i')
      .where('i.user_id = :userId', { userId })
      .orderBy('i.fecha', 'DESC');

    if (mes !== undefined && anio !== undefined) {
      qb.andWhere('EXTRACT(MONTH FROM i.fecha) = :mes', { mes });
      qb.andWhere('EXTRACT(YEAR FROM i.fecha) = :anio', { anio });
    } else if (anio !== undefined) {
      qb.andWhere('EXTRACT(YEAR FROM i.fecha) = :anio', { anio });
    }

    return qb.getMany();
  }

  async obtenerPorId(id: number, userId: number) {
    return this.repo.findOne({ where: { id, userId } });
  }

  async actualizar(
    id: number,
    userId: number,
    data: Partial<{ descripcion: string; monto: number; categoria: CategoriaIngresoType; fecha: string }>
  ) {
    const ingreso = await this.repo.findOne({ where: { id, userId } });
    if (!ingreso) return null;
    Object.assign(ingreso, data);
    return this.repo.save(ingreso);
  }

  async eliminar(id: number, userId: number) {
    const ingreso = await this.repo.findOne({ where: { id, userId } });
    if (!ingreso) return false;
    await this.repo.remove(ingreso);
    return true;
  }

  async resumen(userId: number) {
    const ingresos = await this.repo.find({ where: { userId } });

    const totalIngresos = ingresos.reduce((s, i) => s + Number(i.monto), 0);

    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const partesFecha = (fecha: string) => {
      const p = fecha.split('-');
      return { y: Number(p[0]), m: Number(p[1]) };
    };

    const ingresosMes = ingresos.filter((i) => {
      const { y, m } = partesFecha(i.fecha);
      return m === mesActual && y === anioActual;
    });
    const totalMes = ingresosMes.reduce((s, i) => s + Number(i.monto), 0);

    const ingresosAnio = ingresos.filter((i) => {
      const { y } = partesFecha(i.fecha);
      return y === anioActual;
    });
    const totalAnio = ingresosAnio.reduce((s, i) => s + Number(i.monto), 0);

    const porCategoria: Record<string, number> = {};
    ingresos.forEach((i) => {
      const cat = i.categoria;
      porCategoria[cat] = (porCategoria[cat] || 0) + Number(i.monto);
    });

    const mesesMap: Record<string, number> = {};
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    ingresos.forEach((i) => {
      const { y, m } = partesFecha(i.fecha);
      const key = `${y}-${String(m).padStart(2, '0')}`;
      mesesMap[key] = (mesesMap[key] || 0) + Number(i.monto);
    });

    const ingresosMensuales = nombresMeses.map((nombre, i) => {
      const key = `${anioActual}-${String(i + 1).padStart(2, '0')}`;
      return { mes: nombre, monto: mesesMap[key] || 0 };
    });

    return {
      totalIngresos,
      totalMes,
      totalAnio,
      porCategoria,
      ingresosMensuales,
      cantidadIngresos: ingresos.length,
    };
  }
}
