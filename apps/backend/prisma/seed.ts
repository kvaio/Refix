import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// Configurar el cliente de PostgreSQL y el adaptador para Prisma 7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Crear Usuario Cliente de prueba
  const client = await prisma.user.create({
    data: {
      email: 'cliente@refix.com',
      password: 'hashed_password_here',
      name: 'Carlos Cliente',
      role: Role.CLIENT,
    },
  });

  // 2. Crear Técnico con Coordenadas (Guadalajara)
  const techUser = await prisma.user.create({
    data: {
      email: 'tecnico@refix.com',
      password: 'hashed_password_here',
      name: 'Soporte Técnico GDL',
      role: Role.TECHNICIAN,
    },
  });

  console.log('Seed ejecutado con éxito:', { client, techUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });