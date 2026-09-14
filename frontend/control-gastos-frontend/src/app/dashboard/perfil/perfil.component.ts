import { Component, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { SessionService } from '../../services/session.service';
import { SesionTimerComponent } from '../sesion-timer.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, SesionTimerComponent],
  template: `
    <div class="app-layout" (click)="settingsAbierto=false; verMensajes=false">
      <aside class="sidebar" (click)="$event.stopPropagation()">
        <div class="sidebar-top">
          <div class="sidebar-logo"><img src="assets/Logo_Fin.jpg" alt="FinVanguard" class="sidebar-logo-img"></div>
          <nav class="sidebar-menu">
            <button class="sidebar-icon" title="Dashboard" (click)="ir('/dashboard')"><i class="fas fa-credit-card"></i></button>
            <button class="sidebar-icon" title="Ingresos" (click)="ir('/ingresos')"><i class="fas fa-university"></i></button>
            <button class="sidebar-icon" title="Gastos" (click)="ir('/gastos')"><i class="fas fa-exchange-alt"></i></button>
            <button class="sidebar-icon" title="Ahorros" (click)="ir('/ahorros')"><i class="fas fa-piggy-bank"></i></button>
          </nav>
        </div>
        <div class="sidebar-bottom" style="position:relative;width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;">
          <button class="sidebar-icon sidebar-settings active" title="Configuración" (click)="toggleSettings($event)">
            <i class="fas fa-cog" [class.spin]="settingsAbierto"></i>
          </button>
          <button class="sidebar-icon sidebar-salir" title="Cerrar sesión" (click)="cerrarSesion()">
            <i class="fas fa-sign-out-alt"></i>
          </button>
          <div class="settings-menu" *ngIf="settingsAbierto" (click)="$event.stopPropagation()">
            <button class="menu-item" (click)="settingsAbierto=false; ir('/perfil')"><i class="fas fa-user-circle"></i> Mi perfil</button>
            <button class="menu-item" (click)="toast('Soporte: escribir a soporte@finvanguard.gt','info'); settingsAbierto=false"><i class="fas fa-headset"></i> Soporte / Ayuda</button>
            <div class="menu-divider"></div>
            <button class="menu-item logout" (click)="cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</button>
          </div>
        </div>
      </aside>

      <div class="content">
        <header class="header">
          <div class="titu"><span class="titu-sub">FinVanguard</span></div>
          <div class="header-right">
            <div class="notif-wrap" (click)="$event.stopPropagation()">
              <button class="header-action" title="Mensajes" (click)="toggleMensajes()"><i class="fas fa-envelope"></i></button>
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
            <app-sesion-timer></app-sesion-timer>
            <div class="profile">
              <div class="profile-photo"><img *ngIf="fotoUsuario" [src]="fotoUsuario" alt="Foto"><i *ngIf="!fotoUsuario" class="fas fa-user"></i></div>
              <div class="profile-text">
                <span class="profile-greeting">Hola</span>
                <span class="profile-name">{{nombreUsuario}}</span>
              </div>
            </div>
          </div>
        </header>

        <main class="dashboard">
          <div class="title-row">
            <div class="title-left">
              <h1 class="main-title">Mi Perfil</h1>
              <p class="main-subtitle">Vista de solo lectura — tus datos personales</p>
            </div>
          </div>

          <div class="perfil-grid">
            <article class="card foto-card">
              <div class="foto-grande">
                <img *ngIf="fotoUsuario" [src]="fotoUsuario" alt="Foto de perfil">
                <i *ngIf="!fotoUsuario" class="fas fa-user"></i>
              </div>
              <h2 class="nombre-perfil">{{nombreUsuario}}</h2>
              <p class="email-perfil">{{emailUsuario}}</p>
              <span class="role-badge" [class.admin]="rolUsuario==='ADMIN'">{{rolUsuario}}</span>
              <div class="datos-mini">
                <p><i class="fas fa-envelope"></i> Correo: <strong>{{emailUsuario}}</strong></p>
                <p><i class="fas fa-calendar-alt"></i> Miembro desde: <strong>{{miembroDesde}}</strong></p>
                <p><i class="fas fa-clock"></i> Último ingreso: <strong>{{ultimoIngreso}}</strong></p>
              </div>
            </article>

            <article class="card form-card solo-lectura">
              <h3 class="card-tit"><i class="fas fa-id-card" style="color:#00E676;margin-right:8px;"></i>Información personal — solo lectura</h3>
              <p class="solo-lectura-hint"><i class="fas fa-lock"></i> Esta vista es solo informativa. No se permiten cambios desde aquí.</p>
              <div class="dato-fila">
                <span class="dato-label"><i class="fas fa-user"></i> Nombre completo</span>
                <span class="dato-valor">{{nombreUsuario}}</span>
              </div>
              <div class="dato-fila">
                <span class="dato-label"><i class="fas fa-envelope"></i> Correo electrónico</span>
                <span class="dato-valor">{{emailUsuario}}</span>
              </div>
              <div class="dato-fila">
                <span class="dato-label"><i class="fas fa-user-shield"></i> Rol</span>
                <span class="dato-valor"><span class="role-badge inline" [class.admin]="rolUsuario==='ADMIN'">{{rolUsuario}}</span></span>
              </div>
              <div class="dato-fila">
                <span class="dato-label"><i class="fas fa-calendar-alt"></i> Miembro desde</span>
                <span class="dato-valor">{{miembroDesde}}</span>
              </div>
              <div class="dato-fila">
                <span class="dato-label"><i class="fas fa-clock"></i> Último ingreso</span>
                <span class="dato-valor">{{ultimoIngreso}}</span>
              </div>
            </article>
          </div>
        </main>
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
    .app-layout{display:grid;grid-template-columns:90px 1fr;height:100vh;background:#0B132B;font-family:'Inter','Segoe UI',system-ui,sans-serif;color:#fff;overflow:hidden}
    .sidebar{background:#121212;border-radius:0 20px 20px 0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:24px 0;z-index:10;animation:slide-left .6s cubic-bezier(.22,1,.36,1);border-right:1px solid rgba(22,160,133,.06)}
    .sidebar-logo{width:64px;height:64px;border-radius:50%;background:#FFFFFF;border:2px solid #FFFFFF;margin-bottom:24px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.25),0 0 0 1px rgba(255,255,255,.8)}
    .sidebar-logo-img{width:100%;height:100%;padding:6px;object-fit:contain;background:#FFFFFF !important;border-radius:50%;display:block}
    .sidebar-menu{display:flex;flex-direction:column;align-items:center;gap:8px}
    .sidebar-icon{width:42px;height:42px;border:none;border-radius:12px;background:transparent;color:#A0AABC;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.22,1,.36,1);position:relative;overflow:hidden}
    .sidebar-icon:hover{color:#fff;transform:scale(1.1)}
    .sidebar-icon.active{background:rgba(212,255,0,.12);color:#D4FF00}
    .sidebar-icon.active::after{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:#D4FF00;border-radius:0 3px 3px 0}
    .sidebar-settings{margin-top:auto}
    .sidebar-icon .spin{animation:spin .6s ease}
    .sidebar-salir:hover{color:#ff5c5c !important;background:rgba(255,92,92,.12)}.sidebar-salir:hover::before{opacity:0}
    .settings-menu{position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%);background:#181818;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:6px;min-width:210px;z-index:30;box-shadow:0 8px 32px rgba(0,0,0,.5);animation:slide-left .3s cubic-bezier(.22,1,.36,1)}
    .menu-item{width:100%;padding:11px 14px;border:none;border-radius:8px;background:transparent;color:#fff;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all .25s ease;text-align:left}
    .menu-item:hover{background:rgba(0,230,118,.06);padding-left:18px}
    .menu-item i{color:#00E676;width:16px;text-align:center;font-size:13px}
    .menu-item.logout i{color:#ff5c5c}
    .menu-divider{height:1px;background:rgba(255,255,255,.06);margin:6px 0}
    .content{display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .header{display:flex;align-items:center;justify-content:space-between;padding:18px 28px;flex-shrink:0;animation:fade-in .6s ease-out .2s backwards}
    .titu-sub{font-size:14px;font-weight:800;color:#00E676}
    .header-right{display:flex;align-items:center;gap:14px}
    .header-action{width:38px;height:38px;border:1px solid rgba(255,255,255,.04);border-radius:10px;background:rgba(255,255,255,.05);color:#A0AABC;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s ease}
    .header-action:hover{color:#00E676;transform:translateY(-2px)}
    .notif-wrap{position:relative}
    .notif-badge{position:absolute;top:-5px;right:-5px;background:#3498DB;color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:9999px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:1.5px solid #0B132B}
    .notif-dropdown{position:absolute;top:44px;right:0;width:320px;background:#111827;border:1px solid #1e293b;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:200;overflow:hidden;animation:slide-up .3s ease;max-height:380px;overflow-y:auto}
    .notif-header{padding:12px 16px;font-size:13px;font-weight:700;color:#fff;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(0,230,118,.06)}
    .notif-item{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.04);cursor:default}
    .notif-item:last-child{border-bottom:none}
    .notif-item span{font-size:12px;color:#00E676;font-weight:600}
    .notif-item p{margin:4px 0 0;font-size:12px;color:#A0AABC;line-height:1.4}
    .notif-empty{padding:24px;text-align:center;font-size:12px;color:#6b7280}
    .profile{display:flex;align-items:center;gap:10px}
    .profile-photo{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,rgba(22,160,133,.15),rgba(52,152,219,.1));border:1.5px solid rgba(22,160,133,.2);color:#00E676;display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden}
    .profile-photo img{width:100%;height:100%;object-fit:cover}
    .profile-text{display:flex;flex-direction:column;line-height:1.2}
    .profile-greeting{font-size:12px;color:#A0AABC}.profile-name{font-size:13px;font-weight:700;color:#00E676}
    .dashboard{flex:1;padding:0 28px 28px;overflow-y:auto;display:flex;flex-direction:column;gap:22px;max-width:1100px;margin:0 auto;width:100%}
    .title-row{display:flex;align-items:flex-start;margin-top:6px;animation:slide-up .6s cubic-bezier(.22,1,.36,1) .3s backwards}
    .main-title{font-size:2.2rem;font-weight:800;color:#00E676;margin:0;line-height:1.1;text-shadow:0 0 30px rgba(0,230,118,.15)}
    .main-subtitle{font-size:15px;color:#A0AABC;margin:4px 0 0}
    .perfil-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .card{background:linear-gradient(160deg,#151515 0%,#121212 50%,#0f0f0f 100%);border-radius:16px;padding:24px;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.04);animation:slide-up .7s cubic-bezier(.22,1,.36,1) backwards;position:relative;overflow:hidden}
    .foto-card{align-items:center;text-align:center;grid-row:span 2}
    .foto-grande{width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#16A085,#3498DB);display:flex;align-items:center;justify-content:center;font-size:40px;color:#fff;overflow:hidden;border:3px solid rgba(0,230,118,.3);box-shadow:0 0 30px rgba(0,230,118,.15)}
    .foto-grande img{width:100%;height:100%;object-fit:cover}
    .nombre-perfil{font-size:22px;font-weight:800;margin:16px 0 0;color:#fff}
    .email-perfil{font-size:13px;color:#A0AABC;margin:4px 0 14px}
    .role-badge{display:inline-block;padding:3px 12px;background:rgba(52,152,219,.15);border:1px solid rgba(52,152,219,.25);color:#3498DB;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:.5px}
    .role-badge.admin{background:rgba(212,255,0,.12);color:#D4FF00;border-color:rgba(212,255,0,.2)}
    .datos-mini{margin-top:22px;width:100%;display:flex;flex-direction:column;gap:8px;text-align:left;background:rgba(11,25,44,.5);border:1px solid rgba(255,255,255,.04);border-radius:12px;padding:14px 16px}
    .datos-mini p{margin:0;font-size:12px;color:#A0AABC}
    .datos-mini p i{color:#00E676;width:18px;margin-right:4px}
    .datos-mini strong{color:#fff}
    .form-card{display:flex;flex-direction:column;gap:14px}
    .form-card.solo-lectura{gap:0}
    .card-tit{font-size:15px;font-weight:700;color:#fff;margin:0 0 4px}
    .solo-lectura-hint{font-size:12px;color:#A0AABC;background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.08);padding:10px 12px;border-radius:10px;margin:8px 0 16px;display:flex;align-items:center;gap:8px}
    .solo-lectura-hint i{color:#3498DB}
    .dato-fila{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
    .dato-fila:last-child{border-bottom:none}
    .dato-label{font-size:13px;color:#A0AABC;font-weight:600;display:flex;align-items:center;gap:8px}
    .dato-label i{color:#00E676;width:14px;text-align:center}
    .dato-valor{font-size:14px;color:#fff;font-weight:700;text-align:right;word-break:break-all}
    .role-badge.inline{margin-left:6px}
    .campo{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#A0AABC;font-weight:600}
    .campo input{background:#121212;border:1px solid rgba(255,255,255,.08);color:#fff;border-radius:10px;padding:11px 12px;font-size:14px;outline:none;font-family:inherit}
    .campo input:focus{border-color:#00E676}
    .campo input:disabled{opacity:.55;cursor:not-allowed}
    .btn-guardar{background:#00E676;border:none;color:#0B132B;padding:12px 20px;border-radius:12px;cursor:pointer;font-weight:700;font-family:inherit;font-size:13px}
    .btn-guardar:disabled{opacity:.6;cursor:default}
    .modal-error{color:#ff5c5c;font-size:12px;font-weight:600;background:rgba(255,92,92,.12);padding:8px 12px;border-radius:8px}
    .toast{position:fixed;bottom:24px;right:24px;display:flex;align-items:center;gap:12px;background:#111827;border:1px solid #00E676;border-left:4px solid #00E676;color:#fff;padding:14px 18px;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:5000;animation:slide-up .4s cubic-bezier(.22,1,.36,1);font-size:13px;font-weight:500}
    .toast i{color:#00E676;font-size:18px}
    .toast.toast-error{border-color:#ff5c5c;border-left-color:#ff5c5c}.toast.toast-error i{color:#ff5c5c}
    .toast.toast-info{border-color:#3498DB;border-left-color:#3498DB}.toast.toast-info i{color:#3498DB}
    @media(max-width:900px){.perfil-grid{grid-template-columns:1fr}.foto-card{grid-row:auto}}
    @media(max-width:768px){.app-layout{grid-template-columns:1fr}.sidebar{display:none}.header{padding:14px 16px}.profile-text{display:none}.main-title{font-size:1.8rem}}
  `]
})
export class PerfilComponent implements OnInit {
  settingsAbierto = false;
  formNombre = '';
  formEmail = '';
  errorPerfil = '';
  guardando = false;
  passActual = '';
  passNueva = '';
  passConfirmar = '';
  verActual = false;
  verNueva = false;
  errorPass = '';
  cambiando = false;

