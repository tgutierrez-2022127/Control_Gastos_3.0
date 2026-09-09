import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-sesion-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-pill" [class.critico]="critico" title="Tu sesión expira si no hay actividad">
      <i [class]="critico ? 'fas fa-exclamation-triangle' : 'fas fa-hourglass-half'"></i>
      <span>Sesión {{ tiempo }}</span>
    </div>
  `,
  styles: [`
    .session-pill {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 13px;
      border-radius: 9999px;
      background: rgba(52, 152, 219, 0.08);
      border: 1px solid rgba(52, 152, 219, 0.25);
      color: #3498DB;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      transition: all 0.3s ease;
    }
    .session-pill i { font-size: 12px; }
    .session-pill.critico {
      background: rgba(243, 156, 18, 0.1);
      border-color: rgba(243, 156, 18, 0.4);
      color: #f39c12;
      animation: pulse-critico 1.2s ease-in-out infinite;
    }
    @keyframes pulse-critico {
      0%, 100% { box-shadow: 0 0 0 0 rgba(243, 156, 18, 0.25); }
      50% { box-shadow: 0 0 14px 2px rgba(243, 156, 18, 0.15); }
    }
  `]
})
export class SesionTimerComponent implements OnInit, OnDestroy {
  tiempo = '05:00';
  critico = false;
  private sub!: Subscription;

  constructor(private sessionService: SessionService) {}

  ngOnInit(): void {
    this.sub = this.sessionService.tiempoRestante$.subscribe(ms => {
      const seg = Math.max(0, Math.floor(ms / 1000));
      const m = Math.floor(seg / 60);
      const s = seg % 60;
      this.tiempo = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      this.critico = seg <= 60;
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }
}