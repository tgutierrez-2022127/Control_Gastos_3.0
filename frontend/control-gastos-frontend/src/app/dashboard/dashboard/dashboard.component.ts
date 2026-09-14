import { Component, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { GastosService } from '../../services/gastos.service';
import { AuthService } from '../../auth/auth.service';
import { SesionTimerComponent } from '../sesion-timer.component';

@Component({
  selector: 'app-dashboard',
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
            <button class="sidebar-icon active" title="Dashboard" (click)="mostrarToast('Ya estás en Dashboard')">
              <i class="fas fa-credit-card"></i>
            </button>
            <button class="sidebar-icon" title="Ingresos" (click)="irIngresos()">
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
            <button class="menu-item" (click)="mostrarToast('Soporte: escribir a soporte@finvanguard.gt','info'); settingsAbierto=false"><i class="fas fa-headset"></i> Soporte / Ayuda</button>
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
            <input type="text" placeholder="Buscar categoría..." class="search-input" [(ngModel)]="busqueda" (input)="filtrarBusqueda()">
          </div>
          <div class="header-right">
            <div class="notif-wrap" (click)="$event.stopPropagation()">
              <button class="header-action" title="Notificaciones" (click)="toggleNotificaciones()">
                <i class="fas fa-bell"></i>
                <span class="notif-badge" *ngIf="tieneNotificaciones">{{numNotificaciones}}</span>
              </button>
              <div class="notif-dropdown" *ngIf="verNotificaciones">
                <div class="notif-header">
                  <span>Notificaciones</span>
                  <button class="notif-clear" (click)="limpiarNotificaciones()">Limpiar</button>
                </div>
                <div class="notif-item" *ngFor="let n of notificaciones">
                  <i class="fas fa-circle" [style.color]="n.color"></i>
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
                <div class="notif-empty" *ngIf="sinMensajes">Sin mensajes</div>
              </div>
            </div>
            <app-sesion-timer></app-sesion-timer>
            <div class="profile">
              <div class="profile-photo">
                <img *ngIf="fotoUsuario" [src]="fotoUsuario" alt="Foto de perfil">
                <i *ngIf="!fotoUsuario" class="fas fa-user"></i>
              </div>
              <div class="profile-text">
                <span class="profile-greeting">Hola</span>
                <span class="profile-name">{{nombreUsuario}}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- DASHBOARD BODY -->
        <main class="dashboard">
          <!-- TITLE ROW -->
          <div class="title-row">
            <div class="title-left">
              <h1 class="main-title">FinVanguard</h1>
              <p class="main-subtitle">Tus ingresos y gastos se actualizan al instante</p>
              <p class="hint" *ngIf="busqueda">Filtrando por: <strong>{{busqueda}}</strong></p>
            </div>
            <div class="title-right" (click)="$event.stopPropagation()">
              <button class="acceso-btn" (click)="menuAbierto = !menuAbierto">
                <span>Acceso Rápido</span>
                <i class="fas fa-chevron-down" [class.rotated]="menuAbierto"></i>
              </button>
              <div class="acceso-menu" *ngIf="menuAbierto">
                <button class="menu-item" (click)="menuAbierto=false; irIngresos()"><i class="fas fa-arrow-down"></i> Ver ingresos</button>
                <button class="menu-item" (click)="menuAbierto=false; recargar()"><i class="fas fa-sync-alt"></i> Actualizar datos</button>
                <button class="menu-item" (click)="menuAbierto=false; cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
              </div>
            </div>
          </div>

          <!-- 3-COLUMN GRID -->
          <div class="cards-grid">

            <!-- ========== COL 1 ========== -->
            <div class="col col-1">
              <!-- TOTAL BALANCE -->
              <div class="card balance-card">
                <div class="card-header">
                  <span class="card-label">Balance neto</span>
                  <div class="card-icon yellow-circle">
                    <i class="fas fa-wallet"></i>
                  </div>
                </div>
                <p class="card-amount" [class.green]="isPositive" [class.red]="isNegative">Q{{balanceNetoStr}}</p>
                <p class="card-sub">Ingresos - Gastos • Se actualiza con cada registro</p>

                <div class="balance-row">
                  <div class="row-icon income"><i class="fas fa-arrow-down"></i></div>
                  <span class="row-label">Ingresos totales</span>
                  <span class="row-value income">Q{{ingresosTotalesStr}}</span>
                </div>
                <div class="balance-row">
                  <div class="row-icon expense"><i class="fas fa-arrow-up"></i></div>
                  <span class="row-label">Gastos totales</span>
                  <span class="row-value expense">Q{{gastosTotalesStr}}</span>
                </div>
              </div>

              <!-- TOTAL GASTADO MES -->
              <div class="card gastado-card">
                <div class="card-header">
                  <span class="card-label">Gastado este mes</span>
                  <span class="mini-badge">{{mesNombre}}</span>
                </div>
                <p class="card-amount green">Q{{totalMesStr}}</p>
                <p class="card-sub" style="margin-bottom:8px;">Últimos 6 meses • línea verde = gastos</p>
                <svg class="line-chart" viewBox="0 0 320 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#D4FF00" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="#D4FF00" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="linePathD" fill="none" stroke="#D4FF00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path [attr.d]="linePathD + ' L320,80 L0,80 Z'" fill="url(#lineGrad)"/>
                  <circle *ngFor="let p of linePuntos" [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" class="line-pt"/>
                  <text *ngFor="let p of linePuntos" [attr.x]="p.x" [attr.y]="p.y - 7" text-anchor="middle" class="line-val">{{p.txt}}</text>
                </svg>
                <div class="line-labels">
                  <span *ngFor="let l of lineLabels">{{l}}</span>
                </div>
              </div>
            </div>

            <!-- ========== COL 2 ========== -->
            <div class="col col-2">
              <div class="card gastos-card">
                <div class="card-header">
                  <div>
                    <span class="card-label">Gastos mensuales</span>
                    <p class="card-sub">Q{{totalAnioStr}} en {{anioActual}} • barras verdes = meses con gasto</p>
                  </div>
                  <button class="mini-btn" (click)="irIngresos()">Ver ingresos</button>
                </div>
                <div class="bar-chart-area">
                  <div class="y-axis">
                    <span *ngFor="let y of yLabels">Q{{y}}</span>
                  </div>
                  <div class="bars-container">
                    <div class="chart-gridlines">
                      <div class="gridline" *ngFor="let y of yLabels"></div>
                    </div>
                    <div class="bar-group" *ngFor="let b of barrasMeses; let i = index">
                      <span class="bar-value" *ngIf="tieneMonto(b.monto)" title="Q{{b.monto | number:'1.2-2'}}">Q{{b.monto | number:'1.0-0'}}</span>
                      <div class="bar" [class.green-bar]="tieneMonto(b.monto)" [class.dark-bar]="!tieneMonto(b.monto)"
                           [class.bar-cur]="i === barrasMeses.length - 1"
                           [style.height.%]="b.altura" [attr.title]="'Q' + b.monto">
                        <div class="bar-top"></div>
                      </div>
                      <span class="bar-label" [class.cur]="i === barrasMeses.length - 1">{{b.etiqueta}}</span>
                    </div>
                  </div>
                </div>
                <p class="no-data-hint" *ngIf="sinGastos">Aún no hay gastos. Registra ingresos y gastos para ver gráficas.</p>
              </div>
            </div>

            <!-- ========== COL 3 ========== -->
            <div class="col col-3">
              <div class="card cartera-card">
                <div class="card-header">
                  <span class="card-label">Valor de cartera</span>
                  <span class="mini-badge" [class.positive]="isPositive" [class.negative]="isNegative">
                    {{badgeTexto}}
                  </span>
                </div>

                <div class="gauge-wrap">
                  <svg class="gauge" viewBox="0 0 200 120">
                    <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="#1F2430" stroke-width="14" stroke-linecap="round"/>
                    <path [attr.d]="gaugeArcD" fill="none" stroke="#D4FF00" stroke-width="14" stroke-linecap="round"/>
                    <line x1="100" y1="100" [attr.x2]="needleX" [attr.y2]="needleY" stroke="#D4FF00" stroke-width="3" stroke-linecap="round"/>
                    <circle cx="100" cy="100" r="6" fill="#D4FF00"/>
                    <circle cx="28" cy="92" r="2.5" fill="#A0AABC"/>
                    <circle cx="52" cy="58" r="2.5" fill="#A0AABC"/>
                    <circle cx="100" cy="36" r="2.5" fill="#A0AABC"/>
                    <circle cx="148" cy="58" r="2.5" fill="#A0AABC"/>
                    <circle cx="172" cy="92" r="2.5" fill="#A0AABC"/>
                    <text x="20" y="118" text-anchor="middle" class="gauge-txt">Q0</text>
                    <text x="180" y="118" text-anchor="middle" class="gauge-txt">Q{{metaGauge | number:'1.0-0'}}</text>
                  </svg>
                </div>

                <p class="card-amount" [class.green]="isPositive" [class.red]="isNegative">Q{{totalBalanceStr}}</p>
                <p class="card-sub" style="text-align:center;margin-bottom:10px;">Composición del balance • ingresos y gastos</p>

                <div class="categories">
                  <div class="cat-grupo" *ngIf="ingresosTop.length"><i class="fas fa-arrow-down"></i> Ingresos por categoría</div>
                  <div class="category-row" *ngFor="let c of ingresosTop" [class.filtered]="esFiltrado(c.nombre)">
                    <span class="cat-dot" [style.background]="c.color"></span>
                    <span class="cat-name">{{c.nombre}}</span>
                    <span class="cat-amount green">Q{{c.monto}}</span>
                    <span class="cat-pct">{{c.pct}}%</span>
                  </div>
                  <div class="cat-grupo" *ngIf="gastosTop.length"><i class="fas fa-arrow-up"></i> Gastos por categoría</div>
                  <div class="category-row" *ngFor="let c of gastosTop" [class.filtered]="esFiltrado(c.nombre)">
                    <span class="cat-dot" [style.background]="c.color"></span>
                    <span class="cat-name">{{c.nombre}}</span>
                    <span class="cat-amount red">Q{{c.monto}}</span>
                    <span class="cat-pct">{{c.pct}}%</span>
                  </div>
                  <div class="category-row" *ngIf="sinCategorias">
                    <span class="cat-dot" style="background:#3498DB"></span>
                    <span class="cat-name">Sin registros aún</span>
                    <span class="cat-amount muted">Q0</span>
                  </div>
                </div>
                <div class="gauge-hint">
                  La aguja avanza con tu balance neto. Meta auto: Q{{metaGauge | number:'1.0-0'}}.
                </div>
              </div>
            </div>
          </div>
        </main>
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
    @keyframes slide-right{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes fade-in{from{opacity:0}to{opacity:1}}
    @keyframes bar-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @keyframes gauge-draw{from{stroke-dashoffset:251}}
    @keyframes line-draw{from{stroke-dashoffset:600}}
    @keyframes line-glow-pulse{0%,100%{filter:drop-shadow(0 0 2px rgba(0,230,118,0.3))}50%{filter:drop-shadow(0 0 8px rgba(0,230,118,0.6))}}
    @keyframes needle-swing{0%{transform:rotate(-60deg)}60%{transform:rotate(5deg)}80%{transform:rotate(-2deg)}100%{transform:rotate(0deg)}}
    @keyframes amount-count{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes icon-spin-in{from{transform:rotate(-90deg) scale(0.5);opacity:0}to{transform:rotate(0deg) scale(1);opacity:1}}
    @keyframes dot-pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(0,230,118,0.3)}50%{transform:scale(1.15);box-shadow:0 0 0 4px rgba(0,230,118,0)}}
    @keyframes bar-shine{0%{left:-100%}100%{left:200%}}
    @keyframes hud-grid-scroll{from{background-position:0 0}to{background-position:60px 60px}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    :host{display:block;height:100vh;overflow:hidden}
    .app-layout{display:grid;grid-template-columns:90px 1fr;height:100vh;background:#0B132B;font-family:'Inter','Segoe UI',system-ui,sans-serif;color:#FFFFFF;overflow:hidden;position:relative}
    .app-layout::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(22,160,133,0.02) 1px,transparent 1px),linear-gradient(90deg, rgba(22,160,133,0.02) 1px,transparent 1px);background-size:60px 60px;animation:hud-grid-scroll 30s linear infinite;pointer-events:none;z-index:0}
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
    .sidebar-settings{margin-top:auto;animation:slide-left 0.5s cubic-bezier(0.22,1,0.36,1) 0.5s backwards}
    .sidebar-icon .spin{animation:spin 0.6s ease}
    .sidebar-salir:hover{color:#ff5c5c !important}.sidebar-salir:hover::before{opacity:0}
    .sidebar-salir:hover{background:rgba(255,92,92,.12)}
    .sidebar-bottom{position:relative}
    .settings-menu{position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%);background:#181818;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:6px;min-width:210px;z-index:30;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:slide-left 0.3s cubic-bezier(0.22,1,0.36,1)}
    .menu-item{width:100%;padding:11px 14px;border:none;border-radius:8px;background:transparent;color:#FFFFFF;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.25s ease;text-align:left}
    .menu-item:hover{background:rgba(0,230,118,0.06);padding-left:18px}
    .menu-item i{color:#00E676;width:16px;text-align:center;font-size:13px}
    .menu-item.logout i{color:#ff5c5c}
    .menu-item.logout:hover{background:rgba(255,92,92,0.08)}
    .menu-divider{height:1px;background:rgba(255,255,255,0.06);margin:6px 0}
    .content{display:flex;flex-direction:column;overflow:hidden;min-width:0;position:relative;z-index:1}
    .header{display:flex;align-items:center;justify-content:space-between;padding:18px 28px;flex-shrink:0;animation:fade-in 0.6s ease-out 0.2s backwards}
    .search-box{display:flex;align-items:center;gap:10px;background:#1F2430;border-radius:20px;padding:10px 18px;width:280px;border:1px solid rgba(255,255,255,0.04);transition:all 0.3s ease}
    .search-box:focus-within{border-color:rgba(22,160,133,0.3);box-shadow:0 0 16px rgba(22,160,133,0.08)}
    .search-icon{color:#A0AABC;font-size:13px}
    .search-input{background:transparent;border:none;outline:none;color:#FFFFFF;font-size:13px;font-family:inherit;width:100%}
    .search-input::placeholder{color:#A0AABC}
    .header-right{display:flex;align-items:center;gap:14px}
    .header-action{width:38px;height:38px;border:1px solid rgba(255,255,255,0.04);border-radius:10px;background:rgba(255,255,255,0.05);color:#A0AABC;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s cubic-bezier(0.22,1,0.36,1);position:relative}
    .header-action:hover{background:rgba(0,230,118,0.08);border-color:rgba(0,230,118,0.2);color:#00E676;transform:translateY(-2px) scale(1.05);box-shadow:0 4px 16px rgba(0,230,118,0.12)}
    .notif-wrap{position:relative}
    .notif-badge{position:absolute;top:-5px;right:-5px;background:#D4FF00;color:#0d1117;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:9999px;display:flex;align-items:center;justify-content:center;padding:0 4px}
    .notif-dropdown{position:absolute;top:44px;right:0;width:320px;background:#111827;border:1px solid #1e293b;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:200;overflow:hidden;animation:slide-up .3s ease;max-height:380px;overflow-y:auto}
    .notif-header{padding:14px 16px;font-size:13px;font-weight:600;color:#e0e6ed;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center}
    .notif-clear{border:none;background:transparent;color:#00E676;font-size:11px;cursor:pointer;font-weight:600}
    .notif-item{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.03)}
    .notif-item:hover{background:rgba(255,255,255,.03)}
    .notif-item > i.fa-circle{font-size:8px;margin-top:5px}
    .notif-text{flex:1;display:flex;flex-direction:column;gap:2px}
    .notif-text strong{font-size:13px;color:#fff}.notif-text span{font-size:12px;color:#9ca3af}
    .notif-time{font-size:11px;color:#6b7280;white-space:nowrap}
    .notif-empty{padding:20px 16px;text-align:center;color:#9ca3af;font-size:13px}
    .msg-avatar{font-size:22px;color:#16A085}
    .profile{display:flex;align-items:center;gap:10px;margin-left:6px}
    .profile-photo{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg, rgba(22,160,133,0.15), rgba(52,152,219,0.1));border:1.5px solid rgba(22,160,133,0.2);color:#00E676;display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden;transition:all 0.3s ease}
    .profile-photo img{width:100%;height:100%;object-fit:cover}
    .profile-photo:hover{border-color:rgba(0,230,118,0.5);box-shadow:0 0 12px rgba(0,230,118,0.15)}
    .profile-text{display:flex;flex-direction:column;line-height:1.2}
    .profile-greeting{font-size:12px;color:#A0AABC}.profile-name{font-size:13px;font-weight:700;color:#00E676}
    .dashboard{flex:1;padding:0 28px 24px;overflow-y:auto;display:flex;flex-direction:column}
    .title-row{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;position:relative;animation:slide-up 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s backwards}
    .main-title{font-size:2.5rem;font-weight:800;color:#00E676;margin:0;line-height:1.1;text-shadow:0 0 30px rgba(0,230,118,0.15)}
    .main-subtitle{font-size:15px;color:#A0AABC;margin:4px 0 0}
    .hint{font-size:12px;color:#A0AABC;margin:6px 0 0}.hint strong{color:#00E676}
    .title-right{position:relative}
    .acceso-btn{display:flex;align-items:center;gap:8px;padding:10px 20px;border:1px solid rgba(255,255,255,0.06);border-radius:14px;background:#121212;color:#FFFFFF;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.3s ease}
    .acceso-btn:hover{background:#1a1a1a;border-color:rgba(0,230,118,0.2)}
    .acceso-btn .fa-chevron-down{font-size:10px;transition:transform 0.3s ease}.acceso-btn .fa-chevron-down.rotated{transform:rotate(180deg)}
    .acceso-menu{position:absolute;top:calc(100% + 6px);right:0;background:#181818;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:6px;min-width:210px;z-index:20;box-shadow:0 8px 32px rgba(0,0,0,0.4);animation:slide-up 0.3s cubic-bezier(0.22,1,0.36,1)}
    .cards-grid{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:18px;flex:1}
    .card{background:linear-gradient(160deg, #151515 0%, #121212 50%, #0f0f0f 100%);border-radius:16px;padding:22px;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,0.04);animation:slide-up 0.7s cubic-bezier(0.22,1,0.36,1) backwards;transition:all 0.35s ease;position:relative;overflow:hidden}
    .card::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg, transparent, rgba(0,230,118,0.02), transparent);transition:left 0.8s ease;pointer-events:none}
    .card:hover{border-color:rgba(0,230,118,0.1);box-shadow:0 4px 24px rgba(0,0,0,0.2), 0 0 40px rgba(0,230,118,0.03);transform:translateY(-2px)}
    .card:hover::after{left:150%}
    .col-1 .card:nth-child(1){animation-delay:0.4s}.col-1 .card:nth-child(2){animation-delay:0.55s}.col-2 .card{animation-delay:0.5s}.col-3 .card{animation-delay:0.6s}
    .card-label{font-size:13px;color:#A0AABC;font-weight:500}
    .card-amount{font-size:28px;font-weight:800;margin:8px 0 0;animation:amount-count 0.6s cubic-bezier(0.22,1,0.36,1) 0.8s backwards}
    .card-amount.green{color:#00E676;text-shadow:0 0 20px rgba(0,230,118,0.15)}
    .card-amount.red{color:#ff5c5c;text-shadow:0 0 20px rgba(255,92,92,0.15)}
    .card-header{display:flex;justify-content:space-between;align-items:flex-start}
    .card-icon{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;animation:icon-spin-in 0.6s cubic-bezier(0.22,1,0.36,1) 0.7s backwards}
    .card-icon.yellow-circle{background:linear-gradient(135deg, #D4FF00, #b8d400);color:#0B132B;box-shadow:0 0 12px rgba(212,255,0,0.2)}
    .mini-badge{font-size:11px;padding:4px 10px;border-radius:9999px;background:rgba(0,230,118,0.1);color:#00E676;border:1px solid rgba(0,230,118,0.2);font-weight:600}
    .mini-badge.positive{background:rgba(0,230,118,.15);color:#00E676;border-color:rgba(0,230,118,.3)}
    .mini-badge.negative{background:rgba(255,92,92,.15);color:#ff5c5c;border-color:rgba(255,92,92,.3)}
    .mini-btn{border:1px solid rgba(52,152,219,0.25);background:rgba(52,152,219,0.1);color:#3498DB;padding:6px 12px;border-radius:9999px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s}
    .mini-btn:hover{background:rgba(52,152,219,0.18)}
    .col-1{display:flex;flex-direction:column;gap:18px}
    .balance-card{flex:1}
    .balance-row{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);animation:slide-right 0.5s cubic-bezier(0.22,1,0.36,1) backwards}
    .balance-row:nth-child(2){animation-delay:0.9s}.balance-row:nth-child(3){animation-delay:1s}
    .balance-row:last-child{border-bottom:none}
    .row-icon{width:28px;height:28px;border-radius:50%;background:rgba(0,230,118,0.08);color:#00E676;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;border:1px solid rgba(0,230,118,0.12)}
    .row-label{flex:1;font-size:13px;color:#A0AABC}
    .row-value{font-size:14px;font-weight:700;color:#00E676}
    .card-sub{font-size:12px;color:#6b7280;margin:-2px 0 0}
    .balance-row{margin-top:6px}
    .row-icon.income{background:rgba(0,230,118,0.1);color:#00E676;border-color:rgba(0,230,118,0.2)}
    .row-icon.expense{background:rgba(255,92,92,0.1);color:#ff5c5c;border-color:rgba(255,92,92,0.2)}
    .row-value.income{color:#00E676}.row-value.expense{color:#ff5c5c}
    .gastado-card{flex:1}
    .line-chart{width:100%;height:60px;margin-top:12px;animation:line-glow-pulse 4s ease-in-out infinite}
    .line-chart path:first-child{stroke-dasharray:600;animation:line-draw 2s cubic-bezier(0.22,1,0.36,1) 0.6s forwards;stroke-dashoffset:600}
    .line-chart path:last-child{opacity:0;animation:fade-in 1s ease 2s forwards}
    .line-labels{display:flex;justify-content:space-between;margin-top:6px}
    .line-labels span{font-size:10px;color:#6b7280}
    .line-pt{fill:#D4FF00;filter:drop-shadow(0 0 4px rgba(212,255,0,0.8))}
    .line-val{font-size:9px;fill:#D4FF00;font-weight:700}
    .gastos-card{height:100%}
    .bar-chart-area{display:flex;gap:10px;flex:1;margin-top:16px;align-items:flex-end}
    .y-axis{display:flex;flex-direction:column;justify-content:space-between;padding-bottom:24px;flex-shrink:0}
    .y-axis span{font-size:11px;color:#A0AABC;text-align:right;width:42px;font-weight:600}
    .bars-container{display:flex;align-items:flex-end;gap:10px;flex:1;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.06);height:100%;min-height:170px;position:relative}
    .chart-gridlines{position:absolute;inset:0 0 24px 0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}
    .gridline{height:1px;background:rgba(255,255,255,0.06);border-top:1px dashed rgba(255,255,255,0.06)}
    .bar-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;position:relative;z-index:1}
    .bar-value{font-size:10px;color:#00E676;font-weight:800;background:rgba(0,230,118,0.14);padding:2px 6px;border-radius:6px;border:1px solid rgba(0,230,118,0.22);line-height:1;white-space:nowrap}
    .bar{width:100%;max-width:46px;border-radius:10px 10px 4px 4px;transform-origin:bottom;animation:bar-grow 0.8s cubic-bezier(0.34,1.56,0.64,1) backwards;position:relative;overflow:hidden}
    .bar.bar-cur{box-shadow:0 0 18px rgba(0,230,118,0.45);border-color:#00E676}
    .bar-label.cur{color:#00E676;font-weight:800}
    .bar::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);animation:bar-shine 3s ease-in-out infinite}
    .bar-group:nth-child(1) .bar{animation-delay:0.5s}.bar-group:nth-child(2) .bar{animation-delay:0.65s}.bar-group:nth-child(3) .bar{animation-delay:0.8s}.bar-group:nth-child(4) .bar{animation-delay:0.95s}.bar-group:nth-child(5) .bar{animation-delay:1.1s}.bar-group:nth-child(6) .bar{animation-delay:1.25s}
    .bar-top{width:100%;height:6px;border-radius:10px 10px 0 0}
    .green-bar{background:linear-gradient(180deg, #00E676, #00D285);box-shadow:0 0 10px rgba(0,230,118,0.22);border:1px solid rgba(0,230,118,0.25)}
    .green-bar .bar-top{background:#00E676;box-shadow:0 0 6px rgba(0,230,118,0.4)}
    .dark-bar{background:linear-gradient(180deg, #2A3040, #1F2430);border:1px solid rgba(255,255,255,0.04);opacity:0.7}
    .dark-bar .bar-top{background:#2A3040}
    .bar-label{font-size:11px;color:#A0AABC;font-weight:600}
    .bar-group:hover .bar{transform:scaleY(1.02);filter:brightness(1.1)}
    .no-data-hint{font-size:11px;color:#6b7280;text-align:center;margin-top:10px}
    .cartera-card{justify-content:flex-start}
    .gauge-wrap{display:flex;justify-content:center;margin:8px 0;position:relative}
    .gauge{width:170px;height:100px;animation:fade-in 0.8s ease-out 0.6s backwards}
    .gauge path:nth-child(2){stroke-dasharray:251;stroke-dashoffset:251;animation:gauge-draw 1.5s cubic-bezier(0.22,1,0.36,1) 0.8s forwards;filter:drop-shadow(0 0 4px rgba(0,230,118,0.4))}
    .gauge line{transform-origin:100px 100px;animation:needle-swing 1.5s cubic-bezier(0.22,1,0.36,1) 0.8s backwards}
    .categories{display:flex;flex-direction:column;gap:8px;margin-top:12px;max-height:220px;overflow-y:auto;padding-right:4px}
    .categories::-webkit-scrollbar{width:4px}.categories::-webkit-scrollbar-thumb{background:rgba(0,230,118,0.2);border-radius:9999px}
    .category-row{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.03);transition:all 0.3s ease;animation:slide-right 0.5s cubic-bezier(0.22,1,0.36,1) backwards}
    .category-row:nth-child(1){animation-delay:1s}.category-row:nth-child(2){animation-delay:1.15s}
    .category-row:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.06);transform:translateX(2px)}
    .category-row.filtered{opacity:0.3}
    .cat-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;animation:dot-pulse 2s ease-in-out infinite;border:1.5px solid rgba(255,255,255,0.15)}
    .cat-name{flex:1;font-size:13px;color:#FFFFFF;font-weight:500}
    .cat-amount{font-size:13px;font-weight:700;min-width:62px;text-align:right}
    .cat-pct{font-size:11px;color:#A0AABC;font-weight:700;background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:6px;min-width:36px;text-align:center}
    .cat-amount.green{color:#00E676}.cat-amount.red{color:#E74C3C}.cat-amount.muted{color:#6b7280}
    .cat-grupo{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;color:#00E676;text-transform:uppercase;letter-spacing:0.6px;margin:4px 0 2px;padding:0 2px}
    .cat-grupo i{font-size:10px}
    .cat-grupo + .category-row{animation-delay:0s}
    .gauge-txt{fill:#A0AABC;font-size:10px;font-weight:600}
    .gauge-hint{font-size:11px;color:#6b7280;text-align:center;margin-top:10px;line-height:1.4}
    @media (max-width:1100px){.cards-grid{grid-template-columns:1fr 1fr}.col-3{grid-column:1 / -1}}
    @media (max-width:768px){.app-layout{grid-template-columns:1fr}.sidebar{display:none}.cards-grid{grid-template-columns:1fr}.header{padding:14px 16px}.search-box{width:180px}.profile-text{display:none}.main-title{font-size:1.8rem}}
    .toast{position:fixed;bottom:24px;right:24px;display:flex;align-items:center;gap:12px;background:#111827;border:1px solid #00E676;border-left:4px solid #00E676;color:#fff;padding:14px 18px;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:5000;animation:slide-up .4s cubic-bezier(.22,1,.36,1);font-size:13px;font-weight:500}
    .toast i{color:#00E676;font-size:18px}
    .toast.toast-error{border-color:#ff5c5c;border-left-color:#ff5c5c}.toast.toast-error i{color:#ff5c5c}
    .toast.toast-info{border-color:#3498DB;border-left-color:#3498DB}.toast.toast-info i{color:#3498DB}
  `]
})
export class DashboardComponent implements OnInit {
  menuAbierto = false;
  settingsAbierto = false;
  busqueda = '';

  totalBalanceStr = '0.00';
  totalMesStr = '0.00';
  totalAnioStr = '0.00';
  ingresosTotalesStr = '0.00';
  gastosTotalesStr = '0.00';
  balanceNetoStr = '0.00';
  ingresosTotales = 0;
  gastosTotales = 0;
  balanceNeto = 0;
  metaGauge = 5000;

  barrasMeses: { etiqueta: string; monto: number; altura: number }[] = [];
  yLabels: string[] = ['0','0','0','0','0'];
  ingresosTop: { nombre: string; monto: string; color: string; pct: number }[] = [];
  gastosTop: { nombre: string; monto: string; color: string; pct: number }[] = [];

  linePathD = 'M0,78 L320,78';
  linePuntos: { x: number; y: number; txt: string }[] = [];
  lineLabels: string[] = [];
  gaugeArcD = 'M20,100 A80,80 0 0,1 22,96';
  needleX = 30;
  needleY = 95;

  mesNombre = '';
  anioActual = new Date().getFullYear();

  verNotificaciones = false;
  verMensajes = false;
  notificaciones: { titulo:string; detalle:string; hora:string; color:string }[] = [];
  mensajes: { de:string; texto:string; hora:string }[] = [];
  numNotificaciones = 0;
  numMensajes = 0;

  toastVisible = false;
  toastMensaje = '';
  toastTipo: 'success'|'error'|'info' = 'success';

  private colores: Record<string,string> = {
    Alimentacion: '#3b82f6',
    Transporte: '#10b981',
    Servicios: '#f59e0b',
    Entretenimiento: '#8b5cf6',
    Salud: '#ef4444',
    Educacion: '#06b6d4',
    Hogar: '#f97316',
    Otros: '#6b7280',
    Salario: '#00E676',
    Bono: '#10b981',
    Ventas: '#f1c40f',
    Inversiones: '#8b5cf6',
    Negocio: '#f97316',
    Regalo: '#06b6d4',
  };

  constructor(
    private router: Router,
    private gastosService: GastosService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  private usuarioLogueado: any = null;

  ngOnInit(): void {
    const hoy = new Date();
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    this.mesNombre = nombres[hoy.getMonth()];
    this.cargarNotificacionesIniciales();
    this.cargarResumen();
    this.gastosService.datosCambiaron$.subscribe(() => {
      this.cargarResumen();
    });
    this.authService.currentUser$.subscribe((u) => {
      if (u) {
        this.usuarioLogueado = u;
        this.cdr.detectChanges();
      }
    });
  }

  get nombreUsuario(): string {
    return this.usuarioLogueado?.fullName || 'Usuario';
  }
  get fotoUsuario(): string {
    return this.usuarioLogueado?.avatar || '';
  }

  private cargarNotificacionesIniciales(){
    const stored = localStorage.getItem('fv_notificaciones');
    if(stored){
      try{ const arr = JSON.parse(stored); this.notificaciones = arr; this.numNotificaciones = arr.length; }catch{}
    }
    const msgs = localStorage.getItem(this.authService.mensajeKey());
    if(msgs){ try{ this.mensajes = JSON.parse(msgs);}catch{} }
    if(this.mensajes.length===0){
      this.mensajes = [{de:'FinVanguard', texto:'¡Bienvenido! Registra tus ingresos para ver el dashboard cobrar vida.', hora:'Ahora'}];
      this.numMensajes = 1;
    } else this.numMensajes = this.mensajes.length;
  }

  private guardarNotificaciones(){
    localStorage.setItem('fv_notificaciones', JSON.stringify(this.notificaciones.slice(0,20)));
  }

  cargarResumen(): void {
    forkJoin({
      ingresos: this.gastosService.resumenIngresos(),
      gastos: this.gastosService.resumen()
    }).subscribe({
      next: ({ ingresos, gastos }) => {
        this.ingresosTotales = Number(ingresos.totalIngresos || 0);
        this.ingresosTotalesStr = this.fmt(this.ingresosTotales);

        this.gastosTotales = Number(gastos.totalGastado || 0);
        this.gastosTotalesStr = this.fmt(this.gastosTotales);
        this.totalMesStr = this.fmt(gastos.totalMes);
        this.totalAnioStr = this.fmt(gastos.totalAnio);

        this.construirBarras(gastos.gastosMensuales || []);
        this.construirCategorias(ingresos.porCategoria || {}, gastos.porCategoria || {});
        this.generarLinea(gastos.gastosMensuales || []);
        this.actualizarBalance();

        if (this.ingresosTotales > 0) this.agregarNotificacion(`Ingresos totales Q${this.ingresosTotalesStr}`, 'Actualizado desde ingresos', '#00E676', false);
      },
      error: (err) => {
        if (err && err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/']);
        }
        this.mostrarToast('No se pudieron cargar los datos', 'error');
      }
    });
  }

  recargar(){ this.cargarResumen(); this.mostrarToast('Datos actualizados'); }

  private actualizarBalance(): void {
    this.balanceNeto = this.ingresosTotales - this.gastosTotales;
    this.balanceNetoStr = this.fmt(this.balanceNeto);
    this.totalBalanceStr = this.balanceNetoStr;
    this.construirTacometro();
  }

  construirBarras(mensuales: {mes:string;monto:number}[]): void {
    if(!mensuales.length){ this.barrasMeses=[]; this.yLabels=['0','0','0','0','0']; return; }
    const max = Math.max(...mensuales.map(m=>m.monto),1);
    // última 6 meses
    const ultimos = mensuales.slice(-6);
    this.barrasMeses = ultimos.map(m=> ({
      etiqueta: m.mes.substring(0,3),
      monto: m.monto,
      altura: m.monto===0 ? 6 : Math.max(10, Math.round((m.monto/max)*100))
    }));
    const step = max/4;
    this.yLabels = [this.fmt(max), this.fmt(step*3), this.fmt(step*2), this.fmt(step), '0'];
  }

  construirCategorias(porIngreso: Record<string,number>, porGasto: Record<string,number>): void {
    const totalIn = Object.values(porIngreso).reduce((s,v)=> s + Number(v), 0) || 1;
    const totalGa = Object.values(porGasto).reduce((s,v)=> s + Number(v), 0) || 1;
    this.ingresosTop = Object.entries(porIngreso).sort((a,b)=>Number(b[1])-Number(a[1])).map(([nombre,monto])=> ({
      nombre,
      monto: Number(monto).toFixed(2),
      color: this.colores[nombre]||'#00E676',
      pct: Math.round((Number(monto)/totalIn)*100)
    }));
    this.gastosTop = Object.entries(porGasto).sort((a,b)=>Number(b[1])-Number(a[1])).map(([nombre,monto])=> ({
      nombre,
      monto: Number(monto).toFixed(2),
      color: this.colores[nombre]||'#E74C3C',
      pct: Math.round((Number(monto)/totalGa)*100)
    }));
  }

  generarLinea(mensuales: {mes:string;monto:number}[]): void {
    this.linePuntos = [];
    if(!mensuales.length){ this.linePathD='M0,78 L320,78'; this.lineLabels=[]; return; }
    const slice = mensuales.slice(-6);
    if(slice.every(m=>m.monto===0)){ this.linePathD='M0,78 L320,78'; this.lineLabels = slice.map(s=>s.mes.substring(0,3)); return; }
    const max = Math.max(...slice.map(m=>m.monto),1);
    const n = slice.length;
    const paso = 320/(n-1||1);
    let d='';
    slice.forEach((m,i)=>{
      const x = i*paso;
      const y = 78 - (m.monto/max)*70;
      d += (i===0?'M':' L')+`${x.toFixed(1)},${y.toFixed(1)}`;
      this.linePuntos.push({ x: Math.round(x*10)/10, y: Math.max(10, Math.round(y*10)/10), txt: 'Q'+Math.round(m.monto) });
    });
    this.linePathD = d;
    this.lineLabels = slice.map(s=>s.mes.substring(0,3));
  }

  construirTacometro(): void {
    const total = Math.max(this.balanceNeto,0);
    // meta = max entre meta guardada y 5000
    const metas = localStorage.getItem('metas');
    let metaGuardada = 0;
    if(metas){ try{ metaGuardada = Number(JSON.parse(metas).metaMensual)||0; }catch{} }
    const meta = Math.max(total*1.2, metaGuardada||5000, 5000);
    this.metaGauge = meta;
    const pct = Math.min(total/meta,1);
    const angulo = pct*180;
    const rad = (angulo-180)*Math.PI/180;
    this.needleX = Math.round(100+80*Math.cos(rad));
    this.needleY = Math.round(100+80*Math.sin(rad));
    const ex = 100+80*Math.cos(rad);
    const ey = 100+80*Math.sin(rad);
    this.gaugeArcD = `M20,100 A80,80 0 0,1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
  }

  toggleSettings(e: MouseEvent){ e.stopPropagation(); this.settingsAbierto=!this.settingsAbierto; this.verNotificaciones=false; this.verMensajes=false; this.menuAbierto=false; }
  toggleNotificaciones(){ this.verNotificaciones=!this.verNotificaciones; this.verMensajes=false; this.settingsAbierto=false; this.menuAbierto=false; if(this.verNotificaciones) this.numNotificaciones=0; }
  toggleMensajes(){ this.verMensajes=!this.verMensajes; this.verNotificaciones=false; this.settingsAbierto=false; this.menuAbierto=false; if(this.verMensajes) this.numMensajes=0; }
  cerrarDropdowns(){ this.verNotificaciones=false; this.verMensajes=false; this.settingsAbierto=false; this.menuAbierto=false; }

  agregarNotificacion(titulo:string, detalle:string, color:string, toast=true){
    const ahora=new Date(); const hora=`${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2,'0')}`;
    this.notificaciones.unshift({titulo,detalle,hora,color});
    this.numNotificaciones = this.verNotificaciones?0:this.notificaciones.length;
    this.guardarNotificaciones();
    if(toast) this.mostrarToast(titulo);
  }
  limpiarNotificaciones(){ this.notificaciones=[]; this.numNotificaciones=0; this.guardarNotificaciones(); this.verNotificaciones=false; }
  filtrarBusqueda(){ if(this.busqueda.length>2) this.mostrarToast(`Filtrando: ${this.busqueda}`,'info'); }

  irPerfil(){ this.settingsAbierto=false; this.router.navigate(['/perfil']); }
  limpiarDatos(){ if(confirm('¿Borrar notificaciones y metas locales?')){ localStorage.removeItem('fv_notificaciones'); localStorage.removeItem('fv_mensajes'); localStorage.removeItem('metas'); this.notificaciones=[]; this.numNotificaciones=0; this.mostrarToast('Datos locales borrados'); this.settingsAbierto=false; } }

  mostrarToast(mensaje:string, tipo:'success'|'error'|'info'='success'){
    this.toastMensaje=mensaje; this.toastTipo=tipo; this.toastVisible=true; setTimeout(()=>this.toastVisible=false,3500);
    if(tipo!=='info'){
      // también crear notificación interna
      if(tipo==='success' && !mensaje.includes('Notific')) {
        // evitar duplicar
      }
    }
  }

  get isPositive(): boolean { return this.balanceNeto >= 0; }
  get isNegative(): boolean { return this.balanceNeto < 0; }
  get badgeTexto(): string { return this.balanceNeto >= 0 ? 'Positivo' : 'Negativo'; }
  get sinGastos(): boolean { return this.barrasMeses.length > 0 && this.barrasMeses.every(b => b.monto === 0); }
  get tieneNotificaciones(): boolean { return this.numNotificaciones > 0; }
  get tieneMensajes(): boolean { return this.numMensajes > 0; }
  get sinNotificaciones(): boolean { return this.notificaciones.length === 0; }
  get sinMensajes(): boolean { return this.mensajes.length === 0; }
  get sinCategorias(): boolean { return this.ingresosTop.length === 0 && this.gastosTop.length === 0; }
  tieneMonto(m:number): boolean { return m > 0; }
  esFiltrado(nombre:string): boolean { return !!this.busqueda && nombre.toLowerCase().indexOf(this.busqueda.toLowerCase()) === -1; }

  private fmt(n:number): string { return Number(n||0).toFixed(2); }

  cerrarSesion(): void {
    this.authService.logout();
    this.mostrarToast('Sesión cerrada');
    setTimeout(()=> this.router.navigate(['/']), 400);
  }
  irIngresos(): void { this.router.navigate(['/ingresos']); }
  irGastos(): void { this.router.navigate(['/gastos']); }
  irAhorros(): void { this.router.navigate(['/ahorros']); }
}