  verMensajes = false;
  numMensajes = 0;
  mensajes: { de: string; texto: string; hora: string }[] = [];
  get tieneMensajes(): boolean { return this.numMensajes > 0; }

  private usuarioLogueado: any = null;
  get nombreUsuario(): string { return this.usuarioLogueado?.fullName || 'Usuario'; }
  get emailUsuario(): string { return this.usuarioLogueado?.email || ''; }
  get fotoUsuario(): string { return this.usuarioLogueado?.avatar || ''; }
  get rolUsuario(): string { return this.usuarioLogueado?.role || 'USER'; }
  get miembroDesde(): string {
    const d = this.usuarioLogueado?.createdAt;
    if (!d) return '—';
    const f = new Date(d);
    return `${f.getDate().toString().padStart(2,'0')}/${(f.getMonth()+1).toString().padStart(2,'0')}/${f.getFullYear()}`;
  }
  get ultimoIngreso(): string {
    const d = this.usuarioLogueado?.lastLogin;
    if (!d) return '—';
    const f = new Date(d);
    return `${f.getDate().toString().padStart(2,'0')}/${(f.getMonth()+1).toString().padStart(2,'0')}/${f.getFullYear()} ${f.getHours()}:${f.getMinutes().toString().padStart(2,'0')}`;
  }

