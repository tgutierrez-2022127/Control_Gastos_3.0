import { Component, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GastosService, Ingreso } from '../../services/gastos.service';
import { AuthService } from '../../auth/auth.service';
import { SesionTimerComponent } from '../sesion-timer.component';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule, SesionTimerComponent],
  template: `
    <div class="app-layout" (click)="cerrarDropdowns()">
      <!-- ===== SIDEBAR ===== -->
      <aside class="sidebar" (click)="$event.stopPropagation()">
        <div class="sidebar-top">
          <div class="sidebar-logo">
            <img src="assets/Logo_Fin.jpg" alt="FinVanguard" class="sidebar-logo-img">
          </div>
          <nav class="sidebar-menu">
            <button class="sidebar-icon" title="Dashboard" (click)="irDashboard()">
              <i class="fas fa-credit-card"></i>
            </button>
            <button class="sidebar-icon active" title="Ingresos">
              <i class="fas fa-university"></i>
            </button>
            <button class="sidebar-icon" title="Gastos" (click)="irGastos()">
              <i class="fas fa-exchange-alt"></i>
            </button>
            <button class="sidebar-icon" title="Ahorros" (click)="irAhorros()">
              <i class="fas fa-piggy-bank"></i>
            </button>
          </nav>
        </div>
        <div class="sidebar-bottom" style="position:relative;width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;">
          <button class="sidebar-icon sidebar-settings" title="Configuración" (click)="toggleSettings($event)">
            <i class="fas fa-cog" [class.spin]="settingsAbierto"></i>
          </button>
          <button class="sidebar-icon sidebar-salir" title="Cerrar sesión" (click)="cerrarSesion()">
            <i class="fas fa-sign-out-alt"></i>
          </button>
          <div class="settings-menu" *ngIf="settingsAbierto" (click)="$event.stopPropagation()">
            <button class="menu-item" (click)="irPerfil()"><i class="fas fa-user-circle"></i> Mi perfil</button>
            <button class="menu-item" (click)="mostrarToast('Soporte: soporte@finvanguard.gt','info'); settingsAbierto=false"><i class="fas fa-headset"></i> Soporte / Ayuda</button>
            <button class="menu-item" (click)="limpiarDatos()"><i class="fas fa-trash-alt"></i> Borrar datos locales</button>
            <div class="menu-divider"></div>
            <button class="menu-item logout" (click)="cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
          </div>
        </div>
      </aside>

      <!-- ===== CONTENT ===== -->
      <div class="content">
        <!-- HEADER -->
        <header class="header">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" placeholder="Buscar concepto..." class="search-input" [(ngModel)]="busqueda" (input)="aplicarFiltro()">
          </div>
          <div class="header-right">
            <div class="notif-wrap" (click)="$event.stopPropagation()">
              <button class="header-action" title="Notificaciones" (click)="toggleNotificaciones()">
                <i class="fas fa-bell"></i>
                <span class="notif-badge" *ngIf="tieneNotificaciones">{{numNotificaciones}}</span>
              </button>
              <div class="notif-dropdown" *ngIf="verNotificaciones">
                <div class="notif-header"><span>Notificaciones</span><button class="notif-clear" (click)="limpiarNotificaciones()">Limpiar</button></div>
                <div class="notif-item" *ngFor="let n of notificaciones">
                  <i class="fas fa-circle" [style.color]="colorIngreso(n.categoria)"></i>
                  <div class="notif-text">
                    <strong>{{n.titulo}}</strong>
                    <span>{{n.detalle}}</span>
                  </div>
                  <span class="notif-time">{{n.hora}}</span>
                </div>
                <div class="notif-empty" *ngIf="sinNotificaciones">Sin notificaciones</div>
              </div>
            </div>
            <div class="notif-wrap" (click)="$event.stopPropagation()">
              <button class="header-action" title="Mensajes" (click)="toggleMensajes()">
                <i class="fas fa-envelope"></i>
                <span class="notif-badge" *ngIf="tieneMensajes" style="background:#3498DB;">{{numMensajes}}</span>
              </button>
              <div class="notif-dropdown" *ngIf="verMensajes">
                <div class="notif-header">Mensajes</div>
                <div class="notif-item" *ngFor="let m of mensajes">
                  <i class="fas fa-user-circle msg-avatar"></i>
                  <div class="notif-text">
                    <strong>{{m.de}}</strong>
                    <span>{{m.texto}}</span>
                  </div>
                  <span class="notif-time">{{m.hora}}</span>
                </div>
              </div>
            </div>
            <app-sesion-timer></app-sesion-timer>
            <div class="profile">
              <div class="profile-photo"><img *ngIf="fotoUsuario" [src]="fotoUsuario" alt="Foto de perfil"><i *ngIf="!fotoUsuario" class="fas fa-user"></i></div>
              <div class="profile-text">
                <span class="profile-greeting">Hola</span>
                <span class="profile-name">{{nombreUsuario}}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- INGRESOS BODY -->
        <main class="dashboard">
          <!-- TITLE ROW -->
          <div class="title-row">
            <div class="title-left">
              <h1 class="main-title">Mis Ingresos</h1>
              <p class="main-subtitle">Controla tus ingresos • Los gráficos se actualizan con cada registro</p>
            </div>
            <div class="title-right">
              <button class="btn-excel" (click)="exportarCSV()">
                <i class="fas fa-file-excel"></i>
                Exportar a Excel
              </button>
              <button class="acceso-btn" (click)="abrirFormulario()">
                <i class="fas fa-plus"></i>
                <span>Agregar ingreso</span>
              </button>
            </div>
          </div>

          <!-- FILA 1: METRICAS -->
          <div class="cards-grid metrics-grid">
            <div class="card metric-card">
              <div class="card-header">
                <span class="card-label">Total de ingresos</span>
                <div class="card-icon yellow-circle"><i class="fas fa-arrow-up"></i></div>
              </div>
              <p class="card-amount green">Q{{totalIngresosStr}}</p>
              <p class="metric-diff positive"><i class="fas fa-layer-group"></i> {{cantidadRegistros}} registros en total</p>
              <p class="metric-hint">Suma de todos tus ingresos registrados</p>
            </div>
            <div class="card metric-card">
              <div class="card-header">
                <span class="card-label">Ingresos este mes</span>
                <div class="card-icon blue-circle"><i class="fas fa-calendar-check"></i></div>
              </div>
              <p class="card-amount green">Q{{ingresosMesStr}}</p>
              <p class="metric-diff muted">{{registrosMes}} registros • {{mesActualNombre}}</p>
              <p class="metric-hint">Solo lo de {{mesActualNombre}} se cuenta para la dona</p>
            </div>
            <div class="card metric-card">
              <div class="card-header">
                <span class="card-label">Ingresos este año</span>
                <div class="card-icon violet-circle"><i class="fas fa-chart-line"></i></div>
              </div>
              <p class="card-amount green">Q{{ingresosAnioStr}}</p>
              <p class="metric-diff muted">{{registrosAnio}} registros • {{anioActual}}</p>
              <p class="metric-hint">Acumulado anual</p>
            </div>
          </div>

          <!-- FILA 2: GRAFICOS -->
          <div class="cards-grid charts-grid">
            <div class="card chart-card chart-7">
              <div class="card-header">
                <div>
                  <span class="card-label">Evolución de ingresos</span>
                  <p class="card-subtitle">Todos los meses del año • verde = mes con ingresos</p>
                </div>
                <span class="month-badge">{{mesActualNombre}} {{anioActual}}</span>
              </div>
              <div class="bar-chart-container">
                <div class="chart-y-axis">
                  <span>Q{{maxMensual}}</span><span>Q{{(maxMensual*0.75)|number:'1.0-0'}}</span><span>Q{{(maxMensual*0.5)|number:'1.0-0'}}</span><span>Q{{(maxMensual*0.25)|number:'1.0-0'}}</span><span>Q0</span>
                </div>
                <div class="bar-chart">
                  <div class="bar-group" *ngFor="let b of barrasEvolucion">
                    <span class="bar-value" *ngIf="tieneMonto(b.monto)">Q{{b.monto|number:'1.0-0'}}</span>
                    <div class="bar" [class.green-bar]="tieneMonto(b.monto)" [class.bar-empty]="!tieneMonto(b.monto)" [style.height.%]="b.altura"><div class="bar-top"></div></div>
                    <span class="bar-label">{{b.etiqueta}}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card chart-card chart-5">
              <div class="card-header">
                <div>
                  <span class="card-label">Distribución por categoría</span>
                  <p class="card-subtitle">Ingresos del mes actual • colores vivos • Q adentro</p>
                </div>
              </div>
              <div class="dona-layout">
                <div class="dona-wrap">
                  <svg viewBox="0 0 200 200" class="dona-svg">
                    <circle class="dona-track" cx="100" cy="100" r="78" />
                    <circle *ngFor="let seg of donaSegmentos" class="dona-seg" cx="100" cy="100" r="78"
                            [attr.stroke]="seg.color" [attr.stroke-dasharray]="seg.dash" [attr.stroke-dashoffset]="seg.offset" />
                    <!-- Labels inside slices Q adentro -->
                    <g *ngFor="let lbl of donaLabels">
                      <text [attr.x]="lbl.x" [attr.y]="lbl.y" text-anchor="middle" dominant-baseline="middle" class="dona-inside-text">
                        <tspan [attr.x]="lbl.x" dy="-6">Q{{lbl.monto}}</tspan>
                        <tspan [attr.x]="lbl.x" dy="12" class="pct">{{lbl.pct}}%</tspan>
                      </text>
                    </g>
                  </svg>
                  <div class="dona-center">
                    <span class="dona-center-label">Este mes</span>
                    <strong>Q{{donaTotalStr}}</strong>
                    <span class="dona-center-hint">{{donaCategorias.length}} categorías</span>
                  </div>
                </div>
                <div class="dona-legend">
                  <div class="legend-row" *ngFor="let c of donaCategorias">
                    <span class="legend-dot" [style.background]="c.color"></span>
                    <span class="legend-name">{{c.nombre}}</span>
                    <span class="legend-val" [style.color]="c.color">Q{{c.monto}}</span>
                    <span class="legend-pct">{{c.pct}}%</span>
                  </div>
                  <div class="legend-empty" *ngIf="donaVacia">
                    <i class="fas fa-chart-pie"></i>
                    <p>Sin ingresos este mes</p>
                    <span>Agrega un ingreso con fecha de {{mesActualNombre}} para ver la rueda</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- FILA 3: TABLAS Y WIDGETS -->
          <div class="cards-grid widgets-grid">
            <div class="card widget-card widget-6">
              <div class="card-header">
                <div>
                  <span class="card-label">Registro de ingresos</span>
                  <p class="card-subtitle">Tus ingresos recientes • {{ingresosFiltrados.length}} de {{ingresos.length}}</p>
                </div>
                <button class="view-all" (click)="verTodos()">{{mostrarTodos ? 'Ver menos' : 'Ver todos'}}</button>
              </div>
              <table class="income-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Categoría</th>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th *ngIf="mostrarTodos">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let g of ingresosVisibles">
                    <td>
                      <span class="dot-row">
                        <span class="cat-dot-table" [style.background]="colorIngreso(g.categoria)"></span>
                        {{g.descripcion}}
                      </span>
                    </td>
                    <td><span class="cat-badge" [style.background]="colorIngreso(g.categoria) + '22'" [style.color]="colorIngreso(g.categoria)">{{g.categoria}}</span></td>
                    <td>{{g.fecha | slice:0:10}}</td>
                    <td class="monto-pos">Q{{g.monto | number:'1.2-2'}}</td>
                    <td *ngIf="mostrarTodos"><button class="row-del" (click)="eliminarIngreso(g)"><i class="fas fa-trash"></i></button></td>
                  </tr>
                  <tr class="empty-row" *ngIf="sinVisibles">
                    <td colspan="5">
                      <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Sin ingresos</p>
                        <span>{{busqueda ? 'No coincide con la búsqueda' : 'Agrega tu primer ingreso con el botón superior'}}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="card widget-card widget-4">
              <div class="card-header">
                <div>
                  <span class="card-label">Metas de ingresos</span>
                  <p class="card-subtitle">Progreso hacia tus objetivos</p>
                </div>
                <button class="view-all" (click)="abrirMetas()" title="Definir metas"><i class="fas fa-pen"></i></button>
              </div>
              <div class="goals-list">
                <div class="goal-item">
                  <div class="goal-top"><span><i class="fas fa-calendar" style="color:#3498DB;margin-right:6px;"></i>Meta mensual</span><span>Q{{ingresosMesStr}} / Q{{metaMensual|number:'1.0-0'}}</span></div>
                  <div class="progress-bar"><div class="progress-fill" [style.width.%]="progresoMensual" [class.progress-empty]="esCero(progresoMensual)" [class.progress-done]="esCompleto(progresoMensual)" [style.background]="bgMensual"></div></div>
                  <span class="goal-percent" [style.color]="colorMensual">{{progresoMensual}}% {{textoMensual}}</span>
                </div>
                <div class="goal-item">
                  <div class="goal-top"><span><i class="fas fa-flag" style="color:#AF52DE;margin-right:6px;"></i>Meta anual</span><span>Q{{ingresosAnioStr}} / Q{{metaAnual|number:'1.0-0'}}</span></div>
                  <div class="progress-bar"><div class="progress-fill" [style.width.%]="progresoAnual" [class.progress-empty]="esCero(progresoAnual)" [class.progress-done]="esCompleto(progresoAnual)" [style.background]="bgAnual"></div></div>
                  <span class="goal-percent" [style.color]="colorAnual">{{progresoAnual}}% {{textoAnual}}</span>
                </div>
              </div>
              <div class="goals-hint">
                Define tus metas arriba. El dashboard refleja el balance neto.
              </div>
            </div>

            <div class="card widget-card widget-2">
              <div class="card-header">
                <span class="card-label">Acciones rápidas</span>
              </div>
              <div class="quick-actions">
                <button class="quick-action" (click)="abrirFormulario()"><i class="fas fa-plus-circle"></i><span>Nuevo ingreso</span></button>
                <button class="quick-action" (click)="exportarCSV()"><i class="fas fa-file-invoice"></i><span>Generar reporte</span></button>
                <button class="quick-action" (click)="abrirMetas()"><i class="fas fa-bullseye"></i><span>Definir meta</span></button>
                <button class="quick-action" (click)="irDashboard()"><i class="fas fa-tachometer-alt"></i><span>Ir al dashboard</span></button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- MODAL AGREGAR REGISTRO -->
    <div class="modal-overlay" *ngIf="mostrarFormulario" (click)="cerrarFormulario()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Agregar ingreso</h3>
          <button class="modal-close" (click)="cerrarFormulario()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Concepto</label>
            <input type="text" [(ngModel)]="formData.descripcion" placeholder="Ej: Salario, Ventas, Remesa" class="form-input">
          </div>
          <div class="form-group">
            <label>Monto (Q)</label>
            <input type="number" [(ngModel)]="formData.monto" placeholder="0.00" min="0.01" step="0.01" class="form-input">
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select [(ngModel)]="formData.categoria" class="form-input">
              <option *ngFor="let c of categoriasDisponibles" [value]="c">{{c}}</option>
            </select>
            <div class="cat-preview">
              <span class="cat-dot-table" [style.background]="colorIngreso(formData.categoria)"></span>
              <span [style.color]="colorIngreso(formData.categoria)">{{formData.categoria}}</span>
            </div>
          </div>
          <div class="form-group">
            <label>Fecha</label>
            <input type="date" [(ngModel)]="formData.fecha" class="form-input" [max]="maxFecha" [attr.max]="maxFecha">
          </div>
          <div class="form-error" *ngIf="formError">{{formError}}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancelar" (click)="cerrarFormulario()">Cancelar</button>
          <button class="btn-guardar" (click)="guardar()" [disabled]="guardando">{{guardando ? 'Guardando...' : 'Guardar'}}</button>
        </div>
      </div>
    </div>

    <!-- MODAL DEFINIR METAS -->
    <div class="modal-overlay" *ngIf="mostrarMetas" (click)="cerrarMetas()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Definir metas de ingresos</h3>
          <button class="modal-close" (click)="cerrarMetas()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Las metas se guardan en tu navegador y alimentan el progreso y el tacómetro del dashboard.</p>
          <div class="form-group">
            <label>Meta mensual (Q)</label>
            <input type="number" [(ngModel)]="metaMensual" placeholder="Ej: 10000" min="0" step="100" class="form-input">
          </div>
          <div class="form-group">
            <label>Meta anual (Q)</label>
            <input type="number" [(ngModel)]="metaAnual" placeholder="Ej: 120000" min="0" step="1000" class="form-input">
          </div>
          <div class="form-error" *ngIf="metaError">{{metaError}}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancelar" (click)="cerrarMetas()">Cancelar</button>
          <button class="btn-guardar" (click)="guardarMetas()">Guardar metas</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div class="toast" *ngIf="toastVisible" [class.toast-error]="toastTipo==='error'" [class.toast-info]="toastTipo==='info'">
      <i [class]="toastTipo==='error' ? 'fas fa-exclamation-circle' : toastTipo==='info' ? 'fas fa-info-circle' : 'fas fa-check-circle'"></i>
      <span>{{toastMensaje}}</span>
    </div>
  `,
  styles: [`
    @keyframes slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slide-left{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes fade-in{from{opacity:0}to{opacity:1}}
    @keyframes bar-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @keyframes bar-shine{0%{left:-100%}100%{left:200%}}
    @keyframes icon-spin-in{from{transform:rotate(-90deg) scale(0.5);opacity:0}to{transform:rotate(0deg) scale(1);opacity:1}}
    @keyframes amount-count{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes dot-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    :host{display:block;height:100vh;overflow:hidden}
    .app-layout{display:grid;grid-template-columns:90px 1fr;height:100vh;background:#0B132B;font-family:'Inter','Segoe UI',system-ui,sans-serif;color:#FFFFFF;overflow:hidden;position:relative}
    .sidebar{background:#121212;border-radius:0 20px 20px 0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:24px 0;z-index:10;animation:slide-left 0.6s cubic-bezier(0.22,1,0.36,1);border-right:1px solid rgba(22,160,133,0.06)}
    .sidebar-top{display:flex;flex-direction:column;align-items:center;gap:32px;width:100%}
    .sidebar-logo{width:74px;height:74px;border-radius:50%;background:#FFFFFF;border:2px solid #FFFFFF;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;transition:all 0.3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.25),0 0 0 1px rgba(255,255,255,0.8);animation:sidebar-hud-pulse 3s ease-in-out infinite}
    @keyframes sidebar-hud-pulse{0%,100%{box-shadow:0 4px 20px rgba(0,0,0,0.25),0 0 0 1px rgba(255,255,255,0.8)}50%{box-shadow:0 4px 24px rgba(0,0,0,0.3),0 0 18px rgba(22,160,133,0.12)}}
    .sidebar-logo:hover{background:#FFFFFF;border-color:#FFFFFF;box-shadow:0 6px 28px rgba(0,0,0,0.3),0 0 25px rgba(22,160,133,0.15);transform:scale(1.03)}
    .sidebar-logo-img{width:100%;height:100%;padding:8px;object-fit:contain;background:#FFFFFF !important;border-radius:50%;position:relative;z-index:2;display:block}
    .sidebar-menu{display:flex;flex-direction:column;align-items:center;gap:8px}
    .sidebar-icon{width:42px;height:42px;border:none;border-radius:12px;background:transparent;color:#A0AABC;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s cubic-bezier(0.22,1,0.36,1);position:relative;overflow:hidden;animation:slide-left 0.5s cubic-bezier(0.22,1,0.36,1) backwards}
    .sidebar-icon:nth-child(1){animation-delay:0.1s}.sidebar-icon:nth-child(2){animation-delay:0.2s}.sidebar-icon:nth-child(3){animation-delay:0.3s}.sidebar-icon:nth-child(4){animation-delay:0.4s}
    .sidebar-icon::before{content:'';position:absolute;inset:0;border-radius:12px;background:radial-gradient(circle at center, rgba(0,230,118,0.2), transparent 70%);opacity:0;transition:opacity 0.3s ease}
    .sidebar-icon:hover{color:#FFFFFF;transform:scale(1.1)}.sidebar-icon:hover::before{opacity:1}
    .sidebar-icon.active{background:rgba(212,255,0,0.12);color:#D4FF00}
    .sidebar-icon.active::after{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:#D4FF00;border-radius:0 3px 3px 0;box-shadow:0 0 8px rgba(212,255,0,0.5)}
    .sidebar-settings{margin-top:auto}
    .sidebar-icon .spin{animation:spin 0.6s ease}
    .sidebar-salir:hover{color:#ff5c5c !important;background:rgba(255,92,92,.12)}.sidebar-salir:hover::before{opacity:0}
    .settings-menu{position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%);background:#181818;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:6px;min-width:210px;z-index:30;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:slide-left 0.3s cubic-bezier(0.22,1,0.36,1)}
    .menu-item{width:100%;padding:11px 14px;border:none;border-radius:8px;background:transparent;color:#FFFFFF;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.25s ease;text-align:left}
    .menu-item:hover{background:rgba(0,230,118,0.06);padding-left:18px}
    .menu-item i{color:#00E676;width:16px;text-align:center;font-size:13px}
    .menu-item.logout i{color:#ff5c5c}.menu-item.logout:hover{background:rgba(255,92,92,0.08)}
    .menu-divider{height:1px;background:rgba(255,255,255,0.06);margin:6px 0}
    .content{display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .header{display:flex;align-items:center;justify-content:space-between;padding:18px 28px;flex-shrink:0;animation:fade-in 0.6s ease-out 0.2s backwards}
    .search-box{display:flex;align-items:center;gap:10px;background:#1F2430;border-radius:20px;padding:10px 18px;width:280px;border:1px solid rgba(255,255,255,0.04);transition:all 0.3s ease}
    .search-box:focus-within{border-color:rgba(22,160,133,0.3);box-shadow:0 0 16px rgba(22,160,133,0.08)}
    .search-icon{color:#A0AABC;font-size:13px}
    .search-input{background:transparent;border:none;outline:none;color:#FFFFFF;font-size:13px;font-family:inherit;width:100%}
    .search-input::placeholder{color:#A0AABC}
    .header-right{display:flex;align-items:center;gap:14px}
    .header-action{width:38px;height:38px;border:1px solid rgba(255,255,255,0.04);border-radius:10px;background:rgba(255,255,255,0.05);color:#A0AABC;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s cubic-bezier(0.22,1,0.36,1);position:relative}
    .header-action:hover{background:rgba(0,230,118,0.08);border-color:rgba(0,230,118,0.2);color:#00E676;transform:translateY(-2px) scale(1.05);box-shadow:0 4px 16px rgba(0,230,118,0.12)}
    .profile{display:flex;align-items:center;gap:10px;margin-left:6px}
    .profile-photo{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg, rgba(22,160,133,0.15), rgba(52,152,219,0.1));border:1.5px solid rgba(22,160,133,0.2);color:#00E676;display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden}
    .profile-photo img{width:100%;height:100%;object-fit:cover}
    .profile-text{display:flex;flex-direction:column;line-height:1.2}
    .profile-greeting{font-size:12px;color:#A0AABC}.profile-name{font-size:13px;font-weight:700;color:#00E676}
    .dashboard{flex:1;padding:0 28px 24px;overflow-y:auto;display:flex;flex-direction:column;gap:18px}
    .title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;animation:slide-up 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s backwards}
    .title-left{display:flex;flex-direction:column}
    .main-title{font-size:2.5rem;font-weight:800;color:#00E676;margin:0;line-height:1.1;text-shadow:0 0 30px rgba(0,230,118,0.15)}
    .main-subtitle{font-size:15px;color:#A0AABC;margin:4px 0 0}
    .title-right{display:flex;align-items:center;gap:12px}
    .btn-excel{display:flex;align-items:center;gap:8px;padding:11px 20px;border:1px solid rgba(39,167,49,0.3);border-radius:14px;background:rgba(39,167,49,0.08);color:#4CAF50;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.3s cubic-bezier(0.22,1,0.36,1)}
    .btn-excel i{color:#4CAF50;font-size:15px}
    .btn-excel:hover{background:rgba(39,167,49,0.15);border-color:#4CAF50;transform:translateY(-2px);box-shadow:0 4px 16px rgba(39,167,49,0.15)}
    .acceso-btn{display:flex;align-items:center;gap:8px;padding:11px 20px;border:1px solid rgba(255,255,255,0.06);border-radius:14px;background:#121212;color:#FFFFFF;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.3s ease}
    .acceso-btn i{color:#00E676}
    .acceso-btn:hover{background:#1a1a1a;border-color:rgba(0,230,118,0.2)}
    .cards-grid{display:grid;gap:18px}
    .card{background:linear-gradient(160deg, #151515 0%, #121212 50%, #0f0f0f 100%);border-radius:16px;padding:22px;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,0.04);animation:slide-up 0.7s cubic-bezier(0.22,1,0.36,1) backwards;transition:all 0.35s ease;position:relative;overflow:hidden}
    .card::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg, transparent, rgba(0,230,118,0.02), transparent);transition:left 0.8s ease;pointer-events:none}
    .card:hover{border-color:rgba(0,230,118,0.1);box-shadow:0 4px 24px rgba(0,0,0,0.2), 0 0 40px rgba(0,230,118,0.03);transform:translateY(-2px)}
    .card:hover::after{left:150%}
    .card-header{display:flex;justify-content:space-between;align-items:flex-start}
    .card-label{font-size:13px;color:#A0AABC;font-weight:500}
    .card-amount{font-size:28px;font-weight:800;margin:8px 0 6px;animation:amount-count 0.6s cubic-bezier(0.22,1,0.36,1) 0.8s backwards}
    .card-amount.green{color:#00E676;text-shadow:0 0 20px rgba(0,230,118,0.15)}
    .card-icon{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;animation:icon-spin-in 0.6s cubic-bezier(0.22,1,0.36,1) 0.7s backwards}
    .card-icon.yellow-circle{background:linear-gradient(135deg, #D4FF00, #b8d400);color:#0B132B;box-shadow:0 0 12px rgba(212,255,0,0.2)}
    .card-icon.blue-circle{background:linear-gradient(135deg, #007AFF, #2980b9);color:#FFFFFF;box-shadow:0 0 12px rgba(0,122,255,0.3)}
    .card-icon.violet-circle{background:linear-gradient(135deg, #AF52DE, #8e44ad);color:#FFFFFF;box-shadow:0 0 12px rgba(175,82,222,0.3)}
    .metric-diff{font-size:12px;font-weight:500;margin:0}
    .metric-diff.positive{color:#00E676}.metric-diff.muted{color:#A0AABC}
    .metric-hint{font-size:11px;color:#6b7280;margin:4px 0 0}
    .metrics-grid{grid-template-columns:repeat(3,1fr)}
    .metrics-grid .card:nth-child(1){animation-delay:0.4s}.metrics-grid .card:nth-child(2){animation-delay:0.5s}.metrics-grid .card:nth-child(3){animation-delay:0.6s}
    .charts-grid{grid-template-columns:7fr 5fr}
    .charts-grid .chart-7{animation-delay:0.5s}.charts-grid .chart-5{animation-delay:0.6s}
    .card-subtitle{font-size:12px;color:#A0AABC;margin:3px 0 0}
    .month-badge{font-size:12px;color:#3498DB;background:rgba(52,152,219,0.12);border:1px solid rgba(52,152,219,0.25);padding:4px 12px;border-radius:9999px;font-weight:600}
    .bar-chart-container{display:flex;gap:12px;height:250px;align-items:stretch}
    .chart-y-axis{display:flex;flex-direction:column;justify-content:space-between;text-align:right;padding-bottom:24px;flex-shrink:0}
    .chart-y-axis span{font-size:11px;color:#A0AABC}
    .bar-chart{display:flex;align-items:flex-end;gap:10px;flex:1;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06)}
    .bar-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;position:relative}
    .bar-value{font-size:10px;color:#00E676;font-weight:700;background:rgba(0,230,118,0.12);padding:2px 6px;border-radius:6px;border:1px solid rgba(0,230,118,0.2)}
    .bar{width:100%;max-width:48px;border-radius:10px 10px 4px 4px;transform-origin:bottom;animation:bar-grow 0.8s cubic-bezier(0.34,1.56,0.64,1) backwards;position:relative;overflow:hidden}
    .bar::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);animation:bar-shine 3s ease-in-out infinite}
    .bar-group:nth-child(1) .bar{animation-delay:0.5s}.bar-group:nth-child(2) .bar{animation-delay:0.65s}.bar-group:nth-child(3) .bar{animation-delay:0.8s}.bar-group:nth-child(4) .bar{animation-delay:0.95s}.bar-group:nth-child(5) .bar{animation-delay:1.1s}.bar-group:nth-child(n+6) .bar{animation-delay:1.2s}
    .bar-empty{height:2px;background:rgba(52,152,219,0.15)}
    .bar-empty::after{display:none}
    .green-bar{background:linear-gradient(180deg, #00E676, #00D285);box-shadow:0 0 10px rgba(0,230,118,0.2)}
    .bar-top{width:100%;height:6px;border-radius:10px 10px 0 0;background:#00E676;box-shadow:0 0 6px rgba(0,230,118,0.4)}
    .bar-label{font-size:11px;color:#A0AABC}
    .dona-layout{display:flex;align-items:center;gap:18px;margin:8px 0}
    .dona-wrap{position:relative;display:flex;justify-content:center;flex-shrink:0}
    .dona-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
    .dona-center-label{font-size:11px;color:#A0AABC;margin-bottom:2px}
    .dona-center strong{font-size:17px;color:#FFFFFF;font-weight:800;text-shadow:0 0 12px rgba(0,230,118,0.25)}
    .dona-center-hint{font-size:9px;color:#6b7280;margin-top:2px}
    .dona-svg{width:160px;height:160px;transform:rotate(-90deg)}
    .dona-track,.dona-seg{fill:none;stroke-width:16}
    .dona-track{stroke:rgba(52,152,219,0.08);animation:fade-in 0.8s ease-out 0.6s backwards}
    .dona-seg{stroke-linecap:round;opacity:0.95;filter:drop-shadow(0 0 4px rgba(255,255,255,0.15));animation:fade-in 0.8s ease-out 0.8s backwards;transition:all 0.3s}
    .dona-seg:hover{opacity:1;filter:drop-shadow(0 0 8px rgba(255,255,255,0.2))}
    .dona-inside-text{fill:#FFFFFF;font-size:9px;font-weight:800;text-shadow:0 1px 4px rgba(0,0,0,0.8);transform:rotate(90deg);dominant-baseline:middle}
    .dona-inside-text .pct{font-size:7px;fill:rgba(255,255,255,0.85);font-weight:600}
    .dona-legend{display:flex;flex-direction:column;gap:6px;flex:1;min-width:0}
    .legend-row{display:flex;align-items:center;gap:8px;font-size:13px;color:#FFFFFF;padding:7px 10px;border-radius:10px;background:rgba(255,255,255,0.03);animation:slide-up 0.5s cubic-bezier(0.22,1,0.36,1) backwards;border:1px solid rgba(255,255,255,0.03);transition:all 0.2s}
    .legend-row:hover{background:rgba(255,255,255,0.06);transform:translateX(2px)}
    .legend-dot{width:11px;height:11px;border-radius:50%;filter:drop-shadow(0 0 4px currentColor);animation:dot-pulse 2s ease-in-out infinite;flex-shrink:0;border:1.5px solid rgba(255,255,255,0.15)}
    .legend-name{flex:1;color:#E5E7EB;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
    .legend-val{font-weight:800;white-space:nowrap}
    .legend-pct{font-size:11px;color:#A0AABC;font-weight:700;min-width:34px;text-align:right;background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:6px}
    .legend-empty{text-align:center;color:#A0AABC;font-size:12px;padding:12px 0;display:flex;flex-direction:column;align-items:center;gap:6px}
    .legend-empty i{font-size:28px;color:rgba(0,122,255,0.3)}
    .legend-empty p{margin:0;color:#E5E7EB;font-weight:600}.legend-empty span{font-size:11px;color:#6b7280;line-height:1.3}
    .widgets-grid{grid-template-columns:6fr 4fr 2fr}
    .widgets-grid .widget-6{animation-delay:0.6s}.widgets-grid .widget-4{animation-delay:0.7s}.widgets-grid .widget-2{animation-delay:0.8s}
    .view-all{border:none;background:transparent;color:#3498DB;font-size:13px;font-family:inherit;cursor:pointer;padding:0;transition:color 0.3s ease;font-weight:600}
    .view-all:hover{color:#00E676}
    .income-table{width:100%;border-collapse:collapse}
    .income-table th{text-align:left;font-size:11px;color:#A0AABC;font-weight:600;padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.06);text-transform:uppercase;letter-spacing:0.5px}
    .income-table td{padding:12px 8px;font-size:13px;color:#FFFFFF}
    .empty-row td{padding:0}
    .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 0;text-align:center;gap:6px}
    .empty-state i{font-size:32px;color:rgba(0,122,255,0.3);margin-bottom:8px;animation:dot-pulse 2.5s ease-in-out infinite}
    .empty-state p{font-size:14px;color:#A0AABC;margin:0;font-weight:500}
    .empty-state span{font-size:12px;color:rgba(160,170,188,0.6)}
    .row-del{border:none;background:rgba(255,92,92,0.1);color:#ff5c5c;width:28px;height:28px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
    .row-del:hover{background:#ff5c5c;color:white}
    .goals-list{display:flex;flex-direction:column;gap:20px}
    .goal-item{display:flex;flex-direction:column;gap:8px}
    .goal-top{display:flex;justify-content:space-between;font-size:13px;color:#FFFFFF}
    .goal-top span:last-child{color:#A0AABC;font-weight:600}
    .progress-bar{height:10px;border-radius:9999px;background:rgba(255,255,255,0.06);overflow:hidden;border:1px solid rgba(255,255,255,0.04)}
    .progress-fill{height:100%;border-radius:9999px;width:0%;transition:width 0.8s cubic-bezier(0.22,1,0.36,1);background:linear-gradient(90deg, #16A085, #3498DB)}
    .progress-empty{opacity:0.25}
    .goal-percent{font-size:12px;color:#00E676;font-weight:700}
    .goals-hint{font-size:11px;color:#6b7280;text-align:center;margin-top:16px;line-height:1.4;background:rgba(255,255,255,0.02);padding:8px;border-radius:8px;border:1px dashed rgba(255,255,255,0.06)}
    .quick-actions{display:flex;flex-direction:column;gap:8px}
    .quick-action{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid rgba(255,255,255,0.06);border-radius:12px;background:rgba(255,255,255,0.03);color:#FFFFFF;font-size:13px;font-family:inherit;cursor:pointer;transition:all 0.3s ease;text-align:left}
    .quick-action i{color:#00E676;font-size:14px}
    .quick-action:hover{border-color:#00E676;background:rgba(0,230,118,0.08);transform:translateX(4px)}
    @media (max-width:1200px){.charts-grid{grid-template-columns:1fr}.widgets-grid{grid-template-columns:1fr 1fr}.widget-2{grid-column:1 / -1}.dona-layout{flex-direction:column}}
    @media (max-width:768px){.app-layout{grid-template-columns:1fr}.sidebar{display:none}.metrics-grid{grid-template-columns:1fr}.widgets-grid{grid-template-columns:1fr}.widget-2{grid-column:auto}.search-box{width:180px}.profile-text{display:none}.main-title{font-size:1.8rem}.dona-layout{flex-direction:column}}
    .cat-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid}
    .dot-row{display:inline-flex;align-items:center;gap:8px}
    .cat-dot-table{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0}
    .cat-preview{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;font-weight:600}
    .monto-pos{color:#00E676;font-weight:700;text-align:right}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fade-in .2s;backdrop-filter:blur(4px)}
    .modal-card{background:#111827;border:1px solid #1e293b;border-radius:16px;width:460px;max-width:95vw;animation:slide-up .3s ease;max-height:90vh;overflow-y:auto}
    .modal-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 0}
    .modal-header h3{margin:0;font-size:18px;color:#e0e6ed}
    .modal-close{background:none;border:none;color:#6b7280;font-size:18px;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center}
    .modal-close:hover{background:rgba(255,255,255,0.05);color:#fff}
    .modal-body{padding:20px 24px;display:flex;flex-direction:column;gap:16px}
    .modal-hint{font-size:12px;color:#6b7280;background:rgba(0,122,255,0.08);padding:10px 12px;border-radius:8px;border:1px solid rgba(0,122,255,0.15);margin:0}
    .form-group{display:flex;flex-direction:column;gap:6px}
    .form-group label{font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
    .form-input{background:#1a1f2e;border:1px solid #1e293b;border-radius:10px;padding:11px 14px;color:#e0e6ed;font-size:13px;outline:none;transition:border .2s;font-family:inherit}
    .form-input:focus{border-color:#00E676;box-shadow:0 0 0 3px rgba(0,230,118,0.1)}
    .form-error{color:#ff5c5c;font-size:12px;padding:10px 12px;background:rgba(255,92,92,.1);border-radius:8px;border:1px solid rgba(255,92,92,0.2)}
    .modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:0 24px 20px}
    .btn-cancelar{background:transparent;border:1px solid #1e293b;color:#9ca3af;padding:10px 18px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s}
    .btn-cancelar:hover{background:rgba(255,255,255,0.05);color:#fff}
    .btn-guardar{background:linear-gradient(135deg,#00E676,#00D285);color:#0B132B;border:none;padding:10px 20px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.2s}
    .btn-guardar:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,230,118,0.3)}
    .btn-guardar:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
    .progress-done{opacity:1 !important}
    .notif-wrap{position:relative}
    .notif-badge{position:absolute;top:-5px;right:-5px;background:#00E676;color:#0B132B;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:9999px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:1.5px solid #0B132B}
    .notif-dropdown{position:absolute;top:44px;right:0;width:320px;background:#111827;border:1px solid #1e293b;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:200;overflow:hidden;animation:slide-up .3s ease;max-height:380px;overflow-y:auto}
    .notif-header{padding:14px 16px;font-size:13px;font-weight:700;color:#e0e6ed;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center}
    .notif-clear{border:none;background:transparent;color:#00E676;font-size:11px;cursor:pointer;font-weight:700}
    .notif-item{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.03)}
    .notif-item:hover{background:rgba(255,255,255,.03)}
    .notif-item > i.fa-circle{font-size:8px;margin-top:5px}
    .notif-text{flex:1;display:flex;flex-direction:column;gap:2px}
    .notif-text strong{font-size:13px;color:#fff}.notif-text span{font-size:12px;color:#9ca3af}
    .notif-time{font-size:11px;color:#6b7280;white-space:nowrap}
    .notif-empty{padding:20px 16px;text-align:center;color:#9ca3af;font-size:13px}
    .msg-avatar{font-size:22px;color:#00E676}
    .toast{position:fixed;bottom:24px;right:24px;display:flex;align-items:center;gap:12px;background:#111827;border:1px solid #00E676;border-left:4px solid #00E676;color:#fff;padding:14px 18px;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:5000;animation:slide-up .4s cubic-bezier(.22,1,.36,1);font-size:13px;font-weight:500;max-width:90vw}
    .toast i{color:#00E676;font-size:18px}
    .toast.toast-error{border-color:#ff5c5c;border-left-color:#ff5c5c}.toast.toast-error i{color:#ff5c5c}
    .toast.toast-info{border-color:#007AFF;border-left-color:#007AFF}.toast.toast-info i{color:#007AFF}
  `]
})
export class IngresosComponent implements OnInit {
  ingresos: Ingreso[] = [];
  ingresosFiltrados: Ingreso[] = [];
  ingresosVisibles: Ingreso[] = [];
  busqueda = '';
  mostrarTodos = false;

