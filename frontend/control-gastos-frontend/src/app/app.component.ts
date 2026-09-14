import { Component, ChangeDetectorRef, NgZone, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { SessionService } from './services/session.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- ========== LOGIN ========== -->
    <div *ngIf="!logueado" class="login-page">
      <div class="bg-grid"></div>

      <div class="bg-particles">
        <div class="particle p1"></div>
        <div class="particle p2"></div>
        <div class="particle p3"></div>
        <div class="particle p4"></div>
        <div class="particle p5"></div>
        <div class="particle p6"></div>
        <div class="particle p7"></div>
        <div class="particle p8"></div>
      </div>

      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <div class="login-card">
        <div class="card-border-glow"></div>

        <div class="logo-area">
          <div class="hud-frame">
            <span class="hud-corner tl"></span>
            <span class="hud-corner tr"></span>
            <span class="hud-corner bl"></span>
            <span class="hud-corner br"></span>
          </div>
          <div class="reticle-ring"></div>
          <img src="assets/Logo_Fin.jpg" alt="FinVanguard" class="shield-logo logo-img">
          <div class="scan-line"></div>
          <div class="orbit-ring ring-1"></div>
          <div class="orbit-ring ring-2"></div>
        </div>

        <h1 class="brand-name">FinVanguard</h1>
        <p class="brand-tagline">Gestión financiera inteligente</p>

        <div *ngIf="mensajeSesionExpirada" class="alert alert-warning session-alert">
          <div class="alert-icon-wrap">
            <i class="fas fa-clock"></i>
          </div>
          <div class="alert-body">
            <strong>Sesión expirada</strong>
            <span>Su sesión ha caducado. Por favor, inicia sesión nuevamente.</span>
          </div>
        </div>

        <div *ngIf="mensaje && !mensajeSesionExpirada" [class]="esError ? 'alert alert-error' : 'alert alert-success'">
          <i [class]="esError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
          <span>{{ mensaje }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-envelope"></i>
            Correo Electronico
          </label>
          <div class="input-wrapper">
            <input
              type="email"
              [(ngModel)]="email"
              placeholder="admin@kinal.org"
              class="form-input"
              (keyup.enter)="iniciarSesion()"
            >
            <div class="input-focus-line"></div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-lock"></i>
            Contraseña
          </label>
          <div class="input-wrapper">
            <input
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="password"
              placeholder="••••••••"
              class="form-input"
              (keyup.enter)="iniciarSesion()"
            >
            <button type="button" class="toggle-pw" (click)="showPassword = !showPassword">
              <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
            <div class="input-focus-line"></div>
          </div>
        </div>

        <button
          (click)="iniciarSesion()"
          [disabled]="cargando"
          class="btn-primary"
          [class.loading]="cargando"
        >
          <span *ngIf="!cargando" class="btn-content">
            <span>Iniciar Sesion</span>
            <i class="fas fa-arrow-right"></i>
          </span>
          <span *ngIf="cargando" class="btn-content">
            <div class="spinner"></div>
            <span>Autenticando...</span>
          </span>
        </button>

        <!-- Google Login -->
        <div *ngIf="googleClienteConfigurado" class="google-divider">
          <div class="divider-line"></div>
          <span class="divider-text">o continúa con</span>
          <div class="divider-line"></div>
        </div>
        <div *ngIf="googleClienteConfigurado" id="googleButton" class="google-btn-wrap"></div>
        <div *ngIf="googleCargando" class="google-loading">Conectando con Google...</div>

        <div class="quick-actions">
          <button (click)="cargarAdmin()" class="quick-btn">
            <i class="fas fa-user-shield"></i>
            Admin
          </button>
          <button (click)="cargarUsuario()" class="quick-btn">
            <i class="fas fa-user"></i>
            Usuario
          </button>
        </div>

        <div class="card-footer">
          <div class="footer-line"></div>
          <p class="footer-label">
            <i class="fas fa-shield-alt"></i>
            Protegido por JWT
          </p>
        </div>
      </div>
    </div>

    <!-- ========== DASHBOARD (via Router) ========== -->
    <router-outlet *ngIf="logueado"></router-outlet>
  `,
  styles: [`
    /* ================================================================
       FinVanguard Design System
       Palette:
         Navy:    #0B192C
         Cobalt:  #3498DB
         Emerald: #16A085
         Ice:     #ECF0F1 / #FFFFFF
    ================================================================ */

    /* ========== KEYFRAMES ========== */
    @keyframes gradient-rotate {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes slide-in {
      from { opacity: 0; transform: translateY(40px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes float-particle {
      0%   { transform: translateY(0) translateX(0) scale(0); opacity: 0; }
      15%  { opacity: 1; transform: scale(1); }
      85%  { opacity: 0.8; }
      100% { transform: translateY(-100vh) translateX(var(--drift)) scale(0.3); opacity: 0; }
    }

    @keyframes orb-move {
      0%   { transform: translate(0, 0) scale(1); }
      33%  { transform: translate(40px, -40px) scale(1.08); }
      66%  { transform: translate(-30px, 30px) scale(0.92); }
      100% { transform: translate(0, 0) scale(1); }
    }

    @keyframes pulse-ring {
      0%   { transform: scale(1) rotate(0deg); opacity: 0.6; }
      50%  { transform: scale(1.12) rotate(180deg); opacity: 0.2; }
      100% { transform: scale(1) rotate(360deg); opacity: 0.6; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    @keyframes shake-alert {
      0%, 100% { transform: translateX(0); }
      15% { transform: translateX(-6px); }
      30% { transform: translateX(5px); }
      45% { transform: translateX(-4px); }
      60% { transform: translateX(3px); }
      75% { transform: translateX(-2px); }
    }

    @keyframes btn-shimmer {
      0%   { left: -100%; }
      100% { left: 200%; }
    }

    @keyframes tick {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.5; }
    }

    @keyframes border-dance {
      0%   { background-position: 0% 0%; }
      100% { background-position: 200% 0%; }
    }

    @keyframes hud-scan {
      0%   { top: -4px; opacity: 0; width: 40%; }
      8%   { opacity: 1; }
      50%  { width: 80%; }
      92%  { opacity: 1; }
      100% { top: calc(100% + 4px); opacity: 0; width: 40%; }
    }

    @keyframes hud-glow {
      0%, 100% {
        box-shadow:
          0 0 20px rgba(22,160,133,0.25),
          0 0 40px rgba(22,160,133,0.1),
          inset 0 0 20px rgba(22,160,133,0.08);
      }
      50% {
        box-shadow:
          0 0 30px rgba(22,160,133,0.4),
          0 0 60px rgba(22,160,133,0.2),
          0 0 90px rgba(52,152,219,0.08),
          inset 0 0 30px rgba(22,160,133,0.12);
      }
    }

    @keyframes hud-corner-pulse {
      0%, 100% { opacity: 0.6; }
      50%      { opacity: 1; }
    }

    @keyframes rotate-reticle {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to   { transform: translate(-50%, -50%) rotate(360deg); }
    }

    @keyframes fade-scale-in {
      from { opacity: 0; transform: scale(0.8); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* ========== PAGE ========== */
    .login-page {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(160deg, #060e18 0%, #0B192C 40%, #0a1520 70%, #060e18 100%);
      padding: 20px;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
    }

    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(22, 160, 133, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(22, 160, 133, 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
    }

    /* ========== PARTICLES ========== */
    .bg-particles {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      bottom: -10px;
      border-radius: 50%;
      animation: float-particle linear infinite;
    }

    .p1 { width: 4px; height: 4px; background: rgba(22, 160, 133, 0.7); left: 8%;  --drift: 60px;  animation-duration: 14s; animation-delay: 0s; }
    .p2 { width: 3px; height: 3px; background: rgba(52, 152, 219, 0.8);  left: 18%; --drift: -40px; animation-duration: 18s; animation-delay: 2s; }
    .p3 { width: 5px; height: 5px; background: rgba(22, 160, 133, 0.6); left: 32%; --drift: 50px;  animation-duration: 12s; animation-delay: 1s; }
    .p4 { width: 3px; height: 3px; background: rgba(235, 243, 249, 0.4); left: 48%; --drift: -30px; animation-duration: 20s; animation-delay: 4s; }
    .p5 { width: 6px; height: 6px; background: rgba(22, 160, 133, 0.5); left: 60%; --drift: 45px;  animation-duration: 16s; animation-delay: 0.5s; }
    .p6 { width: 3px; height: 3px; background: rgba(52, 152, 219, 0.6);  left: 72%; --drift: -55px; animation-duration: 22s; animation-delay: 3s; }
    .p7 { width: 4px; height: 4px; background: rgba(22, 160, 133, 0.5); left: 85%; --drift: 35px;  animation-duration: 15s; animation-delay: 5s; }
    .p8 { width: 3px; height: 3px; background: rgba(235, 243, 249, 0.3); left: 55%; --drift: -25px; animation-duration: 19s; animation-delay: 6s; }

    /* ========== ORBS ========== */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
      animation: orb-move 25s ease-in-out infinite;
    }

    .orb-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(22, 160, 133, 0.12), transparent 70%);
      top: -150px; right: -150px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(52, 152, 219, 0.15), transparent 70%);
      bottom: -120px; left: -100px;
      animation-delay: -8s;
    }

    .orb-3 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(11, 25, 44, 0.2), transparent 70%);
      top: 40%; left: 40%;
      animation-delay: -16s;
    }

    /* ========== CARD ========== */
    .login-card {
      background: rgba(11, 25, 44, 0.45);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-radius: 28px;
      padding: 50px 42px;
      width: 100%;
      max-width: 430px;
      border: 1px solid rgba(22, 160, 133, 0.08);
      box-shadow:
        0 0 0 1px rgba(235, 243, 249, 0.03),
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(235, 243, 249, 0.04);
      position: relative;
      z-index: 10;
      animation: slide-in 0.9s cubic-bezier(0.22, 1, 0.36, 1);
      overflow: hidden;
    }

    .card-border-glow {
      position: absolute;
      top: 0;
      left: -100%;
      width: 200%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(22, 160, 133, 0.5), rgba(52, 152, 219, 0.5), transparent);
      animation: border-dance 4s linear infinite;
    }

    .dashboard-card {
      text-align: center;
    }

    /* ========== LOGO ========== */
    .logo-area {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 24px;
      position: relative;
      height: 200px;
      animation: fade-scale-in 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .logo-glow-bg {
      display: none;
    }

    .success-glow {
      background: linear-gradient(135deg, rgba(22, 160, 133, 0.4), rgba(22, 160, 133, 0.3)) !important;
    }

    .shield-logo {
      width: 132px;
      height: 132px;
      background: #FFFFFF;
      border-radius: 50%;
      border: 2px solid rgba(22,160,133,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      z-index: 5;
      box-shadow: 0 8px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.4);
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      animation: hud-glow 2.5s ease-in-out infinite;
    }

    .shield-logo:hover {
      transform: scale(1.06);
      border-color: rgba(22,160,133,0.6);
      box-shadow:
        0 0 40px rgba(22,160,133,0.4),
        0 0 80px rgba(22,160,133,0.15),
        inset 0 0 20px rgba(22,160,133,0.1);
    }

    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 50%;
      background: #FFFFFF !important;
      position: relative;
      z-index: 2;
    }

    .scan-line {
      position: absolute;
      left: 5%;
      width: 90%;
      height: 2px;
      background: linear-gradient(90deg,
        transparent,
        rgba(22,160,133,0.1) 15%,
        rgba(22,160,133,0.7) 40%,
        rgba(52,152,219,0.8) 50%,
        rgba(22,160,133,0.7) 60%,
        rgba(22,160,133,0.1) 85%,
        transparent);
      box-shadow:
        0 0 8px rgba(22,160,133,0.5),
        0 0 20px rgba(22,160,133,0.2);
      z-index: 10;
      pointer-events: none;
      animation: hud-scan 2s ease-in-out infinite;
    }

    .hud-frame {
      position: absolute;
      inset: -12px;
      z-index: 1;
      pointer-events: none;
    }

    .hud-corner {
      position: absolute;
      width: 20px;
      height: 20px;
      animation: hud-corner-pulse 3s ease-in-out infinite;
    }

    .hud-corner::before,
    .hud-corner::after {
      content: '';
      position: absolute;
      background: rgba(22,160,133,0.6);
    }

    .hud-corner::before {
      width: 100%;
      height: 2px;
    }

    .hud-corner::after {
      width: 2px;
      height: 100%;
    }

    .hud-corner.tl { top: 0; left: 0; }
    .hud-corner.tl::before { top: 0; left: 0; }
    .hud-corner.tl::after { top: 0; left: 0; }

    .hud-corner.tr { top: 0; right: 0; }
    .hud-corner.tr::before { top: 0; right: 0; }
    .hud-corner.tr::after { top: 0; right: 0; }

    .hud-corner.bl { bottom: 0; left: 0; }
    .hud-corner.bl::before { bottom: 0; left: 0; }
    .hud-corner.bl::after { bottom: 0; left: 0; }

    .hud-corner.br { bottom: 0; right: 0; }
    .hud-corner.br::before { bottom: 0; right: 0; }
    .hud-corner.br::after { bottom: 0; right: 0; }

    .hud-corner.tr { animation-delay: 0.5s; }
    .hud-corner.bl { animation-delay: 1s; }
    .hud-corner.br { animation-delay: 1.5s; }

    .reticle-ring {
      position: absolute;
      width: 200px;
      height: 200px;
      border: 1px dashed rgba(22,160,133,0.15);
      border-radius: 50%;
      animation: rotate-reticle 20s linear infinite;
      z-index: 1;
      pointer-events: none;
    }

    .success-logo {
      background: linear-gradient(135deg, #16A085, #16A085);
      background-size: 200% 200%;
    }

    .shield-inner {
      font-size: 30px;
      color: #ECF0F1;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .orbit-ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid;
      z-index: 1;
      pointer-events: none;
    }

    .ring-1 {
      width: 190px; height: 190px;
      border-color: rgba(22, 160, 133, 0.12);
      animation: pulse-ring 4s ease-in-out infinite;
    }

    .ring-2 {
      width: 215px; height: 215px;
      border-color: rgba(52, 152, 219, 0.08);
      animation: pulse-ring 4s ease-in-out infinite;
      animation-delay: -2s;
    }

    /* ========== TEXT ========== */
    .brand-name {
      font-size: 28px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ECF0F1 30%, #16A085 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-tagline {
      color: rgba(235, 243, 249, 0.35);
      font-size: 13px;
      text-align: center;
      margin-bottom: 36px;
      letter-spacing: 0.5px;
      font-weight: 400;
    }

    /* ========== ALERTS ========== */
    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      margin-bottom: 20px;
      animation: slide-in 0.4s ease-out;
      border: 1px solid;
    }

    .alert i {
      font-size: 16px;
      flex-shrink: 0;
    }

    .alert-error {
      background: rgba(231, 76, 60, 0.08);
      color: #e74c3c;
      border-color: rgba(231, 76, 60, 0.15);
    }

    .alert-success {
      background: rgba(22, 160, 133, 0.08);
      color: #16A085;
      border-color: rgba(22, 160, 133, 0.15);
    }

    .session-alert {
      background: rgba(243, 156, 18, 0.08);
      color: #f39c12;
      border-color: rgba(243, 156, 18, 0.2);
      flex-direction: column;
      text-align: center;
      gap: 8px;
      padding: 18px 16px;
      animation: shake-alert 0.6s ease-in-out;
    }

    .alert-icon-wrap {
      font-size: 32px;
      animation: tick 2s ease-in-out infinite;
    }

    .alert-body {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .alert-body strong {
      font-size: 15px;
      font-weight: 600;
    }

    .alert-body span {
      font-size: 12px;
      opacity: 0.8;
    }

    /* ========== FORM ========== */
    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(235, 243, 249, 0.5);
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      letter-spacing: 0.3px;
    }

    .form-label i {
      font-size: 11px;
      color: rgba(22, 160, 133, 0.6);
    }

    .input-wrapper {
      position: relative;
    }

    .form-input {
      width: 100%;
      padding: 14px 16px;
      background: rgba(11, 25, 44, 0.5);
      border: 1.5px solid rgba(236, 240, 241, 0.06);
      border-radius: 14px;
      color: #ECF0F1;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      box-sizing: border-box;
    }

    .form-input::placeholder {
      color: rgba(235, 243, 249, 0.18);
    }

    .form-input:focus {
      border-color: rgba(22, 160, 133, 0.45);
      background: rgba(11, 25, 44, 0.7);
      box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.06), 0 0 24px rgba(22, 160, 133, 0.04);
    }

    .input-focus-line {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #16A085, #3498DB);
      border-radius: 0 0 14px 14px;
      transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      transform: translateX(-50%);
    }

    .form-input:focus ~ .input-focus-line {
      width: 100%;
    }

    .toggle-pw {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: rgba(235, 243, 249, 0.25);
      cursor: pointer;
      padding: 4px;
      font-size: 14px;
      transition: color 0.25s ease;
    }

    .toggle-pw:hover {
      color: rgba(22, 160, 133, 0.8);
    }

    /* ========== BUTTONS ========== */
    .btn-primary {
      width: 100%;
      padding: 15px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #16A085, #16A085, #3498DB);
      background-size: 200% 200%;
      animation: gradient-rotate 4s ease infinite;
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
      overflow: hidden;
      margin-top: 6px;
      letter-spacing: 0.3px;
    }

    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(235, 243, 249, 0.18), transparent);
    }

    .btn-primary:hover:not(:disabled)::before {
      animation: btn-shimmer 0.7s ease-out;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow:
        0 8px 28px rgba(22, 160, 133, 0.3),
        0 4px 12px rgba(52, 152, 219, 0.2);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-primary:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .btn-primary.loading {
      background: rgba(11, 25, 44, 0.6);
      border: 1.5px solid rgba(22, 160, 133, 0.2);
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(235, 243, 249, 0.15);
      border-top-color: #16A085;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    /* ========== QUICK FILL ========== */
    .quick-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 20px;
    }

    /* ========== GOOGLE LOGIN ========== */
    .google-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 22px 0 14px;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(22, 160, 133, 0.25), transparent);
    }

    .divider-text {
      font-size: 12px;
      color: rgba(235, 243, 249, 0.4);
      letter-spacing: 0.3px;
      white-space: nowrap;
    }

    .google-btn-wrap {
      display: flex;
      justify-content: center;
      min-height: 44px;
    }

    .google-loading {
      text-align: center;
      color: rgba(52, 152, 219, 0.8);
      font-size: 13px;
      margin-top: 10px;
    }

    .quick-btn {
      padding: 8px 20px;
      border-radius: 9999px;
      border: 1px solid rgba(235, 243, 249, 0.06);
      background: rgba(11, 25, 44, 0.3);
      color: rgba(235, 243, 249, 0.4);
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.2px;
    }

    .quick-btn:hover {
      background: rgba(22, 160, 133, 0.1);
      border-color: rgba(22, 160, 133, 0.25);
      color: #16A085;
      transform: translateY(-1px);
    }

    .quick-btn i {
      font-size: 10px;
    }

    /* ========== CARD FOOTER ========== */
    .card-footer {
      margin-top: 28px;
    }

    .footer-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(22, 160, 133, 0.12), transparent);
      margin-bottom: 16px;
    }

    .footer-label {
      font-size: 11px;
      color: rgba(235, 243, 249, 0.18);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      letter-spacing: 0.3px;
    }

    .footer-label i {
      font-size: 10px;
      color: rgba(22, 160, 133, 0.3);
    }

    /* ========== USER CARD (Dashboard) ========== */
    .user-card {
      background: rgba(11, 25, 44, 0.4);
      border: 1px solid rgba(235, 243, 249, 0.05);
      border-radius: 16px;
      padding: 8px;
      margin: 28px 0 20px;
    }

    .user-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 12px;
      transition: background 0.2s ease;
    }

    .user-row:hover {
      background: rgba(22, 160, 133, 0.04);
    }

    .user-row:not(:last-child) {
      border-bottom: 1px solid rgba(235, 243, 249, 0.04);
    }

    .user-row-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, rgba(22, 160, 133, 0.12), rgba(52, 152, 219, 0.12));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-row-icon i {
      font-size: 13px;
      color: #16A085;
    }

    .user-row-data {
      display: flex;
      flex-direction: column;
      gap: 1px;
      text-align: left;
    }

    .user-row-label {
      font-size: 11px;
      color: rgba(235, 243, 249, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .user-row-value {
      font-size: 14px;
      color: #ECF0F1;
      font-weight: 500;
    }

    .role-badge {
      display: inline-block;
      padding: 2px 10px;
      background: rgba(22, 160, 133, 0.12);
      border: 1px solid rgba(22, 160, 133, 0.2);
      border-radius: 6px;
      color: #16A085 !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px;
    }

    /* ========== SESSION TIMER ========== */
    .session-timer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 16px;
      background: rgba(243, 156, 18, 0.06);
      border: 1px solid rgba(243, 156, 18, 0.12);
      border-radius: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: rgba(243, 156, 18, 0.75);
      animation: tick 2.5s ease-in-out infinite;
    }

    .session-timer strong {
      color: #f39c12;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .session-timer i {
      font-size: 12px;
    }

    /* ========== LOGOUT ========== */
    .btn-logout {
      width: 100%;
      padding: 14px;
      border: 1.5px solid rgba(231, 76, 60, 0.2);
      border-radius: 14px;
      background: rgba(231, 76, 60, 0.05);
      color: #e74c3c;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-logout:hover {
      background: rgba(231, 76, 60, 0.1);
      border-color: rgba(231, 76, 60, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(231, 76, 60, 0.12);
    }

    .btn-logout:active {
      transform: translateY(0);
    }

    /* ========== RESPONSIVE ========== */
    @media (max-width: 480px) {
      .login-card {
        padding: 38px 26px;
        border-radius: 22px;
      }
      .brand-name {
        font-size: 24px;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  email: string = '';
  password: string = '';
  cargando: boolean = false;
  googleCargando = false;
  mensaje: string = '';
  esError: boolean = false;
  logueado: boolean = false;
  usuario: any = null;
  showPassword: boolean = false;
  mensajeSesionExpirada: boolean = false;

  googleClientId = environment.googleClientId;
  get googleClienteConfigurado(): boolean { return !!this.googleClientId; }

  private subs: Subscription[] = [];
  private googleInitIntentos = 0;
  private googleElemento: HTMLElement | null = null;
  private googleCallback: (resp: any) => void;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService,
    private ngZone: NgZone
  ) {
    console.log('APP INICIADA');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.authService.logout();
    this.logueado = false;
    this.usuario = null;
    this.googleCallback = (resp: any) => this.ngZone.run(() => this.manejarCredencialGoogle(resp));
  }

  ngOnInit(): void {
    this.subs.push(
      this.authService.currentUser$.subscribe((user) => {
        const haySesion = !!user && this.authService.isLoggedIn();
        if (haySesion !== this.logueado) {
          this.logueado = haySesion;
          this.usuario = user || null;
          this.cdr.detectChanges();
          if (haySesion) {
            this.sessionService.iniciar();
          } else {
            this.sessionService.detener();
            this.inicializarGoogle();
          }
        }
      }),
      this.sessionService.sesionFinalizada$.subscribe((expirada) => {
        if (expirada) {
          this.mensajeSesionExpirada = true;
          this.cdr.detectChanges();
        }
      })
    );
    this.inicializarGoogle();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private inicializarGoogle(): void {
    if (!this.googleClienteConfigurado) return;
    const w = window as any;
    if (!w.google || !w.google.accounts || !w.google.accounts.id) {
      if (this.googleInitIntentos < 90) {
        this.googleInitIntentos++;
        setTimeout(() => this.inicializarGoogle(), 500);
      }
      return;
    }
    const el = document.getElementById('googleButton');
    if (!el || el === this.googleElemento) return;
    try {
      w.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: this.googleCallback,
        ux_mode: 'popup',
        auto_select: false,
      });
      w.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        width: el.clientWidth || 300,
        text: 'continue_with',
        shape: 'pill',
      });
      this.googleElemento = el;
      console.log('Botón de Google renderizado');
    } catch (e) {
      console.error('Error al iniciar Google:', e);
    }
  }

  private manejarCredencialGoogle(resp: any): void {
    if (!resp || !resp.credential) {
      this.mensaje = 'No se pudo obtener la credencial de Google';
      this.esError = true;
      this.cdr.detectChanges();
      return;
    }
    this.googleCargando = true;
    this.mensaje = '';
    this.mensajeSesionExpirada = false;
    this.cdr.detectChanges();

    this.authService.loginGoogle(resp.credential).subscribe({
      next: () => {
        this.googleCargando = false;
        try { (window as any)?.google?.accounts?.id?.disableAutoSelect(); } catch { /* ignore */ }
        this.cdr.detectChanges();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.googleCargando = false;
        this.mensaje = err?.error?.message || 'Error al iniciar sesión con Google';
        this.esError = true;
        this.cdr.detectChanges();
      }
    });
  }

  cargarAdmin() {
    this.email = 'admin@kinal.org';
    this.password = 'Admin123!';
    this.mensaje = '';
    this.esError = false;
    this.mensajeSesionExpirada = false;
  }

  cargarUsuario() {
    this.email = 'usuario@kinal.org';
    this.password = 'User123!';
    this.mensaje = '';
    this.esError = false;
    this.mensajeSesionExpirada = false;
  }

  iniciarSesion() {
    if (!this.email || !this.password) {
      this.mensaje = 'Completa todos los campos';
      this.esError = true;
      this.mensajeSesionExpirada = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.mensaje = '';
    this.esError = false;
    this.mensajeSesionExpirada = false;
    this.cdr.detectChanges();

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.email = '';
        this.password = '';
        this.cdr.detectChanges();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        this.mensaje = err?.error?.message || 'Error al iniciar sesión';
        this.esError = true;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarSesion(sesionExpirada: boolean = false) {
    this.authService.logout();
    this.sessionService.detener();
    this.logueado = false;
    this.usuario = null;
    this.email = '';
    this.password = '';
    this.esError = false;
    this.mensajeSesionExpirada = sesionExpirada;
    this.mensaje = '';
    this.googleElemento = null;
    this.cdr.detectChanges();
    this.router.navigate(['/']);
    this.inicializarGoogle();
  }
}
