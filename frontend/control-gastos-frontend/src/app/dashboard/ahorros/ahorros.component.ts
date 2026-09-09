import { Component, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface RegAhorro { id: number; fecha: string; categoria: string; descripcion: string; monto: number; metodo: string; }
type Periodo = 'mes' | 'anio' | 'todo';

@Component({
  selector: 'app-ahorros',
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
            <button class="side-icon" title="Gastos" (click)="ir('/gastos')"><i class="fas fa-exchange-alt"></i></button>
            <button class="side-icon active" title="Ahorro" (click)="ir('/ahorros')"><i class="fas fa-piggy-bank"></i></button>
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
          <!-- ENCABEZADO DE LA SECCION -->
          <section class="sec-titulo">
            <div class="sec-left">
              <div class="ic-perfil"><i class="fas fa-piggy-bank"></i></div>
              <div class="titulo-box">
                <h1>Ahorro</h1>
                <p>Construye sus metas, asegura su futuro</p>
              </div>
            </div>
            <div class="sec-right">
              <div class="motivacion">
                <i class="fas fa-quote-left mq"></i>
                <span class="m-text">Pequeños ahorros, <b>grandes logros</b>.</span>
                <i class="fas fa-seedling mpl"></i>
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
            </div>
          </section>

          <!-- TARJETAS PRINCIPALES -->
          <section class="row-cards">
            <article class="card">
              <div class="card-head">
                <p class="c-lbl">Total ahorrado</p>
                <div class="c-ic green"><i class="fas fa-piggy-bank"></i></div>
              </div>
              <p class="c-val">Q{{fmt(totalAhorrado)}}</p>
              <p class="c-delta"><span class="delta" [class.neg]="deltaTotal<0">{{deltaTotal>=0?'▲':'▼'}} {{abs(deltaTotal).toFixed(1)}}%</span> <span class="vs">vs. mes anterior</span></p>
            </article>
            <article class="card">
              <div class="card-head">
                <p class="c-lbl">{{periodoLabel}} ahorrado</p>
                <div class="c-ic blue"><i class="fas fa-calendar-check"></i></div>
              </div>
              <p class="c-val">Q{{fmt(ahorroPeriodo)}}</p>
              <p class="c-delta"><span class="delta" [class.neg]="deltaPeriodo<0">{{deltaPeriodo>=0?'▲':'▼'}} {{abs(deltaPeriodo).toFixed(1)}}%</span> <span class="vs">vs. período anterior</span></p>
            </article>
            <article class="card meta-card">
              <div class="card-head">
                <p class="c-lbl">Meta de ahorro</p>
                <div class="c-ic target"><i class="fas fa-bullseye"></i></div>
              </div>
              <p class="c-val">Q{{fmt(metaAhorro)}}</p>
              <div class="barra-prog"><div class="fill" [style.width.%]="progreso"></div></div>
              <p class="prog-txt"><span>{{progreso.toFixed(0)}}%</span><span>de su meta</span></p>
            </article>
          </section>

          <!-- GRAFICA PRINCIPAL + MI META -->
          <section class="graf-row">
            <article class="card evo-card">
              <div class="card-head">
                <div class="t-row">
                  <p class="chart-titulo"><i class="fas fa-chart-line ct"></i> Evolución del ahorro</p>
                  <p class="chart-sub">Así ha crecido su ahorro en los últimos 6 meses.</p>
                </div>
                <div class="chip-choice"><i class="fas fa-chevron-down"></i><span>Últimos 6 meses</span></div>
              </div>
              <div class="evo-wrap" *ngIf="hayEvo; else sinEvo">
                <svg viewBox="0 0 560 200" class="evo" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#16A085" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#3498DB" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <line *ngFor="let h of lineasH" [attr.x1]="0" [attr.x2]="560" [attr.y1]="h.y" [attr.y2]="h.y" class="evo-grilla"/>
                  <path [attr.d]="areaPath" class="evo-area" fill="url(#evoGrad)"/>
                  <path [attr.d]="lineaPath" class="evo-line"/>
                  <circle *ngFor="let p of evoPuntos" [attr.cx]="p.x" [attr.cy]="p.y" r="4.5" class="evo-punto"/>
                  <text *ngFor="let t of evoTextos" [attr.x]="t.x" [attr.y]="t.y" class="evo-val">{{t.txt}}</text>
                  <text *ngFor="let e of evoLabels" [attr.x]="e.x" [attr.y]="e.y" class="evo-etq" text-anchor="middle">{{e.txt}}</text>
                </svg>
              </div>
              <ng-template #sinEvo><div class="sin-datos">Aún no hay ahorros registrados en este período</div></ng-template>
            </article>

            <article class="card mi-meta-card">
              <p class="chart-titulo"><i class="fas fa-bullseye ct"></i> Mi meta de ahorro</p>
              <div class="mm-body">
                <div class="dona-wrap">
                  <svg viewBox="0 0 190 190" class="dona">
                    <defs>
                      <linearGradient id="metaGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#3498DB"/>
                        <stop offset="100%" stop-color="#16A085"/>
                      </linearGradient>
                    </defs>
                    <circle class="dona-base" cx="95" cy="95" r="78"/>
                    <circle class="dona-corte" cx="95" cy="95" r="78" stroke="url(#metaGrad)"
                      [attr.stroke-dasharray]="donaDash"/>
                  </svg>
                  <div class="dona-centro"><strong class="dona-n">Q{{fmt(totalAhorrado)}}</strong><span>ahorrado</span></div>
                </div>
                <div class="meta-info">
                  <div class="info-row">
                    <span class="ind"><i class="fas fa-bullseye"></i></span>
                    <div class="in2"><p>Meta total</p><b>Q{{fmt(metaAhorro)}}</b></div>
                  </div>
                  <div class="info-row">
                    <span class="ind blue"><i class="fas fa-money-bill-wave"></i></span>
                    <div class="in2"><p>Faltante</p><b>Q{{fmt(faltante)}}</b></div>
                  </div>
                  <div class="info-row">
                    <span class="ind purple"><i class="fas fa-chart-pie"></i></span>
                    <div class="in2"><p>Progreso</p><b>{{progreso.toFixed(0)}}%</b></div>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <!-- TABLA + ACCIONES + MOTIVACIONAL -->
          <section class="row-baja">
            <article class="card tabla-card">
              <div class="card-head">
                <p class="chart-titulo"><i class="fas fa-piggy-bank ct"></i> Últimos ahorros registrados</p>
                <button class="ver-todos" (click)="toggleTodos()">{{mostrarTodos? 'Ver menos' : 'Ver todos'}}</button>
              </div>
              <div class="tbl-scroll">
                <table>
                  <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th>Método</th><th></th></tr></thead>
                  <tbody>
                    <tr *ngFor="let r of registrosVisibles">
                      <td class="fecha">{{fmtFecha(r.fecha)}}</td>
                      <td><span class="badge-cat" [style.background]="badgeColor(r.categoria)" [style.color]="colorCat(r.categoria)">{{nomCat(r.categoria)}}</span></td>
                      <td><strong>{{r.descripcion}}</strong></td>
                      <td class="monto">Q{{fmt(r.monto)}}</td>
                      <td class="fecha">{{r.metodo}}</td>
                      <td>
                        <div class="acc-rel" (click)="$event.stopPropagation()">
                          <button class="acc-dots" title="Acciones" (click)="menuAcc=(menuAcc===r.id?null:r.id)"><i class="fas fa-ellipsis-h"></i></button>
                          <div class="acc-menu" *ngIf="menuAcc===r.id">
                            <button (click)="editarRegistro(r)"><i class="fas fa-pen"></i> Editar</button>
                            <button class="oldel" (click)="eliminarRegistro(r)"><i class="fas fa-trash"></i> Eliminar</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="sin-datos" *ngIf="registrosVisibles.length===0">No hay ahorros en este período</div>
              </div>
            </article>

            <article class="card acciones-card">
              <p class="chart-titulo"><i class="fas fa-bolt ct"></i> Acciones rápidas</p>
              <button class="btn-principal" (click)="abrirModal()"><i class="fas fa-plus"></i> Agregar ahorro</button>
              <button class="btn-secundario" (click)="exportarExcel()"><i class="fas fa-file-excel"></i> Exportar a Excel</button>
              <p class="acc-ayuda"><i class="fas fa-lightbulb"></i> Registra tu ahorro del mes y mira cómo avanza tu meta.</p>
            </article>

            <article class="card moti-card">
              <div class="moti-img">
                <svg viewBox="0 0 300 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#071421"/>
                      <stop offset="100%" stop-color="#102942"/>
                    </linearGradient>
                    <linearGradient id="sol" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#3498DB"/>
                      <stop offset="100%" stop-color="#16A085"/>
                    </linearGradient>
                  </defs>
                  <rect width="300" height="150" fill="url(#cielo)"/>
                  <circle cx="225" cy="38" r="18" fill="url(#sol)" opacity="0.85"/>
                  <path d="M0,150 L75,42 L150,150 Z" fill="#0B192C"/>
                  <path d="M55,150 L150,58 L235,150 Z" fill="#132F4C"/>
                  <path d="M145,150 L228,72 L300,150 Z" fill="#102942"/>
                  <path d="M75,42 L88,58 L62,58 Z" fill="#dff3f0" opacity="0.7"/>
                </svg>
              </div>
              <p class="moti-texto">Su esfuerzo de hoy,<br>es la <b>tranquilidad</b><br>de <b>mañana</b>.</p>
              <p class="moti-sub">Cada ahorro cuenta. Sigue adelante.</p>
              <div class="moti-linea"></div>
            </article>
          </section>
        </main>
      </div>

      <!-- MODAL AGREGAR / EDITAR AHORRO -->
      <div class="modal-mask" *ngIf="modalAbierto" (click)="cerrarModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>{{editandoId? 'Editar ahorro' : 'Agregar ahorro'}}</h3>
            <button class="modal-x" (click)="cerrarModal()"><i class="fas fa-times"></i></button>
          </div>
          <label class="campo">Descripción <input [(ngModel)]="form.descripcion" placeholder="Ej: Meta viaje a Europa"/></label>
          <label class="campo">Monto (Q) <input type="number" min="0.01" step="0.01" [(ngModel)]="form.monto" placeholder="0.00"/></label>
          <label class="campo">Categoría
            <select [(ngModel)]="form.categoria">
              <option *ngFor="let c of categorias" [value]="c">{{nomCat(c)}}</option>
            </select>
          </label>
          <label class="campo">Método
            <select [(ngModel)]="form.metodo">
              <option *ngFor="let m of metodos" [value]="m">{{m}}</option>
            </select>
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
    .app-layout{display:grid;grid-template-columns:90px 1fr;height:100vh;background:#0B192C;font-family:'Inter','Segoe UI',system-ui,sans-serif;color:#ECF0F1;overflow:hidden}
    .sidebar{background:linear-gradient(180deg,#060F1B 0%,#0B192C 100%);border-right:1px solid rgba(52,152,219,.08);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:26px 0;z-index:10;animation:slide-left .6s cubic-bezier(.22,1,.36,1)}
    .sidebar-top{display:flex;flex-direction:column;align-items:center;width:100%}
    .sidebar-logo{width:64px;height:64px;border-radius:50%;background:#FFFFFF;border:2px solid #FFFFFF;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:34px;box-shadow:0 4px 20px rgba(0,0,0,0.25),0 0 0 1px rgba(255,255,255,0.8)}
    .sidebar-logo-img{width:100%;height:100%;padding:6px;object-fit:contain;background:#FFFFFF !important;border-radius:50%;display:block}
    .sidebar-menu{display:flex;flex-direction:column;align-items:center;gap:24px}
    .side-icon{width:44px;height:44px;border-radius:13px;background:transparent;border:1px solid transparent;color:#94A3B8;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.22,1,.36,1);position:relative}
    .side-icon:hover{color:#ECF0F1;background:rgba(22,160,133,.08);transform:translateY(-1px)}
    .side-icon.active{background:rgba(212,255,0,.12);border:1px solid rgba(212,255,0,.35);color:#D4FF00;box-shadow:0 0 20px rgba(212,255,0,.25)}
    .side-icon.active::after{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:#D4FF00;border-radius:0 3px 3px 0;box-shadow:0 0 8px rgba(212,255,0,.5)}
    .side-icon .spin{animation:spin .6s ease}
    .sidebar-bottom{position:relative}
    .settings-menu{position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%);background:#0D2135;border:1px solid rgba(52,152,219,.25);border-radius:14px;padding:6px;min-width:200px;z-index:50;box-shadow:0 18px 45px rgba(0,0,0,.55);animation:slide-left .3s cubic-bezier(.22,1,.36,1)}
    .menu-item{width:100%;padding:11px 14px;border:none;border-radius:8px;background:transparent;color:#ECF0F1;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all .25s ease;text-align:left}
    .menu-item:hover{background:rgba(22,160,133,.12);padding-left:18px}
    .menu-item i{color:#16A085;width:16px;text-align:center;font-size:13px}
    .menu-item.logout i{color:#ff7b7b}
    .menu-divider{height:1px;background:rgba(52,152,219,.15);margin:6px 0}
    .content{display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .topbar{display:flex;align-items:center;justify-content:space-between;padding:20px 48px 14px;flex-shrink:0;gap:18px;animation:fade-in .6s ease-out .2s backwards}
    .search{display:flex;align-items:center;gap:12px;width:400px;height:45px;background:#0D2135;border:1px solid rgba(52,152,219,.22);border-radius:14px;padding:0 16px;transition:all .3s ease}
    .search:focus-within{border-color:rgba(22,160,133,.5);box-shadow:0 0 18px rgba(22,160,133,.12)}
    .search-icon{color:#8FA3BD;font-size:13px}
    .search-input{background:transparent;border:none;outline:none;color:#ECF0F1;font-size:13px;font-family:inherit;width:100%}
    .search-input::placeholder{color:#6C7B93}
    .top-right{display:flex;align-items:center;gap:16px;margin-left:auto}
    .notif-wrap{position:relative}
    .icon-btn{width:42px;height:42px;border-radius:12px;background:#0D2135;border:1px solid rgba(52,152,219,.15);color:#8FA3BD;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s ease}
    .icon-btn:hover{color:#16A085;border-color:rgba(22,160,133,.35);transform:translateY(-1px)}
    .notif-badge{position:absolute;top:-5px;right:-5px;background:#3498DB;color:#fff;font-size:9px;font-weight:800;min-width:17px;height:17px;border-radius:9999px;display:flex;align-items:center;justify-content:center;padding:0 5px;border:1.5px solid #0B192C}
    .notif-dropdown{position:absolute;top:48px;right:0;width:320px;background:#0D2135;border:1px solid rgba(52,152,219,.2);border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:200;max-height:380px;overflow-y:auto;animation:slide-up .3s ease}
    .notif-header{padding:12px 16px;font-size:13px;font-weight:700;color:#ECF0F1;border-bottom:1px solid rgba(52,152,219,.15);background:rgba(22,160,133,.08)}
    .notif-item{padding:12px 16px;border-bottom:1px solid rgba(52,152,219,.08)}
    .notif-item:last-child{border-bottom:none}
    .notif-item span{font-size:12px;color:#16A085;font-weight:600}
    .notif-item p{margin:4px 0 0;font-size:12px;color:#A7BCD0;line-height:1.4}
    .notif-empty{padding:24px;text-align:center;font-size:12px;color:#6C7B93}
    .usuario{display:flex;align-items:center;gap:11px;position:relative;background:#0D2135;border:1px solid rgba(52,152,219,.12);border-radius:14px;padding:7px 12px;cursor:pointer}
    .avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#16A085,#3498DB);display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;overflow:hidden}
    .avatar img{width:100%;height:100%;object-fit:cover}
    .u-text{display:flex;flex-direction:column;line-height:1.25}
    .u-hola{font-size:11px;color:#8FA3BD}
    .u-nombre{font-size:13px;font-weight:700;color:#16A085}
    .chevron{background:none;border:none;color:#8FA3BD;cursor:pointer;font-size:11px}
    .usuario-menu{position:absolute;top:58px;right:0;background:#0D2135;border:1px solid rgba(52,152,219,.25);border-radius:14px;padding:6px;min-width:190px;z-index:60;box-shadow:0 18px 45px rgba(0,0,0,.55);animation:slide-up .3s cubic-bezier(.22,1,.36,1)}
    .dashboard{flex:1;padding:6px 48px 46px;overflow-y:auto;display:flex;flex-direction:column;gap:20px}
    .sec-titulo{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;animation:slide-up .6s cubic-bezier(.22,1,.36,1) .3s backwards}
    .sec-left{display:flex;align-items:center;gap:16px}
    .ic-perfil{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#16A085,#3498DB);color:#fff;display:grid;place-items:center;font-size:26px;box-shadow:0 0 26px rgba(22,160,133,.35);flex:none}
    .titulo-box h1{font-size:32px;font-weight:800;color:#ECF0F1;margin:0;line-height:1.1}
    .titulo-box p{font-size:14px;color:#8FA3BD;margin:4px 0 0}
    .sec-right{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    .motivacion{display:flex;align-items:center;gap:14px;background:linear-gradient(160deg,#102942,#0D2135);border:1px solid rgba(52,152,219,.22);border-radius:16px;padding:14px 20px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
    .mq{color:#16A085;font-size:16px}
    .m-text{font-size:13px;color:#A7BCD0;max-width:180px}
    .m-text b{color:#16A085;font-weight:700}
    .mpl{color:#3498DB;font-size:16px}
    .per-rel{position:relative}
    .periodo-btn{display:flex;align-items:center;gap:10px;justify-content:space-between;min-width:220px;background:#0D2135;border:1px solid rgba(52,152,219,.3);border-radius:14px;padding:13px 16px;color:#ECF0F1;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .3s ease}
    .periodo-btn:hover{border-color:rgba(22,160,133,.45)}
    .periodo-btn i:first-child{color:#16A085}
    .pd{font-size:10px;color:#8FA3BD}
    .per-menu{position:absolute;top:52px;right:0;min-width:200px;background:#0D2135;border:1px solid rgba(52,152,219,.25);border-radius:14px;padding:6px;z-index:60;box-shadow:0 18px 45px rgba(0,0,0,.55);animation:slide-up .3s cubic-bezier(.22,1,.36,1)}
    .per-menu button{width:100%;padding:11px 14px;border:none;border-radius:8px;background:transparent;color:#ECF0F1;font-size:13px;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;text-align:left;transition:all .2s ease}
    .per-menu button:hover{background:rgba(22,160,133,.12)}
    .per-menu button i{color:#16A085;width:16px;text-align:center}
    .row-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;animation:slide-up .7s cubic-bezier(.22,1,.36,1) backwards}
    .card{background:linear-gradient(180deg,#0D2135 0%,#0B192C 100%);border:1px solid rgba(52,152,219,.12);border-radius:16px;padding:22px;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,.3);transition:all .35s ease;position:relative;overflow:hidden}
    .card:hover{border-color:rgba(22,160,133,.3);transform:translateY(-2px);box-shadow:0 14px 36px rgba(0,0,0,.4)}
    .card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .c-lbl{font-size:13px;color:#8FA3BD;font-weight:500;margin:0}
    .c-ic{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:20px;flex:none}
    .c-ic.green{background:rgba(22,160,133,.16);color:#16A085;box-shadow:0 0 18px rgba(22,160,133,.28)}
    .c-ic.blue{background:rgba(52,152,219,.16);color:#3498DB;box-shadow:0 0 18px rgba(52,152,219,.28)}
    .c-ic.target{background:rgba(155,89,182,.18);color:#BE2ED6;box-shadow:0 0 18px rgba(155,89,182,.28)}
    .c-val{font-size:29px;font-weight:800;color:#ECF0F1;margin:12px 0 6px;line-height:1}
    .c-delta{font-size:12px;margin:0}
    .delta{color:#16A085;font-weight:700}
    .delta.neg{color:#ff7b7b}
    .vs{color:#6C7B93}
    .meta-card{background:linear-gradient(160deg,#132F4C 0%,#0D2135 100%)}
    .barra-prog{height:10px;border-radius:9999px;background:#0B192C;overflow:hidden;margin-top:16px;border:1px solid rgba(52,152,219,.15)}
    .fill{height:100%;border-radius:9999px;background:linear-gradient(90deg,#3498DB,#16A085);transition:width .8s cubic-bezier(.22,1,.36,1)}
    .prog-txt{display:flex;justify-content:space-between;font-size:12px;color:#6C7B93;margin:8px 0 0}
    .prog-txt span:first-child{color:#16A085;font-weight:700}
    .graf-row{display:grid;grid-template-columns:65fr 35fr;gap:18px;align-items:stretch}
    .chart-titulo{font-size:15px;font-weight:700;color:#16A085;margin:0;display:flex;align-items:center;gap:9px}
    .ct{color:#16A085}
    .chip-choice,.chart-sub{font-size:12px;color:#8FA3BD}
    .chip-choice{display:flex;align-items:center;gap:8px;background:#0B192C;border:1px solid rgba(52,152,219,.2);border-radius:12px;padding:9px 14px;cursor:default;white-space:nowrap}
    .chart-sub{margin:6px 0 0;display:flex;align-items:center;gap:7px}
    .evo-wrap{margin-top:16px;width:100%}
    .evo{width:100%;height:260px;display:block}
    .evo-grilla{stroke:rgba(52,152,219,.13);stroke-width:1}
    .evo-area{stroke:none}
    .evo-line{fill:none;stroke:#16A085;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 3px 8px rgba(22,160,133,.4))}
    .evo-punto{fill:#16A085}
    .evo-val{font-size:10px;fill:#A7BCD0;font-family:'Inter',sans-serif;text-anchor:middle}
    .evo-etq{font-size:11px;fill:#6C7B93;font-family:'Inter',sans-serif}
    .mi-meta-card{gap:8px}
    .mm-body{display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}
    .dona-wrap{position:relative;width:150px;flex:none;margin:0 auto}
    .dona{width:150px;height:150px;transform:rotate(-90deg)}
    .dona-base{fill:none;stroke:#132F4C;stroke-width:20}
    .dona-corte{fill:none;stroke-width:20;stroke-linecap:round;transition:stroke-dasharray .6s}
    .dona-centro{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transform:rotate(0deg)}
    .dona-n{font-size:14px;font-weight:800;color:#ECF0F1}
    .dona-centro span{font-size:11px;color:#6C7B93;margin-top:2px}
    .meta-info{flex:1;min-width:170px;display:flex;flex-direction:column}
    .info-row{display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px solid rgba(52,152,219,.12)}
    .info-row:last-child{border-bottom:none}
    .ind{width:34px;height:34px;border-radius:10px;background:rgba(22,160,133,.14);color:#16A085;display:grid;place-items:center;font-size:14px;flex:none}
    .ind.blue{background:rgba(52,152,219,.14);color:#3498DB}
    .ind.purple{background:rgba(155,89,182,.16);color:#BE2ED6}
    .in2{display:flex;flex-direction:column;gap:2px}
    .in2 p{margin:0;font-size:11px;color:#8FA3BD}
    .in2 b{font-size:13px;color:#ECF0F1}
    .row-baja{display:grid;grid-template-columns:1.7fr 1fr 1fr;gap:18px;align-items:start}
    .tabla-card{gap:14px}
    .ver-todos{background:none;border:none;color:#16A085;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
    .ver-todos:hover{text-decoration:underline}
    .tbl-scroll{max-height:320px;overflow:auto}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead th{text-align:left;color:#8FA3BD;font-weight:600;font-size:11px;padding:8px 10px;border-bottom:1px solid rgba(52,152,219,.15);position:sticky;top:0;background:#0D2135}
    tbody td{padding:11px 10px;border-bottom:1px solid rgba(52,152,219,.07)}
    tbody tr:hover{background:rgba(22,160,133,.05)}
    tbody td strong{color:#ECF0F1}
    .badge-cat{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap}
    .fecha{color:#8FA3BD;font-size:12px;white-space:nowrap}
    .monto{font-weight:700;color:#16A085;white-space:nowrap;text-align:right}
    .acc-rel{position:relative}
    .acc-dots{width:30px;height:30px;border-radius:50%;border:1px solid rgba(52,152,219,.2);background:#0B192C;color:#8FA3BD;cursor:pointer}
    .acc-dots:hover{color:#16A085;border-color:#16A085}
    .acc-menu{position:absolute;top:34px;right:0;min-width:130px;background:#0D2135;border:1px solid rgba(52,152,219,.25);border-radius:12px;padding:5px;z-index:60;box-shadow:0 14px 34px rgba(0,0,0,.5);animation:slide-up .25s ease}
    .acc-menu button{width:100%;padding:9px 12px;border:none;border-radius:8px;background:transparent;color:#ECF0F1;font-size:12px;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:9px;text-align:left}
    .acc-menu button:hover{background:rgba(22,160,133,.12)}
    .acc-menu button i{color:#16A085;width:14px;text-align:center}
    .acc-menu button.oldel i{color:#ff7b7b}
    .sin-datos{padding:24px;text-align:center;color:#6C7B93;font-size:13px}
    .acciones-card{gap:16px}
    .btn-principal{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:17px;border:none;border-radius:14px;background:linear-gradient(135deg,#16A085,#0E6E5C);color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .3s ease;box-shadow:0 10px 26px rgba(22,160,133,.35)}
    .btn-principal:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(22,160,133,.45)}
    .btn-secundario{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;border:1px solid rgba(52,152,219,.4);border-radius:14px;background:rgba(11,25,44,.6);color:#ECF0F1;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .3s ease}
    .btn-secundario:hover{border-color:#16A085;color:#16A085}
    .btn-secundario i{color:#3498DB}
    .acc-ayuda{font-size:11px;color:#6C7B93;margin:0;line-height:1.5}
    .acc-ayuda i{color:#16A085;margin-right:6px}
    .moti-card{gap:18px}
    .moti-img{height:150px;border-radius:14px;overflow:hidden;border:1px solid rgba(52,152,219,.15)}
    .moti-img svg{width:100%;height:100%;display:block}
    .moti-texto{font-size:16px;font-weight:800;color:#ECF0F1;margin:0;line-height:1.35}
    .moti-texto b{color:#16A085;font-weight:800}
    .moti-sub{font-size:12px;color:#8FA3BD;margin:0}
    .moti-linea{width:90px;height:3px;border-radius:9999px;background:linear-gradient(90deg,#16A085,#3498DB);margin-top:auto}
    .modal-mask{position:fixed;inset:0;background:rgba(7,20,33,.78);display:grid;place-items:center;z-index:500}
    .modal{width:440px;max-width:92vw;background:#0D2135;border:1px solid rgba(52,152,219,.25);border-radius:18px;padding:26px;display:flex;flex-direction:column;gap:15px;box-shadow:0 20px 60px rgba(0,0,0,.6);animation:slide-up .3s ease}
    .modal-head{display:flex;align-items:center;justify-content:space-between}
    .modal-head h3{margin:0;font-size:17px;font-weight:800;color:#ECF0F1}
    .modal-x{background:none;border:none;color:#8FA3BD;cursor:pointer;font-size:17px}
    .campo{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#8FA3BD;font-weight:600}
    .campo input,.campo select{background:#0B192C;border:1px solid rgba(52,152,219,.25);color:#ECF0F1;border-radius:11px;padding:12px 13px;font-size:14px;outline:none;font-family:inherit}
    .campo input:focus,.campo select:focus{border-color:#16A085}
    .modal-error{color:#ff7b7b;font-size:12px;font-weight:600;background:rgba(255,92,92,.14);padding:9px 12px;border-radius:9px}
    .modal-btns{display:flex;gap:10px;justify-content:flex-end}
    .btn-cancel{background:#0B192C;border:1px solid rgba(52,152,219,.3);color:#A7BCD0;padding:11px 18px;border-radius:11px;cursor:pointer;font-weight:600;font-family:inherit}
    .btn-guardar{background:linear-gradient(135deg,#16A085,#0E6E5C);border:none;color:#fff;padding:11px 22px;border-radius:11px;cursor:pointer;font-weight:700;font-family:inherit}
    .btn-guardar:disabled{opacity:.6;cursor:default}
    .toast{position:fixed;bottom:24px;right:24px;display:flex;align-items:center;gap:12px;background:#0D2135;border:1px solid #16A085;border-left:4px solid #16A085;color:#ECF0F1;padding:15px 19px;border-radius:13px;box-shadow:0 20px 50px rgba(0,0,0,.55);z-index:6000;animation:slide-up .4s cubic-bezier(.22,1,.36,1);font-size:13px;font-weight:500}
    .toast i{color:#16A085;font-size:18px}
    .toast.toast-error{border-color:#ff7b7b;border-left-color:#ff7b7b}.toast.toast-error i{color:#ff7b7b}
    .toast.toast-info{border-color:#3498DB;border-left-color:#3498DB}.toast.toast-info i{color:#3498DB}
    @media(max-width:1200px){.graf-row,.row-baja{grid-template-columns:1fr}.row-cards{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:900px){.row-cards{grid-template-columns:1fr}.sec-right{width:100%;justify-content:flex-start}.search{width:260px}}
    @media(max-width:768px){.app-layout{grid-template-columns:1fr}.sidebar{display:none}.topbar{flex-direction:column;align-items:flex-start;padding:16px}.dashboard{padding:6px 18px 30px}.search{width:100%}.periodo-btn{width:100%}}
  `]
})
export class AhorrosComponent implements OnInit {
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
    return this.periodo === 'mes' ? 'Este mes' : this.periodo === 'anio' ? 'Este año' : 'Total';
  }

  registros: RegAhorro[] = [];
  registrosVisibles: RegAhorro[] = [];
  mostrarTodos = false;
  menuAcc: number | null = null;

  metaAhorro = 6000;
  totalAhorrado = 0;
  ahorroPeriodo = 0;
  deltaTotal = 0;
  deltaPeriodo = 0;
  faltante = 0;
  get progreso(): number {
    return this.metaAhorro > 0 ? Math.min(100, (this.totalAhorrado / this.metaAhorro) * 100) : 0;
  }

  evoPuntos: { x: number; y: number }[] = [];
  evoTextos: { x: number; y: number; txt: string }[] = [];
  evoLabels: { x: number; y: number; txt: string }[] = [];
  lineasH: { y: number }[] = [];
  lineaPath = '';
  areaPath = '';
  hayEvo = false;
  donaDash = '0 490';

  categorias = ['Ahorro', 'Emergencia', 'Educacion', 'Viaje', 'Casa', 'Salud', 'Otros'];
  metodos = ['Efectivo', 'Transferencia', 'Tarjeta'];
  colores: Record<string, string> = {
    'Ahorro': '#16A085',
    'Emergencia': '#3498DB',
    'Educacion': '#BE2ED6',
    'Viaje': '#F39C12',
    'Casa': '#E74C3C',
    'Salud': '#F39C12',
    'Otros': '#8FA3BD'
  };

  modalAbierto = false;
  editandoId: number | null = null;
  form = { descripcion: '', monto: 0, categoria: 'Ahorro', metodo: 'Transferencia', fecha: '' };
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
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const meta = localStorage.getItem('fv_meta_ahorro');
    if (meta) {
      try { this.metaAhorro = Math.max(0, Number(JSON.parse(meta)) || 0); } catch {}
    }
    this.seedSiVacio();
    this.cargarRegistros();
    const notif = localStorage.getItem('fv_notificaciones');
    if (notif) { try { const arr = JSON.parse(notif); this.notificaciones = arr; this.numNotificaciones = arr.length; } catch {} }
    const msgs = localStorage.getItem(this.authService.mensajeKey());
    if (msgs) { try { this.mensajes = JSON.parse(msgs); } catch {} }
    if (this.mensajes.length === 0) {
      this.mensajes = [{ de: 'FinVanguard', texto: 'Bienvenido a FinVanguard. Registra tus ahorros para hacer crecer tu meta.', hora: 'Ahora' }];
      localStorage.setItem(this.authService.mensajeKey(), JSON.stringify(this.mensajes));
    }
    this.numMensajes = this.mensajes.length;
    this.authService.currentUser$.subscribe((u) => {
      if (u) { this.usuarioLogueado = u; this.cdr.detectChanges(); }
    });
    this.aplicarBusqueda();
    this.construirEvolucion();
  }

  private seedSiVacio(): void {
    if (localStorage.getItem('fv_ahorros')) return;
    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
    const semilla: RegAhorro[] = [
      { id: 1, fecha: mesActual, categoria: 'Ahorro', descripcion: 'Aporte de arranque', monto: 1200, metodo: 'Transferencia' },
      { id: 2, fecha: '2026-08-15', categoria: 'Ahorro', descripcion: 'Meta viaje', monto: 500, metodo: 'Transferencia' },
      { id: 3, fecha: '2026-08-10', categoria: 'Emergencia', descripcion: 'Fondo de emergencia', monto: 300, metodo: 'Efectivo' },
      { id: 4, fecha: '2026-08-05', categoria: 'Educacion', descripcion: 'Cursos y estudios', monto: 400, metodo: 'Transferencia' },
      { id: 5, fecha: '2026-08-01', categoria: 'Ahorro', descripcion: 'Meta nueva laptop', monto: 150, metodo: 'Efectivo' },
      { id: 6, fecha: '2026-07-20', categoria: 'Ahorro', descripcion: 'Aporte mensual', monto: 1200, metodo: 'Transferencia' },
      { id: 7, fecha: '2026-07-10', categoria: 'Emergencia', descripcion: 'Fondo de emergencia', monto: 600, metodo: 'Efectivo' },
      { id: 8, fecha: '2026-06-25', categoria: 'Ahorro', descripcion: 'Aporte quincenal', monto: 600, metodo: 'Transferencia' }
    ];
    localStorage.setItem('fv_ahorros', JSON.stringify(semilla));
    this.registros = semilla;
  }

  private cargarRegistros(): void {
    const raw = localStorage.getItem('fv_ahorros');
    if (raw) { try { this.registros = JSON.parse(raw) || []; } catch { this.registros = []; } }
    else { this.registros = []; }
  }

  private guardarRegistros(): void {
    localStorage.setItem('fv_ahorros', JSON.stringify(this.registros));
  }

  aplicarBusqueda(): void {
    const q = this.busqueda.toLowerCase().trim();
    const hoy = new Date();
    let filtrados = [...this.registros];
    if (this.periodo === 'mes') {
      const k = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      filtrados = filtrados.filter(r => r.fecha.slice(0, 7) === k);
    } else if (this.periodo === 'anio') {
      filtrados = filtrados.filter(r => r.fecha.slice(0, 4) === String(hoy.getFullYear()));
    }
    if (q) filtrados = filtrados.filter(r => r.descripcion.toLowerCase().includes(q) || r.categoria.toLowerCase().includes(q));
    filtrados.sort((a, b) => b.fecha.localeCompare(a.fecha));
    this.registrosVisibles = this.mostrarTodos ? filtrados : filtrados.slice(0, 4);
    this.recalcular();
  }

  private recalcular(): void {
    this.totalAhorrado = this.registros.reduce((s, r) => s + Number(r.monto), 0);
    this.faltante = Math.max(0, this.metaAhorro - this.totalAhorrado);
    const circ = 2 * Math.PI * 78;
    const frac = this.metaAhorro > 0 ? Math.min(1, this.totalAhorrado / this.metaAhorro) : 0;
    this.donaDash = `${(frac * circ).toFixed(2)} ${circ.toFixed(2)}`;

    const hoy = new Date();
    const kMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const kAnio = String(hoy.getFullYear());
    const sum = (k: string) => this.registros.filter(r => r.fecha.slice(0, k.length) === k).reduce((s, r) => s + Number(r.monto), 0);
    this.ahorroPeriodo = this.periodo === 'mes' ? sum(kMes) : this.periodo === 'anio' ? sum(kAnio) : this.totalAhorrado;

    const prev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const kPrevMes = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const mActual = sum(kMes);
    const mAnt = sum(kPrevMes);
    this.deltaPeriodo = mAnt > 0 ? ((mActual - mAnt) / mAnt) * 100 : 0;

    const cumPrev = this.registros.filter(r => r.fecha.slice(0, 7) <= kPrevMes).reduce((s, r) => s + Number(r.monto), 0);
    this.deltaTotal = cumPrev > 0 ? ((this.totalAhorrado - cumPrev) / cumPrev) * 100 : 0;
    this.cdr.detectChanges();
  }

  private construirEvolucion(): void {
    const W = 560, H = 200, padB = 24, padT = 26;
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const hoy = new Date();
    const meses: { label: string; valor: number }[] = [];
    for (let k = 5; k >= 0; k--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - k, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const valor = this.registros.filter(r => r.fecha.slice(0, 7) === key).reduce((s, r) => s + Number(r.monto), 0);
      meses.push({ label: nombres[d.getMonth()], valor });
    }
    this.hayEvo = meses.some(m => m.valor > 0);
    const max = Math.max(...meses.map(m => m.valor), 1);
    const base = H - padB, top = padT;
    const step = W / 6;
    const pts = meses.map((m, i) => ({
      x: step * i + step / 2,
      y: base - (m.valor / max) * (base - top)
    }));
    this.evoPuntos = pts;
    this.lineaPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    this.areaPath = this.lineaPath + ` L${pts[5].x.toFixed(1)},${base} L${pts[0].x.toFixed(1)},${base} Z`;
    this.lineasH = [base, Math.round((base + top) / 2), top].map(y => ({ y }));
    this.evoLabels = meses.map((m, i) => ({ x: pts[i].x, y: H - 5, txt: m.label }));
    this.evoTextos = [];
    meses.forEach((m, i) => {
      if (m.valor > 0) {
        this.evoTextos.push({ x: pts[i].x, y: pts[i].y - 9, txt: 'Q' + Number(m.valor).toLocaleString('es-GT') });
      }
    });
  }

  setPeriodo(p: Periodo): void {
    this.periodo = p;
    this.periodoAbierto = false;
    this.mostrarTodos = false;
    this.aplicarBusqueda();
  }

  toggleTodos(): void {
    this.mostrarTodos = !this.mostrarTodos;
    this.aplicarBusqueda();
  }

  abrirModal(): void {
    this.editandoId = null;
    this.form = { descripcion: '', monto: 0, categoria: 'Ahorro', metodo: 'Transferencia', fecha: this.hoyISO() };
    this.modalError = '';
    this.modalAbierto = true;
  }

  editarRegistro(r: RegAhorro): void {
    this.editandoId = r.id;
    this.form = { descripcion: r.descripcion, monto: r.monto, categoria: r.categoria, metodo: r.metodo, fecha: r.fecha.slice(0, 10) };
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
    if (this.form.fecha > this.hoyISO()) { this.modalError = 'No se puede registrar un ahorro con fecha futura (hoy es ' + this.hoyISO() + ')'; return; }
    this.guardando = true;
    setTimeout(() => {
      if (this.editandoId === null) {
        const nuevo: RegAhorro = {
          id: Date.now(),
          descripcion: desc,
          monto,
          categoria: this.form.categoria,
          metodo: this.form.metodo,
          fecha: this.form.fecha.slice(0, 10)
        };
        this.registros.push(nuevo);
      } else {
        const idx = this.registros.findIndex(r => r.id === this.editandoId);
        if (idx >= 0) {
          this.registros[idx] = {
            ...this.registros[idx],
            descripcion: desc,
            monto,
            categoria: this.form.categoria,
            metodo: this.form.metodo,
            fecha: this.form.fecha.slice(0, 10)
          };
        }
      }
      this.guardarRegistros();
      this.guardando = false;
      this.modalAbierto = false;
      this.toast(this.editandoId ? 'Ahorro actualizado' : 'Ahorro registrado');
      this.aplicarBusqueda();
      this.construirEvolucion();
      this.notificar('Nuevo ahorro registrado', `Q${monto.toLocaleString('es-GT')} · ${desc}`);
    }, 250);
  }

  eliminarRegistro(r: RegAhorro): void {
    if (!confirm(`¿Eliminar "${r.descripcion}"?`)) return;
    this.registros = this.registros.filter(x => x.id !== r.id);
    this.guardarRegistros();
    this.menuAcc = null;
    this.toast('Ahorro eliminado');
    this.aplicarBusqueda();
    this.construirEvolucion();
  }

  exportarExcel(): void {
    const filas = [
      ['Fecha', 'Categoría', 'Descripción', 'Monto', 'Método'],
      ...[...this.registros].sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map(r => [r.fecha, this.nomCat(r.categoria), r.descripcion, Number(r.monto).toFixed(2), r.metodo])
    ];
    const csv = filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ahorros.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.toast('Exportado a Excel');
  }

  private notificar(titulo: string, detalle: string): void {
    const ahora = new Date();
    const hora = `${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    this.notificaciones.unshift({ texto: detalle, hora });
    if (this.notificaciones.length > 20) this.notificaciones.pop();
    localStorage.setItem('fv_notificaciones', JSON.stringify(this.notificaciones));
    this.numNotificaciones = this.notificaciones.length;
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
    return ({ 'Ahorro': 'Ahorro', 'Emergencia': 'Emergencia', 'Educacion': 'Educación', 'Viaje': 'Viaje', 'Casa': 'Casa', 'Salud': 'Salud', 'Otros': 'Otros' } as Record<string, string>)[c] || c;
  }

  colorCat(c: string): string { return this.colores[c] || '#8FA3BD'; }

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