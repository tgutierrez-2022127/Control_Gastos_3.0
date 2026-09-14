import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import gastosRoutes from './routes/gastos.routes';
import ingresosRoutes from './routes/ingresos.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

  if (email === 'admin@kinal.org' && password === 'Admin123!') {
    const token = jwt.sign(
      { id: 1, email: 'admin@kinal.org', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: 1200 }
    );
    return res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: 1,
          email: 'admin@kinal.org',
          role: 'ADMIN',
          fullName: 'Administrador Kinal'
        },
        token
      }
    });
  }

  if (email === 'usuario@kinal.org' && password === 'User123!') {
    const token = jwt.sign(
      { id: 2, email: 'usuario@kinal.org', role: 'USER' },
      JWT_SECRET,
      { expiresIn: 1200 }
    );
    return res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: 2,
          email: 'usuario@kinal.org',
          role: 'USER',
          fullName: 'Usuario Kinal'
        },
        token
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Credenciales incorrectas'
  });
});

app.use('/api/gastos', gastosRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/auth', authRoutes);

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Conectado a PostgreSQL - control_gastos');
    console.log('Tablas creadas: users, gastos, ingresos');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

startServer();