  totalIngresosStr = '0.00';
  ingresosMesStr = '0.00';
  ingresosAnioStr = '0.00';
  cantidadRegistros = 0;
  registrosMes = 0;
  registrosAnio = 0;
  anioActual = new Date().getFullYear();

  barrasEvolucion: { etiqueta: string; monto: number; altura: number }[] = [];
  maxMensual = 0;

  donaSegmentos: { color: string; dash: string; offset: number }[] = [];
  donaLabels: { x:number; y:number; monto:string; pct:number }[] = [];
  donaCategorias: { nombre: string; monto: string; color: string; pct: number }[] = [];
  donaTotalStr = '0.00';

  categoriasDisponibles = ['Salario','Bono','Ventas','Inversiones','Negocio','Regalo','Otros'];

  mostrarFormulario = false;
  guardando = false;
  formError = '';
  formData = { descripcion: '', monto: 0, categoria: 'Salario', fecha: '' };
  get maxFecha(): string { return new Date().toISOString().split('T')[0]; }

  mesActualNombre = '';

  metaMensual = 0;
  metaAnual = 0;
  progresoMensual = 0;
  progresoAnual = 0;
  mostrarMetas = false;
  metaError = '';

  settingsAbierto = false;
  verNotificaciones = false;
  verMensajes = false;
  notificaciones: { titulo: string; detalle: string; hora: string; categoria: string }[] = [];
  numNotificaciones = 0;
  mensajes: { de:string; texto:string; hora:string }[] = [];
  numMensajes = 0;

