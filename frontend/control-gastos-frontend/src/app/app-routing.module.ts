import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'ingresos',
    loadComponent: () => import('./dashboard/ingresos/ingresos.component').then(m => m.IngresosComponent)
  },
  {
    path: 'gastos',
    loadComponent: () => import('./dashboard/gastos/gastos.component').then(m => m.GastosComponent)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./dashboard/perfil/perfil.component').then(m => m.PerfilComponent)
  },
  {
    path: 'ahorros',
    loadComponent: () => import('./dashboard/ahorros/ahorros.component').then(m => m.AhorrosComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }