import { DataSource } from 'typeorm';
import MyDataSourse from '../database/data-source';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../roles/entities/permission.entity';
import { User } from '../users/entities/user.entity';
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
    { name: 'brands:read', description: 'Leer marcas' },
    {
      name: 'brands:write',
      description: 'Crear, actualizar o eliminar marcas',
    },
    { name: 'categories:read', description: 'Leer categorías' },
    {
      name: 'categories:write',
      description: 'Crear, actualizar o eliminar categorías',
    },
    { name: 'products:read', description: 'Leer productos' },
    {
      name: 'products:write',
      description: 'Crear, actualizar o eliminar productos',
    },
    { name: 'warehouses:read', description: 'Permite leer almacenes' },
    {
      name: 'warehouses:write',
      description: 'Permite crear, actualizar y eliminar almacenes',
    },
  ];

  // Roles básicos
  const roles = [
    { name: 'admin', description: 'Administrador del sistema' },
    { name: 'manager', description: 'Gestor de recursos' },
    { name: 'user', description: 'Usuario básico' },
  ];

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

  // Asignar permisos a roles
  const allPermissions = await MyDataSourse.getRepository(Permission).find();
  const adminRole = await MyDataSourse.getRepository(Role).findOne({
    where: { name: 'admin' },
    relations: ['permissions'],
  });
  const managerRole = await MyDataSourse.getRepository(Role).findOne({
    where: { name: 'manager' },
    relations: ['permissions'],
  });
  const userRole = await MyDataSourse.getRepository(Role).findOne({
    where: { name: 'user' },
    relations: ['permissions'],
  });

  if (adminRole) {
    adminRole.permissions = allPermissions;
    await MyDataSourse.getRepository(Role).save(adminRole);
  }

  if (managerRole) {
    managerRole.permissions = allPermissions.filter((p) =>
      ['users:read', 'roles:read', 'permissions:read'].includes(p.name),
    );
    await MyDataSourse.getRepository(Role).save(managerRole);
  }

  if (userRole) {
    userRole.permissions = [];
    await MyDataSourse.getRepository(Role).save(userRole);
  }

  // Por ejemplo, para el rol admin:
  if (adminRole) {
    const warehousePerms = await MyDataSourse.getRepository(Permission).find({
      where: [{ name: 'warehouses:read' }, { name: 'warehouses:write' }],
    });
    adminRole.permissions = [...adminRole.permissions, ...warehousePerms];
    await MyDataSourse.getRepository(Role).save(adminRole);
  }

  // Crear usuario admin inicial si no existe
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'admin123'; // Cambia esto en producción

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