  toastVisible = false;
  toastMensaje = '';
  toastTipo: 'success'|'error'|'info' = 'success';

  private coloresIngreso: Record<string, string> = {
    Salario: '#16A085',
    Bono: '#f59e0b',
    Ventas: '#3b82f6',
    Inversiones: '#8b5cf6',
    Negocio: '#06b6d4',
    Regalo: '#ec4899',
    Otros: '#6b7280',
  };

  constructor(private router: Router, private gastosService: GastosService, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  private usuarioLogueado: any = null;
  get nombreUsuario(): string {
    return this.usuarioLogueado?.fullName || 'Usuario';
  }
  get fotoUsuario(): string {
    return this.usuarioLogueado?.avatar || '';
  }

  ngOnInit(): void {
    const hoy = new Date();
    const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    this.mesActualNombre = nombres[hoy.getMonth()];
    this.formData.fecha = hoy.toISOString().split('T')[0];
    const metas = localStorage.getItem('metas');
    if (metas) {
      try{
        const m = JSON.parse(metas);
        this.metaMensual = Number(m.metaMensual) || 0;
        this.metaAnual = Number(m.metaAnual) || 0;
      }catch{}
    }
    this.cargarNotificacionesIniciales();
    this.cargarDatos();
    this.authService.currentUser$.subscribe((u) => {
      if (u) {
        this.usuarioLogueado = u;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarNotificacionesIniciales(){
    const stored = localStorage.getItem('fv_notificaciones');
    if(stored){ try{ const arr=JSON.parse(stored); this.notificaciones=arr; this.numNotificaciones=0; }catch{} }
    const msgs = localStorage.getItem(this.authService.mensajeKey('_ing'));
    if(msgs){ try{ this.mensajes=JSON.parse(msgs);}catch{} }
    if(this.mensajes.length===0){
      this.mensajes = [{ de: 'FinVanguard', texto: 'Tu informe mensual está listo. Sigue registrando ingresos.', hora: 'Ahora' }];
      this.numMensajes=1;
    } else this.numMensajes = this.mensajes.length;
  }

  colorIngreso(cat: string): string { return this.coloresIngreso[cat] || '#8E8E93'; }
  tieneMonto(m:number): boolean { return m > 0; }
  esCero(p:number): boolean { return p === 0; }
  esCompleto(p:number): boolean { return p >= 100; }
  get bgMensual(): string { return this.progresoMensual >= 100 ? 'linear-gradient(90deg,#00E676,#30D158)' : ''; }
  get bgAnual(): string { return this.progresoAnual >= 100 ? 'linear-gradient(90deg,#AF52DE,#5856D6)' : ''; }
  get colorMensual(): string { return this.progresoMensual >= 100 ? '#00E676' : '#A0AABC'; }
  get colorAnual(): string { return this.progresoAnual >= 100 ? '#AF52DE' : '#A0AABC'; }
  get textoMensual(): string { return this.progresoMensual >= 100 ? '¡Meta alcanzada!' : ''; }
  get textoAnual(): string { return this.progresoAnual >= 100 ? '¡Meta alcanzada!' : ''; }
  get tieneNotificaciones(): boolean { return this.numNotificaciones > 0; }
  get tieneMensajes(): boolean { return this.numMensajes > 0; }
  get sinNotificaciones(): boolean { return this.notificaciones.length === 0; }
  get donaVacia(): boolean { return this.donaCategorias.length === 0; }
  get sinVisibles(): boolean { return this.ingresosVisibles.length === 0; }

  cargarDatos(): void {
    this.gastosService.listarIngresos().subscribe({
      next: (data) => {
        this.ingresos = data;
        this.aplicarFiltro();
        this.calcularMetricas();
        this.construirEvolucion();
        this.construirDona();
      },
      error: ()=> this.mostrarToast('Error al cargar ingresos','error')
    });
  }

  aplicarFiltro(){
    const q = this.busqueda.toLowerCase().trim();
    if(!q) this.ingresosFiltrados = [...this.ingresos];
    else this.ingresosFiltrados = this.ingresos.filter(i=> i.descripcion.toLowerCase().includes(q) || i.categoria.toLowerCase().includes(q));
    this.actualizarVisibles();
  }
  actualizarVisibles(){
    this.ingresosVisibles = this.mostrarTodos ? this.ingresosFiltrados : this.ingresosFiltrados.slice(0,5);
  }
  verTodos(){ this.mostrarTodos = !this.mostrarTodos; this.actualizarVisibles(); this.mostrarToast(this.mostrarTodos?'Mostrando todos los registros':'Mostrando 5 recientes','info'); }

  calcularMetricas(): void {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();
    const partes = (f: string) => {
      const p = f.split('T')[0].split('-');
      return { y: Number(p[0]), m: Number(p[1]) };
    };

    this.cantidadRegistros = this.ingresos.length;
    this.totalIngresosStr = this.ingresos.reduce((s, g) => s + Number(g.monto), 0).toFixed(2);

    const mes = this.ingresos.filter(g => { const p = partes(g.fecha); return p.m === mesActual && p.y === anioActual; });
    this.registrosMes = mes.length;
    this.ingresosMesStr = mes.reduce((s, g) => s + Number(g.monto), 0).toFixed(2);

    const anio = this.ingresos.filter(g => partes(g.fecha).y === anioActual);
    this.registrosAnio = anio.length;
    this.ingresosAnioStr = anio.reduce((s, g) => s + Number(g.monto), 0).toFixed(2);

    this.progresoMensual = this.metaMensual > 0 ? Math.min(100, Math.round((Number(this.ingresosMesStr) / this.metaMensual) * 100)) : 0;
    this.progresoAnual = this.metaAnual > 0 ? Math.min(100, Math.round((Number(this.ingresosAnioStr) / this.metaAnual) * 100)) : 0;
  }

  construirEvolucion(): void {
    const anio = new Date().getFullYear();
    const etiquetas = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const acum: Record<number, number> = {};
    this.ingresos.forEach(g => {
      const p = g.fecha.split('T')[0].split('-');
      if (Number(p[0]) === anio) {
        const m = Number(p[1]);
        acum[m] = (acum[m] || 0) + Number(g.monto);
      }
    });
    const valores = etiquetas.map((_, i) => acum[i + 1] || 0);
    const max = Math.max(...valores, 1);
    this.maxMensual = Math.round(max);
    this.barrasEvolucion = etiquetas.map((e, i) => ({
      etiqueta: e,
      monto: valores[i],
      altura: valores[i]===0 ? 6 : Math.max(12, Math.round((valores[i] / max) * 100)),
    }));
  }

  construirDona(): void {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const normaliza = (s:string) => String(s||'').trim();
    // construir mapa con TODAS las categorías reales (case-insensitive) para no perder Bono si viene con espacio/minúscula
    const valores: Record<string, number> = {};
    // inicializar con disponibles
    this.categoriasDisponibles.forEach(c => valores[c] = 0);

    this.ingresos.forEach(g => {
      const fechaStr = String(g.fecha||'').split('T')[0];
      const p = fechaStr.split('-');
      if (p.length < 2) return;
      const y = Number(p[0]); const m = Number(p[1]);
      if (y === anioActual && m === mesActual) {
        const cRaw = normaliza(g.categoria);
        // buscar clave real que coincida sin importar mayúsculas
        const clave = this.categoriasDisponibles.find(k => k.toLowerCase() === cRaw.toLowerCase()) || cRaw;
        valores[clave] = (valores[clave] || 0) + Number(g.monto);
      }
    });

    // si no hay nada este mes, mostrar fallback de todo el histórico para que sí se vea Bono
    let orden = Object.keys(valores).filter(c => (valores[c] || 0) > 0);
    // mantener orden de categoriasDisponibles primero
    orden = this.categoriasDisponibles.filter(c => orden.includes(c)).concat(orden.filter(c => !this.categoriasDisponibles.includes(c)));
    // si aún vacío y hay ingresos en general, mostrar todo el histórico para que sí se vea Bono
    if (orden.length === 0 && this.ingresos.length > 0) {
      const tot: Record<string,number> = {};
      this.ingresos.forEach(g => {
        const kRaw = normaliza(g.categoria);
        const clave = this.categoriasDisponibles.find(x => x.toLowerCase() === kRaw.toLowerCase()) || kRaw;
        tot[clave] = (tot[clave]||0)+Number(g.monto);
      });
      // reemplazar valores con histórico
      Object.keys(tot).forEach(k => valores[k] = tot[k]);
      orden = Object.keys(tot).filter(k=>tot[k]>0);
      orden = this.categoriasDisponibles.filter(c => orden.includes(c)).concat(orden.filter(c => !this.categoriasDisponibles.includes(c)));
    }
    const total = orden.reduce((s, c) => s + (valores[c] || 0), 0);
    this.donaTotalStr = total.toFixed(2);

    this.donaCategorias = orden.map(c => ({
      nombre: c,
      monto: Math.round(valores[c]).toString(),
      color: this.coloresIngreso[c] || '#8E8E93',
      pct: total > 0 ? Math.round((valores[c] / total) * 100) : 0,
    }));

    const circ = 2 * Math.PI * 78;
    this.donaSegmentos = [];
    this.donaLabels = [];
    let acumulado = 0;
    orden.forEach(c => {
      const v = valores[c] || 0;
      const pct = total > 0 ? v / total : 0;
      const dash = `${pct * circ} ${circ}`;
      const offset = -(acumulado * circ);
      this.donaSegmentos.push({ color: this.coloresIngreso[c] || '#8E8E93', dash, offset });

      // calcular posición del texto dentro de la dona (radio medio 48, ángulo medio)
      const midPct = acumulado + pct/2;
      const angleDeg = midPct * 360 - 90; // -90 porque empieza arriba (rotate -90)
      const rad = angleDeg * Math.PI/180;
      const r = 48; // radio donde va texto (entre centro y borde, para que quede dentro de la banda de 22px es 78-11 ≈ 67? usamos 50-55)
      // pero nuestra dona track r=78 stroke 22 => banda entre 67 y 89; texto mejor en r=78? probamos 52 dentro del hueco? Queremos dentro de la banda. Usamos 78 para que quede sobre la banda centrado.
      // Para que el texto quede dentro de la banda coloreada, r=78 es el centro de la banda.
      const cx = 100 + Math.cos(rad) * 78;
      const cy = 100 + Math.sin(rad) * 78;
      // solo mostrar si pct > 6% para que quepa
      if(pct > 0.06){
        this.donaLabels.push({ x: cx, y: cy, monto: Math.round(v).toString(), pct: Math.round(pct*100) });
      }
      acumulado += pct;
    });
  }

  abrirFormulario(): void {
    this.formError = '';
    const hoy = new Date();
    this.formData = { descripcion: '', monto: 0, categoria: 'Salario', fecha: hoy.toISOString().split('T')[0] };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void { this.mostrarFormulario = false; this.formError = ''; }

  guardar(): void {
    if (!this.formData.descripcion.trim()) { this.formError = 'Ingresa un concepto'; return; }
    if (!this.formData.monto || this.formData.monto <= 0) { this.formError = 'Ingresa un monto mayor a 0'; return; }
    if (!this.formData.fecha) { this.formError = 'Selecciona una fecha'; return; }
    if (this.formData.fecha > this.maxFecha) { this.formError = 'No se puede registrar un ingreso con fecha futura (hoy es ' + this.maxFecha + ')'; return; }

    this.guardando = true;
    this.gastosService.crearIngreso(this.formData).subscribe({
      next: () => {
        this.guardando = false;
        const montoFmt = Number(this.formData.monto).toFixed(2);
        const cat = this.formData.categoria;
        const desc = this.formData.descripcion;
        this.cerrarFormulario();
        this.cargarDatos();
        this.mostrarToast(`Ingreso registrado: Q${montoFmt} (${cat})`);
        this.agregarNotificacion(cat, `Nuevo ingreso de Q${montoFmt} — ${desc}`, desc);
        this.agregarMensaje('FinVanguard', `Se registró "${desc}" por Q${montoFmt} en ${cat}`);
      },
      error: (e) => { this.guardando = false; this.formError = e.error?.message || 'Error al guardar'; this.mostrarToast(this.formError,'error'); },
    });
  }

  abrirMetas(): void { this.metaError = ''; this.mostrarMetas = true; }
  cerrarMetas(): void { this.mostrarMetas = false; this.metaError = ''; }

  guardarMetas(): void {
    if (this.metaMensual < 0 || this.metaAnual < 0) { this.metaError = 'Las metas deben ser mayores o iguales a 0'; return; }
    localStorage.setItem('metas', JSON.stringify({ metaMensual: this.metaMensual, metaAnual: this.metaAnual }));
    this.mostrarMetas = false;
    this.metaError = '';
    this.calcularMetricas();
    this.mostrarToast('Metas de ingresos actualizadas — Dashboard también se actualizará');
    // agregar notificación
    this.agregarNotificacion('Otros', `Metas actualizadas: mensual Q${this.metaMensual}, anual Q${this.metaAnual}`, 'Objetivos');
  }

  eliminarIngreso(g: Ingreso){
    if(!confirm(`¿Eliminar ingreso "${g.descripcion}" por Q${Number(g.monto).toFixed(2)}?`)) return;
    this.gastosService.eliminarIngreso(g.id).subscribe({
      next: ()=>{
        this.mostrarToast('Ingreso eliminado','info');
        this.agregarNotificacion(g.categoria, `Ingreso eliminado: ${g.descripcion}`, g.descripcion);
        this.cargarDatos();
      },
      error: ()=> this.mostrarToast('Error al eliminar','error')
    });
  }

  agregarNotificacion(categoria: string, titulo: string, detalle: string): void {
    const ahora = new Date();
    const hora = `${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    this.notificaciones.unshift({ titulo, detalle, hora, categoria });
    if(this.notificaciones.length>20) this.notificaciones = this.notificaciones.slice(0,20);
    localStorage.setItem('fv_notificaciones', JSON.stringify(this.notificaciones));
    this.numNotificaciones = this.verNotificaciones ? 0 : this.notificaciones.length;
    // también guardar para dashboard
  }
  agregarMensaje(de:string, texto:string){
    const ahora = new Date();
    const hora = `${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2,'0')}`;
    this.mensajes.unshift({de,texto,hora});
    if(this.mensajes.length>20) this.mensajes=this.mensajes.slice(0,20);
    localStorage.setItem(this.authService.mensajeKey('_ing'), JSON.stringify(this.mensajes));
    localStorage.setItem(this.authService.mensajeKey(), JSON.stringify(this.mensajes));
    this.numMensajes = this.verMensajes?0:this.mensajes.length;
  }
  limpiarNotificaciones(){ this.notificaciones=[]; this.numNotificaciones=0; localStorage.removeItem('fv_notificaciones'); this.verNotificaciones=false; }

  toggleSettings(e:MouseEvent){ e.stopPropagation(); this.settingsAbierto=!this.settingsAbierto; this.verNotificaciones=false; this.verMensajes=false; }
  toggleNotificaciones(): void { this.verNotificaciones = !this.verNotificaciones; this.verMensajes = false; this.settingsAbierto=false; if(this.verNotificaciones) this.numNotificaciones=0; }
  toggleMensajes(): void { this.verMensajes = !this.verMensajes; this.verNotificaciones = false; this.settingsAbierto=false; if(this.verMensajes) this.numMensajes=0; }
  cerrarDropdowns(){ this.verNotificaciones=false; this.verMensajes=false; this.settingsAbierto=false; }
  irPerfil(){ this.settingsAbierto=false; this.router.navigate(['/perfil']); }
  limpiarDatos(){ if(confirm('¿Borrar notificaciones y metas locales?')){ localStorage.removeItem('fv_notificaciones'); localStorage.removeItem(this.authService.mensajeKey()); localStorage.removeItem(this.authService.mensajeKey('_ing')); localStorage.removeItem('metas'); this.notificaciones=[]; this.numNotificaciones=0; this.mostrarToast('Datos locales borrados','info'); this.settingsAbierto=false; } }

  mostrarToast(mensaje: string, tipo:'success'|'error'|'info'='success'): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; }, 3500);
  }

  cerrarSesion(): void {
    this.settingsAbierto=false;
    this.authService.logout();
    this.router.navigate(['/']);
  }

  exportarCSV(): void {
    if (!this.ingresos.length) { this.mostrarToast('No hay ingresos para exportar','info'); return; }
    const total = this.ingresos.reduce((s, g) => s + Number(g.monto), 0).toFixed(2);
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>Ingresos</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; width: 100%; }
        th, td { border: 1px solid #96A3B3; padding: 8px 12px; }
        th { background: #1F2430; color: #FFFFFF; font-weight: bold; }
        .titulo { background: #00E676; color: #0B132B; font-size: 16px; font-weight: bold; text-align: center; }
        .total { background: #007AFF; color: #FFFFFF; font-weight: bold; }
        .num { text-align: right; }
      </style></head><body>
      <table>
        <tr><td class="titulo" colspan="4">Registro de Ingresos — FinVanguard</td></tr>
        <tr><th>Concepto</th><th>Categoría</th><th>Fecha</th><th>Monto (Q)</th></tr>
        ${this.ingresos.map(g => `<tr><td>${this.esc(g.descripcion)}</td><td>${this.esc(g.categoria)}</td><td>${g.fecha}</td><td class="num">Q${Number(g.monto).toFixed(2)}</td></tr>`).join('')}
        <tr class="total"><td colspan="3">TOTAL</td><td class="num">Q${total}</td></tr>
      </table>
      </body></html>`;

    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Registro_Ingresos_FinVanguard.xls';
    a.click();
    URL.revokeObjectURL(url);
    this.mostrarToast('Reporte Excel descargado');
    this.agregarNotificacion('Otros', 'Reporte Excel generado', 'Exportación');
  }

  private esc(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  irDashboard(): void { this.router.navigate(['/dashboard']); }
  irGastos(): void { this.router.navigate(['/gastos']); }
  irAhorros(): void { this.router.navigate(['/ahorros']); }
}
