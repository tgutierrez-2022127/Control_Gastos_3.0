import { Component, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { GastosService, Gasto } from '../../services/gastos.service';
import { AuthService } from '../../auth/auth.service';

type Periodo = 'mes' | 'anio' | 'todo';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-layout" (click)="cerrarDropdowns()">
      <!-- ===== SIDEBAR ===== -->
      <aside class="sidebar">
        <div class="sidebar-top">
          <div class="sidebar-logo"><img src="assets/Logo_Fin.jpg" alt="FinVanguard" class="sidebar-logo-img"></div>
          <nav class="sidebar-menu">
            <button class="side-icon" title="Inicio" (click)="ir('/dashboard')"><i class="fas fa-home"></i></button>
            <button class="side-icon" title="Ingresos" (click)="ir('/ingresos')"><i class="fas fa-university"></i></button>
            <button class="side-icon active" title="Gastos" (click)="ir('/gastos')"><i class="fas fa-exchange-alt"></i></button>
            <button class="side-icon" title="Ahorro" (click)="ir('/ahorros')"><i class="fas fa-piggy-bank"></i></button>
          </nav>
        </div>
        <div class="sidebar-bottom" style="position:relative;">
          <button class="side-icon" title="Configuración" (click)="toggleSettings($event)"><i class="fas fa-cog" [class.spin]="settingsAbierto"></i></button>
          <div class="settings-menu" *ngIf="settingsAbierto" (click)="$event.stopPropagation()">
            <button class="menu-item" (click)="settingsAbierto=false; ir('/perfil')"><i class="fas fa-user-circle"></i> Mi perfil</button>
            <button class="menu-item" (click)="toast('Soporte: escribir a soporte@finvanguard.gt','info'); settingsAbierto=false"><i class="fas fa-headset"></i> Soporte / Ayuda</button>
            <div class="menu-divider"></div>
            <button class="menu-item logout" (click)="cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
          </div>
        </div>
      </aside>

      <!-- ===== CONTENIDO ===== -->
      <div class="content">
        <header class="topbar">
          <div class="search">
            <i class="fas fa-search search-icon"></i>
            <input type="text" placeholder="Buscar..." class="search-input" [(ngModel)]="busqueda" (input)="aplicarBusqueda()">
          </div>
          <div class="top-right">
            <div class="notif-wrap" (click)="$event.stopPropagation()">
              <button class="icon-btn" title="Notificaciones" (click)="toggleNotificaciones()"><i class="fas fa-bell"></i></button>
              <span class="notif-badge" *ngIf="numNotificaciones>0">{{numNotificaciones}}</span>
              <div class="notif-dropdown" *ngIf="verNotificaciones">
                <div class="notif-header">Notificaciones</div>
                <div class="notif-item" *ngFor="let n of notificaciones">
                  <span><i class="fas fa-circle" style="font-size:7px;color:#16A085"></i> {{n.hora}}</span>
                  <p>{{n.texto}}</p>
                </div>
                <div class="notif-empty" *ngIf="notificaciones.length===0">Sin notificaciones</div>
              </div>
            </div>
            <div class="notif-wrap" (click)="$event.stopPropagation()">
              <button class="icon-btn" title="Mensajes" (click)="toggleMensajes()"><i class="fas fa-envelope"></i></button>
              <span class="notif-badge" *ngIf="tieneMensajes">{{numMensajes}}</span>
              <div class="notif-dropdown" *ngIf="verMensajes">
                <div class="notif-header">Mensajes</div>
                <div class="notif-item" *ngFor="let m of mensajes">
                  <span><strong>{{m.de}}</strong> · {{m.hora}}</span>
                  <p>{{m.texto}}</p>
                </div>
                <div class="notif-empty" *ngIf="mensajes.length===0">Sin mensajes</div>
              </div>
            </div>
            <div class="usuario" (click)="$event.stopPropagation()">
              <div class="avatar"><img *ngIf="fotoUsuario" [src]="fotoUsuario" alt="Foto"><i *ngIf="!fotoUsuario" class="fas fa-user"></i></div>
              <div class="u-text">
                <span class="u-hola">Hola,</span>
                <span class="u-nombre">{{nombreUsuario}}</span>
              </div>
              <button class="chevron" title="Mi cuenta" (click)="toggleUsuarioMenu($event)"><i class="fas fa-chevron-down"></i></button>
              <div class="usuario-menu" *ngIf="menuPerfil" (click)="$event.stopPropagation()">
                <button class="menu-item" (click)="menuPerfil=false; ir('/perfil')"><i class="fas fa-user-circle"></i> Mi perfil</button>
                <div class="menu-divider"></div>
                <button class="menu-item logout" (click)="cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
              </div>
            </div>
          </div>
        </header>

        <main class="dashboard">
          <!-- ENCABEZADO -->
          <section class="sec-titulo">
            <div class="sec-left">
              <h1 class="main-title">Gastos</h1>
              <p class="main-subtitle">Controle y visualice sus gastos</p>
            </div>
            <div class="per-rel" (click)="$event.stopPropagation()">
              <button class="periodo-btn" (click)="periodoAbierto=!periodoAbierto">
                <span><i class="fas fa-calendar-day"></i> {{periodoLabel}}</span>
                <i class="fas fa-chevron-down pd"></i>
              </button>
              <div class="per-menu" *ngIf="periodoAbierto">
                <button (click)="setPeriodo('mes')"><i class="fas fa-calendar-day"></i> Este mes</button>
                <button (click)="setPeriodo('anio')"><i class="fas fa-calendar-alt"></i> Este año</button>
                <button (click)="setPeriodo('todo')"><i class="fas fa-clock"></i> Todo</button>
              </div>
            </div>
          </section>

          <!-- TARJETAS RESUMEN -->
          <section class="row-cards">
            <article class="card c-total">
              <div class="card-head">
                <p class="c-lbl">Total gastado</p>
                <div class="c-ic green"><i class="fas fa-wallet"></i></div>
              </div>
              <p class="c-val">Q{{fmt(totalGastado)}}</p>
              <p class="c-delta"><span class="delta" [class.neg]="deltaTotal<0">{{deltaTotal>=0?'▲':'▼'}} {{abs(deltaTotal).toFixed(1)}}%</span> <span class="vs">vs. mes anterior</span></p>
              <p class="c-sub">{{gastosFiltrados.length}} registros en el período</p>
            </article>
            <article class="card c-fijos">
              <div class="card-head">
                <p class="c-lbl">Gastos fijos</p>
                <div class="c-ic blue"><i class="fas fa-building"></i></div>
              </div>
              <p class="c-val">Q{{fmt(totalFijos)}}</p>
              <p class="c-delta"><span class="delta" [class.neg]="deltaFijos<0">{{deltaFijos>=0?'▲':'▼'}} {{abs(deltaFijos).toFixed(1)}}%</span> <span class="vs">vs. mes anterior</span></p>
              <p class="c-sub">{{conteoFijos}} gastos · servicios, hogar, educación y salud</p>
            </article>
            <article class="card c-var">
              <div class="card-head">
                <p class="c-lbl">Gastos variables</p>
                <div class="c-ic purple"><i class="fas fa-shopping-cart"></i></div>
              </div>
              <p class="c-val">Q{{fmt(totalVariables)}}</p>
              <p class="c-delta"><span class="delta" [class.neg]="deltaVariables<0">{{deltaVariables>=0?'▲':'▼'}} {{abs(deltaVariables).toFixed(1)}}%</span> <span class="vs">vs. mes anterior</span></p>
              <p class="c-sub">{{conteoVariables}} gastos · alimentación, transporte y entretenimiento</p>
            </article>
            <article class="card c-vamp">
              <div class="card-head">
                <p class="c-lbl">Gastos vampiros</p>
                <div class="c-ic pink"><i class="fas fa-ghost"></i></div>
              </div>
              <p class="c-val">Q{{fmt(totalVampiros)}}</p>
              <p class="c-delta"><span class="delta" [class.neg]="deltaVampiros<0">{{deltaVampiros>=0?'▲':'▼'}} {{abs(deltaVampiros).toFixed(1)}}%</span> <span class="vs">vs. mes anterior</span></p>
              <p class="c-sub">{{conteoVampiros}} vampiros activos · categoría Otros</p>
            </article>
          </section>

          <!-- GRAFICAS -->
          <section class="graf-row">
            <article class="card evo-card">
              <div class="card-head">
                <div class="t-row">
                  <p class="chart-titulo"><i class="fas fa-chart-line ct"></i> Evolución de gastos</p>
                  <p class="chart-sub">Así han cambiado sus gastos en los últimos 6 meses.</p>
                </div>
                <div class="chip-choice"><i class="fas fa-chevron-down"></i><span>Últimos 6 meses</span></div>
              </div>
              <div class="evo-wrap" *ngIf="hayEvo; else sinEvo">
                <svg viewBox="0 0 560 200" class="evo" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="evoGradG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#20D6C7" stop-opacity="0.45"/>
                      <stop offset="60%" stop-color="#20D6C7" stop-opacity="0.12"/>
                      <stop offset="100%" stop-color="#16A085" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <line *ngFor="let h of lineasH" [attr.x1]="plotL" [attr.x2]="560" [attr.y1]="h.y" [attr.y2]="h.y" class="evo-grilla"/>
                  <text *ngFor="let m of evoMontos" [attr.x]="plotL-8" [attr.y]="m.y" class="evo-y" text-anchor="end">{{m.txt}}</text>
                  <path [attr.d]="areaPath" class="evo-area" fill="url(#evoGradG)"/>
                  <path [attr.d]="lineaPath" class="evo-line"/>
                  <circle *ngFor="let p of evoPuntos" [attr.cx]="p.x" [attr.cy]="p.y" r="7" class="evo-halo"/>
                  <circle *ngFor="let p of evoPuntos" [attr.cx]="p.x" [attr.cy]="p.y" r="4" class="evo-punto"/>
                  <text *ngFor="let t of evoTextos" [attr.x]="t.x" [attr.y]="t.y" class="evo-val" text-anchor="middle">{{t.txt}}</text>
                  <text *ngFor="let e of evoLabels" [attr.x]="e.x" [attr.y]="e.y" class="evo-etq" text-anchor="middle">{{e.txt}}</text>
                </svg>
              </div>
              <ng-template #sinEvo><div class="sin-datos">Aún no hay gastos registrados en los últimos 6 meses</div></ng-template>
            </article>

            <article class="card dona-card">
              <p class="chart-titulo"><i class="fas fa-chart-pie ct"></i> Distribución por categoría</p>
              <div class="dd-body">
                <div class="dona-wrap">
                  <svg viewBox="0 0 190 190" class="dona">
                    <circle class="dona-base" cx="95" cy="95" r="78"/>
                    <circle *ngFor="let s of donaCortes" class="dona-corte" cx="95" cy="95" r="78"
                      [attr.stroke]="s.color" [attr.stroke-dasharray]="s.dash"/>
                  </svg>
                  <div class="dona-centro"><strong class="dona-n">Q{{fmt(donaTotal)}}</strong><span>Total gastado</span></div>
                </div>
                <div class="leyenda">
                  <div class="ley-row" *ngFor="let l of donaLeyenda">
                    <span class="dot" [style.background]="l.color"></span>
                    <i [class]="catIcon(l.cat)" class="ley-ic" [style.color]="l.color"></i>
                    <span class="ley-nom">{{l.nombre}}</span>
                    <span class="ley-monto">Q{{fmt(l.monto)}}</span>
                    <span class="ley-pct">{{l.porc.toFixed(1)}}%</span>
                  </div>
                  <div class="sin-datos" *ngIf="donaLeyenda.length===0">Sin gastos en este período</div>
                </div>
              </div>
            </article>
          </section>

          <!-- TABLA + VAMPIROS + ACCIONES -->
          <section class="row-baja">
            <article class="card tabla-card">
              <div class="card-head">
                <p class="chart-titulo"><i class="fas fa-receipt ct"></i> Últimos gastos registrados</p>
                <button class="ver-todos" (click)="toggleTodos()">{{mostrarTodos? 'Ver menos' : 'Ver todos'}}</button>
              </div>
              <div class="tbl-scroll">
                <table>
                  <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th>Método</th><th></th></tr></thead>
                  <tbody>
                    <tr *ngFor="let g of gastosVisibles">
                      <td class="fecha">{{fmtFecha(g.fecha)}}</td>
                      <td><span class="badge-cat" [style.background]="badgeColor(g.categoria)" [style.color]="colorCat(g.categoria)">{{nomCat(g.categoria)}}</span></td>
                      <td><strong>{{g.descripcion}}</strong></td>
                      <td class="monto">Q{{fmt(g.monto)}}</td>
                      <td class="fecha">{{g.metodo || 'Efectivo'}}</td>
                      <td>
                        <div class="acc-rel" (click)="$event.stopPropagation()">
                          <button class="acc-dots" title="Acciones" (click)="menuAcc=(menuAcc===g.id?null:g.id)"><i class="fas fa-ellipsis-h"></i></button>
                          <div class="acc-menu" *ngIf="menuAcc===g.id">
                            <button (click)="editar(g)"><i class="fas fa-pen"></i> Editar</button>
                            <button class="oldel" (click)="eliminar(g)"><i class="fas fa-trash"></i> Eliminar</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="sin-datos" *ngIf="gastosVisibles.length===0">No hay gastos en este período</div>
              </div>
            </article>

            <article class="card vamp-card">
              <div class="card-head">
                <p class="chart-titulo"><i class="fas fa-ghost ct"></i> Gastos vampiros</p>
                <button class="ver-todos" (click)="mostrarVampiros=!mostrarVampiros">{{mostrarVampiros? 'Ver menos' : 'Ver todos'}}</button>
              </div>
              <ul class="vamp-list">
                <li *ngFor="let v of vampirosVisibles" [class.controlado]="vampControlado(v.id)">
                  <span class="vamp-ic"><i class="fas fa-ghost"></i></span>
                  <div class="vamp-info">
                    <strong>{{v.descripcion}}</strong>
                    <span>{{nomCat(v.categoria)}} · {{fmtFecha(v.fecha)}}</span>
                  </div>
                  <span class="vamp-monto">Q{{fmt(v.monto)}}</span>
                  <label class="switch">
                    <input type="checkbox" [checked]="vampControlado(v.id)" (change)="toggleVampiro(v.id)">
                    <span class="slider"></span>
                  </label>
                </li>
              </ul>
              <div class="sin-datos" *ngIf="vampirosVisibles.length===0"><i class="fas fa-shield-alt"></i>No tiene gastos vampiros. Bien controlado.</div>
            </article>

            <article class="card acciones-card">
              <p class="chart-titulo"><i class="fas fa-bolt ct"></i> Acciones rápidas</p>
              <button class="btn-principal" (click)="abrirModal()"><i class="fas fa-plus"></i> Agregar gasto</button>
              <button class="btn-secundario" (click)="exportarExcel()"><i class="fas fa-file-excel"></i> Exportar a Excel</button>
              <p class="acc-ayuda"><i class="fas fa-lightbulb"></i> Registre sus egresos y encuentre las fugas de su presupuesto.</p>
            </article>
          </section>
        </main>
      </div>

      <!-- MODAL -->
      <div class="modal-mask" *ngIf="modalAbierto" (click)="cerrarModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>{{editandoId? 'Editar gasto' : 'Agregar gasto'}}</h3>
            <button class="modal-x" (click)="cerrarModal()"><i class="fas fa-times"></i></button>
          </div>
          <label class="campo">Descripción <input [(ngModel)]="form.descripcion" placeholder="Ej: Netflix mensual"/></label>
          <label class="campo">Monto (Q) <input type="number" min="0.01" step="0.01" [(ngModel)]="form.monto" placeholder="0.00"/></label>
          <label class="campo">Categoría
            <select [(ngModel)]="form.categoria"><option *ngFor="let c of categorias" [value]="c">{{nomCat(c)}}</option></select>
          </label>
          <label class="campo">Método
            <select [(ngModel)]="form.metodo"><option *ngFor="let m of metodos" [value]="m">{{m}}</option></select>
          </label>
          <label class="campo">Fecha <input type="date" [(ngModel)]="form.fecha" [max]="hoyISO()" [attr.max]="hoyISO()"/></label>
          <div class="modal-error" *ngIf="modalError">{{modalError}}</div>
          <div class="modal-btns">
            <button class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
            <button class="btn-guardar" (click)="guardar()" [disabled]="guardando">{{guardando? 'Guardando…':'Guardar'}}</button>
          </div>
        </div>
      </div>

      <div class="toast" *ngIf="toastActivo" [class.toast-error]="toastTipo==='error'" [class.toast-info]="toastTipo==='info'">
        <i [class]="toastTipo==='error' ? 'fas fa-exclamation-circle' : toastTipo==='info' ? 'fas fa-info-circle' : 'fas fa-check-circle'"></i>
        <span>{{toastTexto}}</span>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slide-left{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes fade-in{from{opacity:0}to{opacity:1}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    *{box-sizing:border-box}
    .app-layout{display:grid;grid-template-columns:90px 1fr;height:100vh;background:#071421;font-family:'Inter','Segoe UI',system-ui,sans-serif;color:#ECF0F1;overflow:hidden}
    .sidebar{background:linear-gradient(180deg,#060F1B 0%,#0B192C 100%);border-right:1px solid rgba(52,152,219,.08);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:26px 0;z-index:10;animation:slide-left .6s cubic-bezier(.22,1,.36,1)}
    .sidebar-logo{width:64px;height:64px;border-radius:50%;background:#FFFFFF;border:2px solid #FFFFFF;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:34px;box-shadow:0 4px 20px rgba(0,0,0,0.25),0 0 0 1px rgba(255,255,255,0.8)}
    .sidebar-logo-img{width:100%;height:100%;padding:6px;object-fit:contain;background:#FFFFFF !important;border-radius:50%;display:block}
    .sidebar-menu{display:flex;flex-direction:column;align-items:center;gap:24px}
    .side-icon{width:44px;height:44px;border-radius:13px;background:transparent;border:1px solid transparent;color:#94A3B8;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.22,1,.36,1);position:relative}
    .side-icon:hover{color:#ECF0F1;background:rgba(22,160,133,.08);transform:translateY(-1px)}
    .side-icon.active{background:rgba(212,255,0,.12);border:1px solid rgba(212,255,0,.35);color:#D4FF00;box-shadow:0 0 20px rgba(212,255,0,.25)}
    .side-icon.active::after{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:#D4FF00;border-radius:0 3px 3px 0;box-shadow:0 0 8px rgba(212,255,0,.5)}
    .side-icon .spin{animation:spin .6s ease}
    .sidebar-bottom{position:relative}
    .settings-menu{position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%);background:#0B192C;border:1px solid #16476A;border-radius:14px;padding:6px;min-width:200px;z-index:60;box-shadow:0 18px 45px rgba(0,0,0,.55);animation:slide-left .3s cubic-bezier(.22,1,.36,1)}
    .menu-item{width:100%;padding:11px 14px;border:none;border-radius:8px;background:transparent;color:#ECF0F1;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all .25s ease;text-align:left}
    .menu-item:hover{background:rgba(22,160,133,.12);padding-left:18px}
    .menu-item i{color:#16A085;width:16px;text-align:center;font-size:13px}
    .menu-item.logout i{color:#FF4D6D}
    .menu-divider{height:1px;background:rgba(52,152,219,.2);margin:6px 0}
    .content{display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 24px 10px;flex-shrink:0;gap:16px;animation:fade-in .6s ease-out .2s backwards}
    .search{display:flex;align-items:center;gap:10px;width:300px;height:42px;background:#0B192C;border:1px solid #12324A;border-radius:22px;padding:0 16px;transition:all .3s ease}
    .search:focus-within{border-color:rgba(22,160,133,.5);box-shadow:0 0 16px rgba(22,160,133,.12)}
    .search-icon{color:#94A3B8;font-size:13px}
    .search-input{background:transparent;border:none;outline:none;color:#ECF0F1;font-size:13px;font-family:inherit;width:100%}
    .search-input::placeholder{color:#64748B}
    .top-right{display:flex;align-items:center;gap:14px;margin-left:auto}
    .notif-wrap{position:relative}
    .icon-btn{width:42px;height:42px;border-radius:12px;background:#0B192C;border:1px solid #12324A;color:#94A3B8;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s ease}
    .icon-btn:hover{color:#16A085;border-color:rgba(22,160,133,.4);transform:translateY(-1px)}
    .notif-badge{position:absolute;top:-5px;right:-5px;background:#3498DB;color:#fff;font-size:9px;font-weight:800;min-width:17px;height:17px;border-radius:9999px;display:flex;align-items:center;justify-content:center;padding:0 5px;border:1.5px solid #071421}
    .notif-dropdown{position:absolute;top:48px;right:0;width:320px;background:#0B192C;border:1px solid #16476A;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:300;max-height:380px;overflow-y:auto;animation:slide-up .3s ease}
    .notif-header{padding:12px 16px;font-size:13px;font-weight:700;color:#ECF0F1;border-bottom:1px solid rgba(52,152,219,.2);background:rgba(22,160,133,.08)}
    .notif-item{padding:12px 16px;border-bottom:1px solid rgba(52,152,219,.08)}
    .notif-item:last-child{border-bottom:none}
    .notif-item span{font-size:12px;color:#16A085;font-weight:600}
    .notif-item p{margin:4px 0 0;font-size:12px;color:#94A3B8;line-height:1.4}
    .notif-empty{padding:24px;text-align:center;font-size:12px;color:#64748B}
    .usuario{display:flex;align-items:center;gap:11px;position:relative;background:#0B192C;border:1px solid #12324A;border-radius:14px;padding:7px 12px;cursor:pointer}
    .avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#16A085,#3498DB);display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;overflow:hidden}
    .avatar img{width:100%;height:100%;object-fit:cover}
    .u-text{display:flex;flex-direction:column;line-height:1.25}
    .u-hola{font-size:11px;color:#94A3B8}
    .u-nombre{font-size:13px;font-weight:700;color:#16A085}
    .chevron{background:none;border:none;color:#94A3B8;cursor:pointer;font-size:11px}
    .usuario-menu{position:absolute;top:58px;right:0;background:#0B192C;border:1px solid #16476A;border-radius:14px;padding:6px;min-width:190px;z-index:70;box-shadow:0 18px 45px rgba(0,0,0,.55);animation:slide-up .3s cubic-bezier(.22,1,.36,1)}
    .dashboard{flex:1;padding:8px 24px 28px;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
    .sec-titulo{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;animation:slide-up .6s cubic-bezier(.22,1,.36,1) .3s backwards}
    .main-title{font-size:30px;font-weight:800;color:#16A085;margin:0;line-height:1.1}
    .main-subtitle{font-size:14px;color:#94A3B8;margin:4px 0 0}
    .per-rel{position:relative}
    .periodo-btn{display:flex;align-items:center;gap:10px;justify-content:space-between;min-width:170px;background:#0B192C;border:1px solid #16476A;border-radius:13px;padding:12px 16px;color:#ECF0F1;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .3s ease}
    .periodo-btn:hover{border-color:rgba(22,160,133,.5)}
    .periodo-btn i:first-child{color:#16A085}
    .pd{font-size:10px;color:#94A3B8}
    .per-menu{position:absolute;top:50px;right:0;min-width:190px;background:#0B192C;border:1px solid #16476A;border-radius:14px;padding:6px;z-index:80;box-shadow:0 18px 45px rgba(0,0,0,.55);animation:slide-up .3s cubic-bezier(.22,1,.36,1)}
    .per-menu button{width:100%;padding:11px 14px;border:none;border-radius:8px;background:transparent;color:#ECF0F1;font-size:13px;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;text-align:left;transition:all .2s ease}
    .per-menu button:hover{background:rgba(22,160,133,.12)}
    .per-menu button i{color:#16A085;width:16px;text-align:center}
    .row-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;animation:slide-up .7s cubic-bezier(.22,1,.36,1) backwards}
    .card{background:linear-gradient(180deg,#0B192C 0%,#081421 100%);border:1px solid #12324A;border-radius:13px;padding:20px;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,.3);transition:all .35s ease;position:relative;overflow:hidden}
    .card:hover{border-color:rgba(22,160,133,.35);transform:translateY(-2px);box-shadow:0 14px 34px rgba(0,0,0,.4)}
    .c-total::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#16A085,#20D6C7);opacity:.7}
    .c-fijos::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#3498DB,#20D6C7);opacity:.7}
    .c-var::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#8E5AD7,#3498DB);opacity:.7}
    .c-vamp::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#FF4D6D,#FF7A59);opacity:.7}
    .card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .c-lbl{font-size:12px;color:#94A3B8;font-weight:600;margin:0;text-transform:uppercase;letter-spacing:.6px}
    .c-ic{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-size:18px;flex:none}
    .c-ic.green{background:rgba(22,160,133,.18);color:#20D6C7;box-shadow:0 0 16px rgba(22,160,133,.3)}
    .c-ic.blue{background:rgba(52,152,219,.18);color:#3498DB;box-shadow:0 0 16px rgba(52,152,219,.3)}
    .c-ic.purple{background:rgba(142,90,215,.18);color:#8E5AD7;box-shadow:0 0 16px rgba(142,90,215,.3)}
    .c-ic.pink{background:rgba(255,77,109,.18);color:#FF4D6D;box-shadow:0 0 16px rgba(255,77,109,.3)}
    .c-val{font-size:25px;font-weight:800;color:#ECF0F1;margin:12px 0 6px;line-height:1}
    .c-delta{font-size:12px;margin:0}
    .delta{color:#20D6C7;font-weight:700}
    .delta.neg{color:#FF4D6D}
    .vs{color:#64748B}
    .c-sub{font-size:11px;color:#64748B;margin:8px 0 0;line-height:1.5}
    .graf-row{display:grid;grid-template-columns:60fr 40fr;gap:14px;align-items:stretch}
    .chart-titulo{font-size:15px;font-weight:700;color:#16A085;margin:0;display:flex;align-items:center;gap:9px}
    .ct{color:#16A085}
    .chart-sub{font-size:12px;color:#94A3B8;margin:6px 0 0}
    .chip-choice{display:flex;align-items:center;gap:8px;background:#0B192C;border:1px solid #16476A;border-radius:12px;padding:9px 14px;cursor:default;white-space:nowrap;font-size:12px;color:#94A3B8}
    .evo-wrap{margin-top:14px;width:100%}
    .evo{width:100%;height:250px;display:block}
    .evo-grilla{stroke:rgba(52,152,219,.16);stroke-width:1}
    .evo-y{font-size:10px;fill:#64748B;font-family:'Inter',sans-serif}
    .evo-area{stroke:none}
    .evo-line{fill:none;stroke:#20D6C7;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 2px 6px rgba(32,214,199,.4))}
    .evo-halo{fill:rgba(32,214,199,.18)}
    .evo-punto{fill:#20D6C7}
    .evo-val{font-size:10px;fill:#ECF0F1;font-family:'Inter',sans-serif}
    .evo-etq{font-size:11px;fill:#64748B;font-family:'Inter',sans-serif}
    .dona-card{gap:10px}
    .dd-body{display:flex;align-items:center;gap:18px;margin-top:8px;flex-wrap:wrap}
    .dona-wrap{position:relative;width:160px;flex:none;margin:0 auto}
    .dona{width:160px;height:160px;transform:rotate(-90deg)}
    .dona-base{fill:none;stroke:#12324A;stroke-width:20}
    .dona-corte{fill:none;stroke-width:20;transition:stroke-dasharray .6s}
    .dona-centro{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
    .dona-n{font-size:14px;font-weight:800;color:#ECF0F1}
    .dona-centro span{font-size:11px;color:#94A3B8;margin-top:3px}
    .leyenda{flex:1;min-width:180px;display:flex;flex-direction:column}
    .ley-row{display:flex;align-items:center;gap:9px;padding:9px 2px;border-bottom:1px solid rgba(52,152,219,.14);font-size:12px}
    .ley-row:last-child{border-bottom:none}
    .dot{width:9px;height:9px;border-radius:50%;flex:none}
    .ley-ic{flex:none;font-size:12px;width:15px;text-align:center}
    .ley-nom{color:#ECF0F1;font-weight:600;flex:1}
    .ley-monto{color:#94A3B8;font-weight:600;white-space:nowrap}
    .ley-pct{color:#20D6C7;font-weight:700;min-width:42px;text-align:right}
    .row-baja{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;align-items:start}
    .tabla-card{gap:14px}
    .ver-todos{background:none;border:none;color:#16A085;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
    .ver-todos:hover{text-decoration:underline}
    .tbl-scroll{max-height:330px;overflow:auto}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead th{text-align:left;color:#94A3B8;font-weight:600;font-size:11px;padding:8px 10px;border-bottom:1px solid #16476A;position:sticky;top:0;background:#0B192C}
    tbody td{padding:11px 10px;border-bottom:1px solid rgba(52,152,219,.08)}
    tbody tr:hover{background:rgba(22,160,133,.05)}
    tbody td strong{color:#ECF0F1}
    .badge-cat{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap}
    .fecha{color:#94A3B8;font-size:12px;white-space:nowrap}
    .monto{font-weight:700;color:#20D6C7;white-space:nowrap;text-align:right}
    .acc-rel{position:relative}
    .acc-dots{width:30px;height:30px;border-radius:50%;border:1px solid #16476A;background:#071421;color:#94A3B8;cursor:pointer}
    .acc-dots:hover{color:#16A085;border-color:#16A085}
    .acc-menu{position:absolute;top:34px;right:0;min-width:130px;background:#0B192C;border:1px solid #16476A;border-radius:12px;padding:5px;z-index:90;box-shadow:0 14px 34px rgba(0,0,0,.5);animation:slide-up .25s ease}
    .acc-menu button{width:100%;padding:9px 12px;border:none;border-radius:8px;background:transparent;color:#ECF0F1;font-size:12px;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:9px;text-align:left}
    .acc-menu button:hover{background:rgba(22,160,133,.12)}
    .acc-menu button i{color:#16A085;width:14px;text-align:center}
    .acc-menu button.oldel i{color:#FF4D6D}
    .sin-datos{padding:22px;text-align:center;color:#64748B;font-size:13px}
    .vamp-card{gap:10px}
    .vamp-list{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
    .vamp-list li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(7,20,33,.7);border:1px solid rgba(255,77,109,.18);transition:all .3s ease}
    .vamp-list li.controlado{opacity:.5;border-color:transparent;background:rgba(7,20,33,.4)}
    .vamp-list li.controlado .vamp-info strong{text-decoration:line-through}
    .vamp-ic{width:36px;height:36px;border-radius:10px;background:rgba(255,77,109,.14);color:#FF4D6D;display:grid;place-items:center;font-size:14px;flex:none}
    .vamp-info{flex:1;display:flex;flex-direction:column;min-width:0}
    .vamp-info strong{font-size:12.5px;color:#ECF0F1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .vamp-info span{font-size:11px;color:#64748B}
    .vamp-monto{font-weight:700;color:#FF7A59;font-size:12.5px;white-space:nowrap}
    .switch{position:relative;width:36px;height:20px;flex:none}
    .switch input{opacity:0;width:0;height:0}
    .slider{position:absolute;inset:0;background:#12324A;border-radius:9999px;cursor:pointer;transition:all .3s ease}
    .slider::before{content:'';position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#94A3B8;transition:all .3s ease}
    .switch input:checked + .slider{background:rgba(22,160,133,.4)}
    .switch input:checked + .slider::before{transform:translateX(16px);background:#16A085}
    .acciones-card{gap:16px}
    .btn-principal{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:17px;border:none;border-radius:13px;background:linear-gradient(135deg,#16A085,#0E6E5C);color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .3s ease;box-shadow:0 10px 26px rgba(22,160,133,.35)}
    .btn-principal:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(22,160,133,.45)}
    .btn-secundario{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;border:1px solid #16476A;border-radius:13px;background:rgba(11,25,44,.6);color:#ECF0F1;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .3s ease}
    .btn-secundario:hover{border-color:#16A085;color:#16A085}
    .btn-secundario i{color:#3498DB}
    .acc-ayuda{font-size:11px;color:#64748B;margin:0;line-height:1.5}
    .acc-ayuda i{color:#16A085;margin-right:6px}
    .modal-mask{position:fixed;inset:0;background:rgba(7,20,33,.8);display:grid;place-items:center;z-index:500}
    .modal{width:440px;max-width:92vw;background:#0B192C;border:1px solid #16476A;border-radius:18px;padding:26px;display:flex;flex-direction:column;gap:15px;box-shadow:0 20px 60px rgba(0,0,0,.6);animation:slide-up .3s ease}
    .modal-head{display:flex;align-items:center;justify-content:space-between}
    .modal-head h3{margin:0;font-size:17px;font-weight:800;color:#ECF0F1}
    .modal-x{background:none;border:none;color:#94A3B8;cursor:pointer;font-size:17px}
    .campo{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#94A3B8;font-weight:600}
    .campo input,.campo select{background:#071421;border:1px solid #12324A;color:#ECF0F1;border-radius:11px;padding:12px 13px;font-size:14px;outline:none;font-family:inherit}
    .campo input:focus,.campo select:focus{border-color:#16A085}
    .modal-error{color:#FF4D6D;font-size:12px;font-weight:600;background:rgba(255,77,109,.14);padding:9px 12px;border-radius:9px}
    .modal-btns{display:flex;gap:10px;justify-content:flex-end}
    .btn-cancel{background:#071421;border:1px solid #16476A;color:#94A3B8;padding:11px 18px;border-radius:11px;cursor:pointer;font-weight:600;font-family:inherit}
    .btn-guardar{background:linear-gradient(135deg,#16A085,#0E6E5C);border:none;color:#fff;padding:11px 22px;border-radius:11px;cursor:pointer;font-weight:700;font-family:inherit}
    .btn-guardar:disabled{opacity:.6;cursor:default}
    .toast{position:fixed;bottom:24px;right:24px;display:flex;align-items:center;gap:12px;background:#0B192C;border:1px solid #16A085;border-left:4px solid #16A085;color:#ECF0F1;padding:15px 19px;border-radius:13px;box-shadow:0 20px 50px rgba(0,0,0,.55);z-index:6000;animation:slide-up .4s cubic-bezier(.22,1,.36,1);font-size:13px;font-weight:500}
    .toast i{color:#16A085;font-size:18px}
    .toast.toast-error{border-color:#FF4D6D;border-left-color:#FF4D6D}.toast.toast-error i{color:#FF4D6D}
    .toast.toast-info{border-color:#3498DB;border-left-color:#3498DB}.toast.toast-info i{color:#3498DB}
    @media(max-width:1200px){.row-cards{grid-template-columns:repeat(2,1fr)}.graf-row,.row-baja{grid-template-columns:1fr}}
    @media(max-width:768px){.app-layout{grid-template-columns:1fr}.sidebar{display:none}.search{width:180px}.topbar{flex-wrap:wrap;padding:14px 16px}.dashboard{padding:6px 16px 24px}.profile-text{display:none}.main-title{font-size:24px}}
  `]
})
export class GastosComponent implements OnInit {
  protected Math = Math;
  settingsAbierto = false;
  verNotificaciones = false;
  verMensajes = false;
  menuPerfil = false;
  numNotificaciones = 0;
  numMensajes = 0;
  notificaciones: { texto: string; hora: string }[] = [];
  mensajes: { de: string; texto: string; hora: string }[] = [];
  get tieneMensajes(): boolean { return this.numMensajes > 0; }

  busqueda = '';
  periodo: Periodo = 'mes';
  periodoAbierto = false;
  get periodoLabel(): string {
    return this.periodo === 'mes' ? 'Este mes' : this.periodo === 'anio' ? 'Este año' : 'Todo';
  }

  gastos: Gasto[] = [];
  gastosFiltrados: Gasto[] = [];
  gastosVisibles: Gasto[] = [];
  totalIngresos = 0;
  saldoDisponible = 0;
  mostrarTodos = false;
  menuAcc: number | null = null;

  totalGastado = 0;
  totalFijos = 0;
  totalVariables = 0;
  totalVampiros = 0;
  conteoFijos = 0;
  conteoVariables = 0;
  conteoVampiros = 0;
  deltaTotal = 0;
  deltaFijos = 0;
  deltaVariables = 0;
  deltaVampiros = 0;

  plotL = 52;
  evoPuntos: { x: number; y: number }[] = [];
  evoHaloP: { x: number; y: number }[] = [];
  evoTextos: { x: number; y: number; txt: string }[] = [];
  evoLabels: { x: number; y: number; txt: string }[] = [];
  evoMontos: { y: number; txt: string }[] = [];
  lineasH: { y: number }[] = [];
  lineaPath = '';
  areaPath = '';
  hayEvo = false;

  donaTotal = 0;
  donaCortes: { color: string; dash: string }[] = [];
  donaLeyenda: { cat: string; nombre: string; color: string; monto: number; porc: number }[] = [];

  vampirosVisibles: Gasto[] = [];
  vampirosCompletos: Gasto[] = [];
  mostrarVampiros = false;
  vampirosControlados: number[] = [];

  categorias = ['Alimentacion','Transporte','Servicios','Entretenimiento','Salud','Educacion','Hogar','Otros'];
  metodos = ['Efectivo', 'Transferencia', 'Tarjeta'];
  colores: Record<string, string> = {
    'Hogar': '#16A085',
    'Servicios': '#20D6C7',
    'Alimentacion': '#3498DB',
    'Salud': '#3498DB',
    'Transporte': '#8E5AD7',
    'Educacion': '#BE2ED6',
    'Entretenimiento': '#F4B942',
    'Otros': '#FF4D6D'
  };

  modalAbierto = false;
  editandoId: number | null = null;
  form = { descripcion: '', monto: 0, categoria: 'Alimentacion', metodo: 'Efectivo', fecha: '' };
  modalError = '';
  guardando = false;

  toastTexto = '';
  toastTipo: 'ok' | 'error' | 'info' = 'ok';
  toastActivo = false;
  private timerToast: any = null;

  private usuarioLogueado: any = null;
  get nombreUsuario(): string { return this.usuarioLogueado?.fullName || 'Usuario'; }
  get fotoUsuario(): string { return this.usuarioLogueado?.avatar || ''; }

  constructor(
    private router: Router,
    private gastosService: GastosService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form.fecha = this.hoyISO();
    this.cargarGastos();
    this.cargarEvolucion();
    this.cargarSaldo();
    this.gastosService.datosCambiaron$.subscribe(() => {
      this.cargarGastos();
      this.cargarEvolucion();
      this.cargarSaldo();
    });
    const notif = localStorage.getItem('fv_notificaciones');
    if (notif) { try { const arr = JSON.parse(notif); this.notificaciones = arr; this.numNotificaciones = arr.length; } catch {} }
    const msgs = localStorage.getItem(this.authService.mensajeKey());
    if (msgs) { try { this.mensajes = JSON.parse(msgs); } catch {} }
    if (this.mensajes.length === 0) {
      this.mensajes = [{ de: 'FinVanguard', texto: 'Bienvenido a FinVanguard. Registre sus gastos para controlar sus finanzas.', hora: 'Ahora' }];
      localStorage.setItem(this.authService.mensajeKey(), JSON.stringify(this.mensajes));
    }
    this.numMensajes = this.mensajes.length;
    const vc = localStorage.getItem('fv_vampiros_controlados');
    if (vc) { try { this.vampirosControlados = JSON.parse(vc) || []; } catch {} }
    this.authService.currentUser$.subscribe((u) => {
      if (u) { this.usuarioLogueado = u; this.cdr.detectChanges(); }
    });
  }

  cargarGastos(): void {
    const hoy = new Date();
    let mes: number | undefined;
    let anio: number | undefined;
    if (this.periodo === 'mes') {
      mes = hoy.getMonth() + 1;
      anio = hoy.getFullYear();
    } else if (this.periodo === 'anio') {
      anio = hoy.getFullYear();
    }
    this.gastosService.listar(mes, anio).subscribe({
      next: (r) => {
        this.gastos = r;
        this.recalcularDeltas();
        this.aplicarBusqueda();
      },
      error: () => this.toast('No se pudieron cargar los gastos', 'error')
    });
  }

  cargarEvolucion(): void {
    this.gastosService.listar().subscribe({
      next: (r) => this.construirEvolucion(r || []),
      error: () => {}
    });
  }

  private cargarSaldo(): void {
    forkJoin({
      ingresos: this.gastosService.listarIngresos(),
      gastos: this.gastosService.listar()
    }).subscribe({
      next: ({ ingresos, gastos }) => {
        this.totalIngresos = (ingresos || []).reduce((s, i) => s + Number(i.monto), 0);
        const gastado = (gastos || []).reduce((s, g) => s + Number(g.monto), 0);
        this.saldoDisponible = this.totalIngresos - gastado;
      },
      error: () => {}
    });
  }

  private recalcularDeltas(): void {
    const hoy = new Date();
    const kMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const kPrev = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const fijosSet = new Set(['Servicios','Hogar','Educacion','Salud']);
    const varsSet = new Set(['Alimentacion','Transporte','Entretenimiento']);
    let t1 = 0, f1 = 0, v1 = 0, p1 = 0, t2 = 0, f2 = 0, v2 = 0, p2 = 0;
    for (const g of this.gastos) {
      const m = Number(g.monto) || 0;
      const k = g.fecha.slice(0, 7);
      if (k === kMes) {
        t1 += m;
        if (fijosSet.has(g.categoria)) f1 += m;
        else if (varsSet.has(g.categoria)) v1 += m;
        else p1 += m;
      } else if (k === kPrev) {
        t2 += m;
        if (fijosSet.has(g.categoria)) f2 += m;
        else if (varsSet.has(g.categoria)) v2 += m;
        else p2 += m;
      }
    }
    this.deltaTotal = t2 > 0 ? ((t1 - t2) / t2) * 100 : 0;
    this.deltaFijos = f2 > 0 ? ((f1 - f2) / f2) * 100 : 0;
    this.deltaVariables = v2 > 0 ? ((v1 - v2) / v2) * 100 : 0;
    this.deltaVampiros = p2 > 0 ? ((p1 - p2) / p2) * 100 : 0;
  }

  aplicarBusqueda(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.gastosFiltrados = q
      ? this.gastos.filter(g => g.descripcion.toLowerCase().includes(q))
      : [...this.gastos];
    this.gastosVisibles = this.mostrarTodos ? this.gastosFiltrados : this.gastosFiltrados.slice(0, 5);
    this.calcularMetricas();
    this.construirDona();
    this.construirVampiros();
  }

  private calcularMetricas(): void {
    const fijosSet = new Set(['Servicios','Hogar','Educacion','Salud']);
    const varsSet = new Set(['Alimentacion','Transporte','Entretenimiento']);
    let t = 0, f = 0, v = 0, vamp = 0, cf = 0, cv = 0, cvamp = 0;
    for (const g of this.gastos) {
      const m = Number(g.monto) || 0;
      if (this.vampirosControlados.includes(g.id)) continue;
      t += m;
      if (fijosSet.has(g.categoria)) { f += m; cf++; }
      else if (varsSet.has(g.categoria)) { v += m; cv++; }
      else { vamp += m; cvamp++; }
    }
    this.totalGastado = t;
    this.totalFijos = f;
    this.totalVariables = v;
    this.totalVampiros = vamp;
    this.conteoFijos = cf;
    this.conteoVariables = cv;
    this.conteoVampiros = cvamp;
    this.cdr.detectChanges();
  }

  private construirDona(): void {
    const porCat: Record<string, number> = {};
    let total = 0;
    for (const g of this.gastos) {
      if (this.vampirosControlados.includes(g.id)) continue;
      const m = Number(g.monto) || 0;
      porCat[g.categoria] = (porCat[g.categoria] || 0) + m;
      total += m;
    }
    this.donaTotal = total;
    const keys = Object.keys(porCat).sort((a, b) => porCat[b] - porCat[a]);
    this.donaLeyenda = keys.map(k => ({
      cat: k,
      nombre: this.nomCat(k),
      color: this.colorCat(k),
      monto: porCat[k],
      porc: total ? (porCat[k] / total) * 100 : 0
    }));
    const circ = 2 * Math.PI * 78;
    let acum = 0;
    this.donaCortes = keys.map(k => {
      const frac = total ? porCat[k] / total : 0;
      const corte = {
        color: this.colorCat(k),
        dash: `${(frac * circ).toFixed(2)} ${circ.toFixed(2)}`
      };
      const s = `stroke-dashoffset:${(-acum * circ).toFixed(2)}`;
      void s;
      acum += frac;
      return corte;
    });
  }

  private construirVampiros(): void {
    const vamp = new Set(['Otros']);
    this.vampirosCompletos = this.gastos
      .filter(g => vamp.has(g.categoria))
      .sort((a, b) => Number(b.monto) - Number(a.monto));
    const activos = this.vampirosCompletos.filter(v => !this.vampirosControlados.includes(v.id));
    const controlados = this.vampirosCompletos.filter(v => this.vampirosControlados.includes(v.id));
    const lista = [...activos, ...controlados].slice(0, this.mostrarVampiros ? 8 : 5);
    this.vampirosVisibles = lista;
  }

  private construirEvolucion(todos: Gasto[]): void {
    const W = 560, H = 200, padB = 24, padT = 24;
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const hoy = new Date();
    const meses: { label: string; valor: number }[] = [];
    for (let k = 5; k >= 0; k--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - k, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const valor = todos.filter(g => g.fecha.slice(0, 7) === key).reduce((s, g) => s + Number(g.monto), 0);
      meses.push({ label: nombres[d.getMonth()], valor });
    }
    this.hayEvo = meses.some(m => m.valor > 0);
    const max = Math.max(...meses.map(m => m.valor), 1);
    const niceMax = Math.max(1000, Math.ceil(max / 2000) * 2000);
    const base = H - padB, top = padT;
    const plotL = this.plotL;
    const plotW = W - plotL;
    const step = plotW / 6;
    const pts = meses.map((m, i) => ({
      x: plotL + step * i + step / 2,
      y: base - (m.valor / max) * (base - top)
    }));
    this.evoPuntos = pts;
    this.evoHaloP = pts;
    this.lineaPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    this.areaPath = this.lineaPath + ` L${pts[5].x.toFixed(1)},${base} L${pts[0].x.toFixed(1)},${base} Z`;
    const niveles = 4;
    this.lineasH = [];
    this.evoMontos = [];
    for (let i = 0; i <= niveles; i++) {
      const frac = i / niveles;
      const y = Math.round(base - frac * (base - top));
      this.lineasH.push({ y });
      this.evoMontos.push({ y: y - 4, txt: 'Q ' + Math.round(niceMax * frac).toLocaleString('es-GT') });
    }
    this.evoLabels = meses.map((m, i) => ({ x: pts[i].x, y: H - 5, txt: m.label }));
    this.evoTextos = [];
    meses.forEach((m, i) => {
      if (m.valor > 0) {
        this.evoTextos.push({ x: pts[i].x, y: pts[i].y - 10, txt: 'Q' + Number(m.valor).toLocaleString('es-GT') });
      }
    });
  }

  setPeriodo(p: Periodo): void {
    this.periodo = p;
    this.periodoAbierto = false;
    this.mostrarTodos = false;
    this.cargarGastos();
  }

  toggleTodos(): void {
    this.mostrarTodos = !this.mostrarTodos;
    this.aplicarBusqueda();
  }

  vampControlado(id: number): boolean { return this.vampirosControlados.includes(id); }

  toggleVampiro(id: number): void {
    if (this.vampirosControlados.includes(id)) {
      this.vampirosControlados = this.vampirosControlados.filter(x => x !== id);
    } else {
      this.vampirosControlados.push(id);
    }
    localStorage.setItem('fv_vampiros_controlados', JSON.stringify(this.vampirosControlados));
    this.aplicarBusqueda();
  }

  abrirModal(): void {
    this.editandoId = null;
    this.form = { descripcion: '', monto: 0, categoria: 'Alimentacion', metodo: 'Efectivo', fecha: this.hoyISO() };
    this.modalError = '';
    this.modalAbierto = true;
  }

  editar(g: Gasto): void {
    this.editandoId = g.id;
    this.form = { descripcion: g.descripcion, monto: Number(g.monto), categoria: g.categoria, metodo: g.metodo || 'Efectivo', fecha: g.fecha.slice(0, 10) };
    this.menuAcc = null;
    this.modalError = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void { this.modalAbierto = false; }

  guardar(): void {
    const desc = this.form.descripcion.trim();
    const monto = Number(this.form.monto);
    if (!desc) { this.modalError = 'Escribe una descripción'; return; }
    if (!monto || monto <= 0) { this.modalError = 'Ingresa un monto válido'; return; }
    if (!this.form.fecha) { this.modalError = 'Selecciona una fecha'; return; }
    if (!this.form.categoria) { this.modalError = 'Selecciona una categoría'; return; }
    const hoy = this.hoyISO();
    if (this.form.fecha > hoy) { this.modalError = 'No se puede registrar un gasto con fecha futura (hoy es ' + hoy + ')'; return; }

    const orig = this.editandoId ? Number(this.gastos.find(x => x.id === this.editandoId)?.monto || 0) : 0;
    const saldo = this.saldoDisponible + orig;
    if (monto > saldo) {
      this.modalError = 'Este gasto supera tu saldo disponible (Q' + saldo.toFixed(2) + '). Registra ingresos primero o reduce el monto.';
      return;
    }

    this.guardando = true;
    const data = { descripcion: desc, monto, categoria: this.form.categoria, metodo: this.form.metodo, fecha: this.form.fecha };
    const acc = this.editandoId
      ? this.gastosService.actualizar(this.editandoId, data)
      : this.gastosService.crear(data);
    acc.subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.toast(this.editandoId ? 'Gasto actualizado' : 'Gasto agregado');
        this.cargarGastos();
        this.cargarEvolucion();
        this.cargarSaldo();
      },
      error: (err) => { this.guardando = false; this.modalError = err?.error?.message || 'No se pudo guardar el gasto: saldo insuficiente o fecha futura'; }
    });
  }

  eliminar(g: Gasto): void {
    if (!confirm(`¿Eliminar "${g.descripcion}"?`)) return;
    this.gastosService.eliminar(g.id).subscribe({
      next: () => {
        this.toast('Gasto eliminado');
        this.vampirosControlados = this.vampirosControlados.filter(x => x !== g.id);
        localStorage.setItem('fv_vampiros_controlados', JSON.stringify(this.vampirosControlados));
        this.cargarGastos();
        this.cargarEvolucion();
        this.cargarSaldo();
      },
      error: () => this.toast('No se pudo eliminar', 'error')
    });
  }

  exportarExcel(): void {
    const filas = [
      ['Fecha', 'Categoría', 'Descripción', 'Monto', 'Método'],
      ...[...this.gastosFiltrados].sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map(g => [g.fecha, this.nomCat(g.categoria), g.descripcion, Number(g.monto).toFixed(2), g.metodo || 'Efectivo'])
    ];
    const csv = filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gastos.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.toast('Exportado a Excel');
  }

  fmt(n: number): string {
    return (Number(n) || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  abs(n: number): number { return Math.abs(n); }

  fmtFecha(f: string): string {
    if (!f) return '—';
    const p = f.slice(0, 10).split('-');
    if (p.length !== 3) return f;
    return `${p[2]}/${p[1]}/${p[0]}`;
  }

  nomCat(c: string): string {
    return ({ 'Alimentacion':'Alimentación','Transporte':'Transporte','Servicios':'Servicios','Entretenimiento':'Entretenimiento','Salud':'Salud','Educacion':'Educación','Hogar':'Vivienda','Otros':'Otros' } as Record<string,string>)[c] || c;
  }

  colorCat(c: string): string { return this.colores[c] || '#16A085'; }

  catIcon(c: string): string {
    return ({ 'Hogar':'fas fa-home','Servicios':'fas fa-wrench','Alimentacion':'fas fa-utensils','Salud':'fas fa-heartbeat','Transporte':'fas fa-car','Educacion':'fas fa-graduation-cap','Entretenimiento':'fas fa-film','Otros':'fas fa-box' } as Record<string,string>)[c] || 'fas fa-tag';
  }

  private hexARgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  badgeColor(c: string): string { return this.hexARgba(this.colorCat(c), 0.16); }

  hoyISO(): string {
    return new Date().toISOString().slice(0, 10);
  }

  ir(ruta: string): void { this.router.navigate([ruta]); }

  toggleSettings(event: Event): void {
    event.stopPropagation();
    this.settingsAbierto = !this.settingsAbierto;
    this.menuPerfil = false;
    this.verNotificaciones = false;
    this.verMensajes = false;
  }

  toggleUsuarioMenu(event: Event): void {
    event.stopPropagation();
    this.menuPerfil = !this.menuPerfil;
    this.settingsAbierto = false;
    this.verNotificaciones = false;
    this.verMensajes = false;
  }

  toggleNotificaciones(): void {
    this.verNotificaciones = !this.verNotificaciones;
    this.settingsAbierto = false;
    this.verMensajes = false;
    this.menuPerfil = false;
    if (this.verNotificaciones) this.numNotificaciones = 0;
  }

  toggleMensajes(): void {
    this.verMensajes = !this.verMensajes;
    this.settingsAbierto = false;
    this.verNotificaciones = false;
    this.menuPerfil = false;
    if (this.verMensajes) this.numMensajes = 0;
  }

  @HostListener('document:click')
  cerrarDropdowns(): void {
    this.settingsAbierto = false;
    this.verNotificaciones = false;
    this.verMensajes = false;
    this.menuPerfil = false;
    this.periodoAbierto = false;
    this.menuAcc = null;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toast(texto: string, tipo: 'ok' | 'error' | 'info' = 'ok'): void {
    this.toastTexto = texto;
    this.toastTipo = tipo;
    this.toastActivo = true;
    if (this.timerToast) clearTimeout(this.timerToast);
    this.timerToast = setTimeout(() => (this.toastActivo = false), 2600);
  }
}