  toastTexto = '';
  toastTipo: 'ok' | 'error' | 'info' = 'ok';
  toastActivo = false;
  private timerToast: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const guardado = localStorage.getItem('user');
    if (guardado) {
      try {
        const u = JSON.parse(guardado);
        this.usuarioLogueado = u;
        this.formNombre = u.fullName || '';
        this.formEmail = u.email || '';
      } catch {}
    }
    this.authService.currentUser$.subscribe((u) => {
      if (u) {
        this.usuarioLogueado = u;
        this.formNombre = u.fullName || '';
        this.formEmail = u.email || '';
        this.cdr.detectChanges();
      }
    });
    const msgs = localStorage.getItem(this.authService.mensajeKey());
    if (msgs) { try { this.mensajes = JSON.parse(msgs); } catch {} }
    this.numMensajes = this.mensajes.length;
  }

  ir(ruta: string): void { this.router.navigate([ruta]); }

  toggleSettings(event: Event): void {
    event.stopPropagation();
    this.settingsAbierto = !this.settingsAbierto;
    this.verMensajes = false;
  }

  toggleMensajes(): void {
    this.verMensajes = !this.verMensajes;
    this.settingsAbierto = false;
    if (this.verMensajes) this.numMensajes = 0;
  }

  guardarPerfil(): void {
    const nombre = this.formNombre.trim();
    if (!nombre) { this.errorPerfil = 'El nombre no puede estar vacío'; return; }
    this.guardando = true;
    this.errorPerfil = '';
    this.authService.actualizarPerfil({ fullName: nombre }).subscribe({
      next: () => {
        this.guardando = false;
        this.toast('Perfil actualizado');
      },
      error: (err) => {
        this.guardando = false;
        this.errorPerfil = err?.error?.message || 'No se pudo actualizar el perfil';
      }
    });
  }

  cambiarPassword(): void {
    if (!this.passActual) { this.errorPass = 'Ingresa tu contraseña actual'; return; }
    if (this.passNueva.length < 6) { this.errorPass = 'La nueva contraseña debe tener al menos 6 caracteres'; return; }
    if (this.passNueva !== this.passConfirmar) { this.errorPass = 'Las contraseñas no coinciden'; return; }
    this.cambiando = true;
    this.errorPass = '';
    this.authService.cambiarPassword(this.passActual, this.passNueva).subscribe({
      next: () => {
        this.cambiando = false;
        this.passActual = '';
        this.passNueva = '';
        this.passConfirmar = '';
        this.toast('Contraseña actualizada');
      },
      error: (err) => {
        this.cambiando = false;
        this.errorPass = err?.error?.message || 'No se pudo cambiar la contraseña';
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.sessionService.detener();
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