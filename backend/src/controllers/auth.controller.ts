import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const AuthController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      res.status(401).json({
        success: false,
        message
      });
    }
  },

  async googleLogin(req: Request, res: Response) {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({
          success: false,
          message: 'Credencial de Google requerida'
        });
      }

      const result = await authService.googleLogin(credential);

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión con Google exitoso',
        data: result
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión con Google';
      res.status(401).json({
        success: false,
        message
      });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token requerido'
        });
      }

      const result = await authService.refreshToken(token);

      res.status(200).json({
        success: true,
        message: 'Token renovado',
        data: result
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al renovar sesión';
      res.status(401).json({
        success: false,
        message
      });
    }
  },

  async actualizarPerfil(req: Request, res: Response) {
    try {
      const userId = authService.getUserIdFromToken(req.headers.authorization);
      const { fullName, email, avatar } = req.body;

      const result = await authService.actualizarPerfil(userId, { fullName, email, avatar });

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado',
        data: result
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el perfil';
      res.status(401).json({ success: false, message });
    }
  },

  async cambiarPassword(req: Request, res: Response) {
    try {
      const userId = authService.getUserIdFromToken(req.headers.authorization);
      const { actual, nueva } = req.body;

      if (!actual || !nueva) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva son requeridas'
        });
      }

      const result = await authService.cambiarPassword(userId, actual, nueva);

      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cambiar la contraseña';
      res.status(400).json({ success: false, message });
    }
  }
};
