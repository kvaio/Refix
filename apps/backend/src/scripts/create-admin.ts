import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';
import 'dotenv/config';

async function main() {
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    throw new Error(
      'Configura DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NAME antes de crear el administrador.',
    );
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Ya existe una cuenta con ese correo. No se modificó ninguna cuenta.');
    }

    const admin = await prisma.user.create({
      data: {
        name: ADMIN_NAME.trim(),
        email,
        password: await hash(ADMIN_PASSWORD, 12),
        role: Role.ADMIN,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    console.log('Administrador creado:', admin.email);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
