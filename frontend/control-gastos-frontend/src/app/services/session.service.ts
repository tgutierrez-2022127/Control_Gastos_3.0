import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, interval, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Controla el vencimiento de la sesión por INACTIVIDAD.
 * - Cuenta regresiva constante (visible en el header).
 * - Se reinicia con cualquier actividad del usuario (mouse, teclado, touch, scroll).
 * - Renueva el JWT de forma silenciosa mientras la sesión está activa,
 *   para que el token no expire por tiempo fijo sino por inactividad.
 * - Si llega a 0, cierra la sesión (logout) y notifica.
 */
@Injectable({ providedIn: 'root' })
export class SessionService implements OnDestroy {
  static readonly LIMITE_INACTIVIDAD_MS = 5 * 60 * 1000; // 5 minutos
  private static readonly UMBRAL_REFRESH_MS = 60 * 1000;  // renueva si faltan <60s
  private static readonly MIN_GAP_REFRESH_MS = 30 * 1000; // no renueva más de una vez cada 30s

  private _tiempoRestante$ = new BehaviorSubject<number>(SessionService.LIMITE_INACTIVIDAD_MS);
  public tiempoRestante$ = this._tiempoRestante$.asObservable();

  public sesionFinalizada$ = new BehaviorSubject<boolean>(false);

  private lastActivity = Date.now();
  private intervalSub: Subscription | null = null;
  private activitySub: Subscription | null = null;
  private ultimaRenovacion = 0;
  private renovando = false;

  constructor(private authService: AuthService) {}

  get tiempoRestante(): number {
    return this._tiempoRestante$.value;
  }

  iniciar(): void {
    this.sesionFinalizada$.next(false);
    this.lastActivity = Date.now();
    this._tiempoRestante$.next(SessionService.LIMITE_INACTIVIDAD_MS);

    this.detener();

    if (this.activitySub) { this.activitySub.unsubscribe(); this.activitySub = null; }
    if (this.intervalSub) { this.intervalSub.unsubscribe(); this.intervalSub = null; }

    this.activitySub = Subscription.EMPTY;
    this.intervalSub = Subscription.EMPTY;

    const eventos = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click', 'scroll'];
    const subs: Subscription[] = eventos.map(e => fromEvent(document, e).subscribe(() => this.notificarActividad()));
    this.activitySub = new Subscription(() => subs.forEach(s => s.unsubscribe()));

    this.intervalSub = interval(1000).subscribe(() => this.decrementar());
  }

  private notificarActividad(): void {
    this.lastActivity = Date.now();
    if (this._tiempoRestante$.value < SessionService.LIMITE_INACTIVIDAD_MS - 1000) {
      this._tiempoRestante$.next(SessionService.LIMITE_INACTIVIDAD_MS);
    }

    const expMs = this.authService.sesionExpiraEnMs();
    const ahora = Date.now();
    if (
      this.authService.isLoggedIn() &&
      expMs > 0 &&
      expMs < SessionService.UMBRAL_REFRESH_MS &&
      !this.renovando &&
      ahora - this.ultimaRenovacion > SessionService.MIN_GAP_REFRESH_MS
    ) {
      this.renovando = true;
      this.ultimaRenovacion = ahora;
      this.authService.refreshToken().subscribe({
        next: () => { this.renovando = false; },
        error: () => { this.renovando = false; }
      });
    }
  }

  private decrementar(): void {
    if (!this.authService.isLoggedIn()) return;

    const restante = SessionService.LIMITE_INACTIVIDAD_MS - (Date.now() - this.lastActivity);
    if (restante <= 0) {
      this._tiempoRestante$.next(0);
      this.sesionFinalizada$.next(true);
      this.authService.logout();
      this.detener();
      return;
    }

    this._tiempoRestante$.next(restante);
  }

  detener(): void {
    if (this.intervalSub) { this.intervalSub.unsubscribe(); this.intervalSub = null; }
    if (this.activitySub) { this.activitySub.unsubscribe(); this.activitySub = null; }
    this._tiempoRestante$.next(0);
  }

  ngOnDestroy(): void {
    this.detener();
  }
}