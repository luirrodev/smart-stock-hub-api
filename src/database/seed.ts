import MyDataSourse from '../database/data-source';
import { Role } from '../access-control/roles/entities/role.entity';
import { Permission } from '../access-control/permissions/entities/permission.entity';
import { User } from '../access-control/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await MyDataSourse.initialize();

  // Permisos básicos
  const permissions = [
    { name: 'users:read', description: 'Leer usuarios' },
    {
      name: 'users:write',
      description: 'Crear, actualizar y eliminar usuarios',
    },
    { name: 'roles:read', description: 'Leer roles' },
    { name: 'roles:write', description: 'Crear, actualizar y eliminar roles' },
    { name: 'permissions:read', description: 'Leer permisos' },
    { name: 'permissions:write', description: 'Crear y actualizar permisos' },
    { name: 'products:read', description: 'Leer productos' },
    {
      name: 'products:write',
      description: 'Crear, actualizar o eliminar productos',
    },
  ];

  // Roles básicos
  const roles = [{ name: 'admin', description: 'Administrador del sistema' }];

  // Insertar permisos si no existen
  for (const perm of permissions) {
    const exists = await MyDataSourse.getRepository(Permission).findOneBy({
      name: perm.name,
    });
    if (!exists) {
      await MyDataSourse.getRepository(Permission).save(perm);
    }
  }

  // Insertar roles si no existen
  for (const role of roles) {
    const exists = await MyDataSourse.getRepository(Role).findOneBy({
      name: role.name,
    });
    if (!exists) {
      await MyDataSourse.getRepository(Role).save(role);
    }
  }

  // Asignar permisos al rol admin
  const allPermissions = await MyDataSourse.getRepository(Permission).find();
  const adminRole = await MyDataSourse.getRepository(Role).findOne({
    where: { name: 'admin' },
    relations: ['permissions'],
  });
  if (adminRole) {
    adminRole.permissions = allPermissions;
    await MyDataSourse.getRepository(Role).save(adminRole);
  }

  // Crear usuario admin inicial si no existe
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'admin123';

  let adminUser = await MyDataSourse.getRepository(User).findOneBy({
    email: adminEmail,
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await MyDataSourse.getRepository(User).save({
      email: adminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: adminRole ?? undefined,
    });
    console.log(`Usuario admin creado: ${adminEmail} / ${adminPassword}`);
  } else {
    // Asegura que tenga el rol admin
    if (adminRole && adminUser.role && adminUser.role.id !== adminRole.id) {
      // Asignar el rol admin solo si ambos existen y son diferentes
      adminUser.role = adminRole;
      await MyDataSourse.getRepository(User).save(adminUser);
    }
    console.log(`Usuario admin ya existe: ${adminEmail}`);
  }

  console.log('Seed completado');
  await MyDataSourse.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
