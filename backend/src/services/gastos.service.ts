import { AppDataSource } from '../config/database';
import { Gasto, CategoriaGastoType, MetodoGastoType } from '../entities/Gasto';
import { Repository } from 'typeorm';

export class GastosService {
  private repo: Repository<Gasto>;

  constructor() {
    this.repo = AppDataSource.getRepository(Gasto);
  }

  async crear(data: {
    descripcion: string;
    monto: number;
    categoria: CategoriaGastoType;
    fecha: string;
    metodo?: MetodoGastoType;
    userId: number;
  }) {
    const gasto = this.repo.create(data);
    return this.repo.save(gasto);
  }

  async listar(userId: number, mes?: number, anio?: number) {
    const qb = this.repo
      .createQueryBuilder('g')
      .where('g.user_id = :userId', { userId })
      .orderBy('g.fecha', 'DESC');

    if (mes !== undefined && anio !== undefined) {
      qb.andWhere("EXTRACT(MONTH FROM g.fecha) = :mes", { mes });
      qb.andWhere("EXTRACT(YEAR FROM g.fecha) = :anio", { anio });
    } else if (anio !== undefined) {
      qb.andWhere("EXTRACT(YEAR FROM g.fecha) = :anio", { anio });
    }

    return qb.getMany();
  }

  async obtenerPorId(id: number, userId: number) {
    return this.repo.findOne({ where: { id, userId } });
  }

  async actualizar(
    id: number,
    userId: number,
    data: Partial<{ descripcion: string; monto: number; categoria: CategoriaGastoType; fecha: string; metodo: MetodoGastoType }>
  ) {
    const gasto = await this.repo.findOne({ where: { id, userId } });
    if (!gasto) return null;
    const datos: Partial<Gasto> = {};
    if (data.descripcion !== undefined) datos.descripcion = data.descripcion;
    if (data.monto !== undefined) datos.monto = data.monto;
    if (data.categoria !== undefined) datos.categoria = data.categoria;
    if (data.fecha !== undefined) datos.fecha = data.fecha;
    if (data.metodo !== undefined) datos.metodo = data.metodo;
    Object.assign(gasto, datos);
    return this.repo.save(gasto);
  }

  async eliminar(id: number, userId: number) {
    const gasto = await this.repo.findOne({ where: { id, userId } });
    if (!gasto) return false;
    await this.repo.remove(gasto);
    return true;
  }

  async resumen(userId: number) {
    const gastos = await this.repo.find({ where: { userId } });

    const totalGastado = gastos.reduce((s, g) => s + Number(g.monto), 0);

    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const partesFecha = (fecha: string) => {
      const p = fecha.split('-');
      return { y: Number(p[0]), m: Number(p[1]) };
    };

    const gastosMes = gastos.filter((g) => {
      const { y, m } = partesFecha(g.fecha);
      return m === mesActual && y === anioActual;
    });
    const totalMes = gastosMes.reduce((s, g) => s + Number(g.monto), 0);

    const gastosAnio = gastos.filter((g) => {
      const { y } = partesFecha(g.fecha);
      return y === anioActual;
    });
    const totalAnio = gastosAnio.reduce((s, g) => s + Number(g.monto), 0);

    const porCategoria: Record<string, number> = {};
    gastos.forEach((g) => {
      const cat = g.categoria;
      porCategoria[cat] = (porCategoria[cat] || 0) + Number(g.monto);
    });

    const mesesMap: Record<string, number> = {};
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    gastos.forEach((g) => {
      const { y, m } = partesFecha(g.fecha);
      const key = `${y}-${String(m).padStart(2, '0')}`;
      mesesMap[key] = (mesesMap[key] || 0) + Number(g.monto);
    });

    const gastosMensuales = nombresMeses.map((nombre, i) => {
      const key = `${anioActual}-${String(i + 1).padStart(2, '0')}`;
      return { mes: nombre, monto: mesesMap[key] || 0 };
    });

    return {
      totalGastado,
      totalMes,
      totalAnio,
      porCategoria,
      gastosMensuales,
      cantidadGastos: gastos.length,
    };
  }
}
