import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, Subject } from 'rxjs';

export interface Gasto {
  id: number;
  descripcion: string;
  monto: number;
  categoria: string;
  metodo: string;
  fecha: string;
  createdAt: string;
}

export interface Resumen {
  totalGastado: number;
  totalMes: number;
  totalAnio: number;
  porCategoria: Record<string, number>;
  gastosMensuales: { mes: string; monto: number }[];
  cantidadGastos: number;
}

export interface Ingreso {
  id: number;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  createdAt: string;
}

export interface ResumenIngresos {
  totalIngresos: number;
  totalMes: number;
  totalAnio: number;
  porCategoria: Record<string, number>;
  ingresosMensuales: { mes: string; monto: number }[];
  cantidadIngresos: number;
}

@Injectable({ providedIn: 'root' })
export class GastosService {
  private api = 'http://localhost:3000/api/gastos';
  private apiIngresos = 'http://localhost:3000/api/ingresos';

  private datosCambiaron = new Subject<void>();
  public datosCambiaron$ = this.datosCambiaron.asObservable();

  constructor(private http: HttpClient) {}

  emitirCambios(): void {
    this.datosCambiaron.next();
  }

  // ===== Gastos =====
  listar(mes?: number, anio?: number): Observable<Gasto[]> {
    let url = this.api;
    const params: string[] = [];
    if (mes) params.push(`mes=${mes}`);
    if (anio) params.push(`anio=${anio}`);
    if (params.length) url += '?' + params.join('&');

    return this.http.get<any>(url).pipe(
      map(r => r.data || [])
    );
  }

  crear(data: { descripcion: string; monto: number; categoria: string; metodo?: string; fecha: string }): Observable<Gasto> {
    return this.http.post<any>(this.api, data).pipe(
      map(r => r.data)
    );
  }

  actualizar(id: number, data: Partial<Gasto>): Observable<Gasto> {
    return this.http.put<any>(`${this.api}/${id}`, data).pipe(
      map(r => r.data)
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`);
  }

  resumen(): Observable<Resumen> {
    return this.http.get<any>(`${this.api}/resumen`).pipe(
      map(r => r.data)
    );
  }

  // ===== Ingresos =====
  listarIngresos(mes?: number, anio?: number): Observable<Ingreso[]> {
    let url = this.apiIngresos;
    const params: string[] = [];
    if (mes) params.push(`mes=${mes}`);
    if (anio) params.push(`anio=${anio}`);
    if (params.length) url += '?' + params.join('&');

    return this.http.get<any>(url).pipe(
      map(r => r.data || [])
    );
  }

  crearIngreso(data: { descripcion: string; monto: number; categoria: string; fecha: string }): Observable<Ingreso> {
    return this.http.post<any>(this.apiIngresos, data).pipe(
      map(r => r.data)
    );
  }

  actualizarIngreso(id: number, data: Partial<Ingreso>): Observable<Ingreso> {
    return this.http.put<any>(`${this.apiIngresos}/${id}`, data).pipe(
      map(r => r.data)
    );
  }

  eliminarIngreso(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiIngresos}/${id}`);
  }

  resumenIngresos(): Observable<ResumenIngresos> {
    return this.http.get<any>(`${this.apiIngresos}/resumen`).pipe(
      map(r => r.data)
    );
  }
}
