import { AppDataSource } from './config/database';
import { User, UserRole } from './entities/User';
import bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);

  const admin = await repo.findOne({ where: { email: 'admin@kinal.org' } });
  if (!admin) {
    await repo.save(
      repo.create({
        id: 1,
        email: 'admin@kinal.org',
        fullName: 'Administrador Kinal',
        role: UserRole.ADMIN,
        password: await bcrypt.hash('Admin123!', 10),
        active: true,
      })
    );
    console.log('Admin creado (id=1)');
  }

  const usuario = await repo.findOne({ where: { email: 'usuario@kinal.org' } });
  if (!usuario) {
    await repo.save(
      repo.create({
        id: 2,
        email: 'usuario@kinal.org',
        fullName: 'Usuario Kinal',
        role: UserRole.USER,
        password: await bcrypt.hash('User123!', 10),
        active: true,
      })
    );
    console.log('Usuario creado (id=2)');
  }

  console.log('Seed completado');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
