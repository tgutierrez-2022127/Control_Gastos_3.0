import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Repository } from 'typeorm';
import crypto from 'crypto';

dotenv.config();

interface GoogleTokenInfo {
  aud: string;
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iss?: string;
}

interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
}

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  private buildToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS) || 1200 }
    );
  }

  private toUserResponse(user: User) {
    const { password, ...userWithoutPassword } = user as User & { password: string };
    return userWithoutPassword;
  }

  async login(email: string, plainPassword: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new Error('Credenciales incorrectas');
    }

    if (!user.active) {
      throw new Error('Usuario desactivado. Contacte al administrador');
    }

    const isValid = await user.comparePassword(plainPassword);
    if (!isValid) {
      throw new Error('Credenciales incorrectas');
    }

    user.lastLogin = new Date();
    await this.userRepository.save(user);

    return {
      user: this.toUserResponse(user),
      token: this.buildToken(user)
    };
  }

  async verifyGoogleToken(credential: string): Promise<GoogleTokenInfo> {
    if (!credential) {
      throw new Error('Credencial de Google no proporcionada');
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new Error('GOOGLE_CLIENT_ID no configurado en el servidor');
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Token de Google inválido o expirado');
    }

    const payload = (await response.json()) as GoogleTokenInfo;

    if (payload.aud !== googleClientId) {
      throw new Error('El token no pertenece a esta aplicación');
    }

    if (!payload.email) {
      throw new Error('La cuenta de Google no tiene un correo asociado');
    }

    if (String(payload.email_verified) !== 'true') {
      throw new Error('El correo de Google no está verificado');
    }

    return payload;
  }

  async googleLogin(credential: string) {
    const info = await this.verifyGoogleToken(credential);

    let user = await this.userRepository.findOne({ where: { email: info.email } });

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      user = this.userRepository.create({
        email: info.email,
        fullName: info.name || `${info.given_name || ''} ${info.family_name || ''}`.trim() || info.email.split('@')[0],
        role: UserRole.USER,
        password: randomPassword,
        active: true,
        avatar: typeof info.picture === 'string' ? info.picture : null,
      });
      await this.userRepository.save(user);
    } else if (user.avatar !== (typeof info.picture === 'string' ? info.picture : null) && info.picture) {
      user.avatar = info.picture;
      await this.userRepository.save(user);
    }

    if (!user.active) {
      throw new Error('Usuario desactivado. Contacte al administrador');
    }

    user.lastLogin = new Date();
    await this.userRepository.save(user);

    return {
      user: this.toUserResponse(user),
      token: this.buildToken(user)
    };
  }

  generateTokenForUser(user: User): string {
    return this.buildToken(user);
  }

  getUserIdFromToken(authHeader?: string): number {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No autorizado');
    }
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as TokenPayload;
      return decoded.id;
    } catch {
      throw new Error('Token inválido o expirado');
    }
  }

  async actualizarPerfil(userId: number, data: { fullName?: string; email?: string; avatar?: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.email !== undefined) user.email = data.email;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    await this.userRepository.save(user);
    return { user: this.toUserResponse(user), token: this.buildToken(user) };
  }

  async cambiarPassword(userId: number, actual: string, nueva: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    const isValid = await user.comparePassword(actual);
    if (!isValid) {
      throw new Error('La contraseña actual es incorrecta');
    }
    if (!nueva || nueva.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }
    user.password = nueva;
    await this.userRepository.save(user);
    return { message: 'Contraseña actualizada correctamente' };
  }

  async refreshToken(token: string) {
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      throw new Error('Token inválido o expirado');
    }

    const user = await this.userRepository.findOne({ where: { id: decoded.id } });
    if (!user) {
      return {
        user: { id: decoded.id, email: decoded.email, role: decoded.role } as unknown as User,
        token: jwt.sign(
          { id: decoded.id, email: decoded.email, role: decoded.role },
          JWT_SECRET,
          { expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS) || 1200 }
        )
      };
    }
    if (!user.active) {
      throw new Error('Usuario desactivado. Contacte al administrador');
    }

    return {
      user: this.toUserResponse(user),
      token: this.buildToken(user)
    };
  }
}
