import MyDataSourse from '../database/data-source';
import { Role } from '../access-control/roles/entities/role.entity';
import { Permission } from '../access-control/permissions/entities/permission.entity';
import { User } from '../access-control/users/entities/user.entity';
import { StaffUser } from '../access-control/users/entities/staff-user.entity';
import { OrderStatus } from '../orders/entities/order-status.entity';
import { Store } from '../stores/entities/store.entity';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

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
    { name: 'create:components', description: 'Crear componentes' },
    { name: 'read:components', description: 'Leer componentes' },
    { name: 'update:components', description: 'Actualizar componentes' },
    { name: 'delete:components', description: 'Eliminar componentes' },
    {
      name: 'restore:components',
      description: 'Restaurar componentes eliminados',
    },
    {
      name: 'payments:refunds',
      description: 'Realizar reembolsos de pagos',
    },
    {
      name: 'payments:view',
      description: 'Ver información de pagos',
    },
    {
      name: 'categories:write',
      description: 'Crear, actualizar o eliminar categorías',
    },
  ];

  // Roles básicos
  const roles = [
    { name: 'admin', description: 'Administrador del sistema' },
    { name: 'customer', description: 'Cliente' },
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
    // Crear User
    adminUser = await MyDataSourse.getRepository(User).save({
      email: adminEmail,
      name: 'Super Admin',
      role: adminRole ?? undefined,
    });

    // Crear StaffUser asociado con la contraseña
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await MyDataSourse.getRepository(StaffUser).save({
      user: adminUser,
      userId: adminUser.id,
      password: hashedPassword,
      authProvider: 'local',
      isActive: true,
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

  // Seed default order statuses
  const orderStatuses = [
    {
      name: 'Pending',
      code: 'pending',
      description: 'Pedido recibido y pendiente de pago',
      isActive: true,
    },
    {
      name: 'Processing',
      code: 'processing',
      description: 'El pedido está siendo preparado',
      isActive: true,
    },
    {
      name: 'Shipped',
      code: 'shipped',
      description: 'El pedido ha sido enviado',
      isActive: true,
    },
    {
      name: 'Delivered',
      code: 'delivered',
      description: 'El pedido ha sido entregado al cliente',
      isActive: true,
    },
    {
      name: 'Cancelled',
      code: 'cancelled',
      description: 'El pedido ha sido cancelado',
      isActive: true,
    },
    {
      name: 'Refunded',
      code: 'refunded',
      description: 'El pedido ha sido reembolsado',
      isActive: true,
    },
    {
      name: 'Pago aceptado',
      code: 'payment_accepted',
      description: 'Pago aceptado por la pasarela de pagos',
      isActive: true,
    },
    {
      name: 'Verificado',
      code: 'verified',
      description: 'Pedido y datos verificados, listo para procesar',
      isActive: true,
    },
  ];

  for (const s of orderStatuses) {
    const exists = await MyDataSourse.getRepository(OrderStatus).findOneBy({
      code: s.code,
    });
    if (!exists) {
      await MyDataSourse.getRepository(OrderStatus).save(s);
      console.log(`Estado de pedido creado: ${s.code}`);
    }
  }

  // Seed default stores
  const stores = [
    {
      name: 'AllNovu',
      address: 'No definida',
      city: 'No definida',
      state: 'No definida',
      zipCode: 'No definida',
      country: 'No definida',
      phone: null,
      email: null,
      apiKey: randomUUID(),
    },
    {
      name: 'Mandasaldo',
      address: 'No definida',
      city: 'No definida',
      state: 'No definida',
      zipCode: 'No definida',
      country: 'No definida',
      phone: null,
      email: null,
      apiKey: randomUUID(),
    },
  ];

  for (const st of stores) {
    const exists = await MyDataSourse.getRepository(Store).findOneBy({
      name: st.name,
    });
    if (!exists) {
      await MyDataSourse.getRepository(Store).save(st);
      console.log(`Tienda creada: ${st.name} - API Key: ${st.apiKey}`);
    }
  }

  console.log('Seed completado');
  await MyDataSourse.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
