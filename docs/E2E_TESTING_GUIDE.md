# Pruebas E2E del Módulo de Autenticación - Documentación Completa

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Diferencia entre Unit Tests y E2E Tests](#diferencia-entre-unit-tests-y-e2e-tests)
3. [Arquitectura de las Pruebas E2E](#arquitectura-de-las-pruebas-e2e)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Base de Datos de Prueba](#base-de-datos-de-prueba)
6. [Cómo Ejecutar las Pruebas](#cómo-ejecutar-las-pruebas)
7. [Explicación de los Test Cases](#explicación-de-los-test-cases)
8. [Helpers y Utilidades](#helpers-y-utilidades)
9. [Best Practices](#best-practices)

---

## Introducción

Las **pruebas E2E (End-to-End)** son un tipo de prueba que verifica todo el flujo completo de la aplicación, desde la petición HTTP hasta la respuesta final, pasando por:

- ✅ Controladores (Controllers)
- ✅ Servicios (Services)
- ✅ Base de datos (Database)
- ✅ Validaciones
- ✅ Autenticación y Autorización

**Objetivo**: Garantizar que la aplicación funciona correctamente como un sistema completo.

---

## Diferencia entre Unit Tests y E2E Tests

### Unit Tests (Pruebas Unitarias) ✓ Ya existentes

```
Request → [MOCK Service] → Response
              ↓
        Solo testea el Controller
        Los Services, BD, etc. son mocks
```

**Ventajas**:

- ⚡ Ejecución rápida
- 🎯 Aislan problemas específicos
- 💰 Bajo costo de computación

**Desventajas**:

- ❌ No detecta problemas de integración
- ❌ Los mocks pueden no ser realistas

**Ubicación**: `/src/auth/**/*.spec.ts`

### E2E Tests (Pruebas de Integración Completa) ✓ Nuevo

```
Request → Controller → Service → Database → Response
                    ↓
        Flujo COMPLETO sin mocks
```

**Ventajas**:

- ✅ Detecta problemas de integración
- ✅ Prueba la aplicación como la ve el usuario
- ✅ Verifica BD, autenticación, etc.

**Desventajas**:

- 🐢 Ejecución más lenta
- 💾 Requiere BD separada
- 🔧 Más complejo de mantener

**Ubicación**: `/test/auth.e2e-spec.ts`

---

## Arquitectura de las Pruebas E2E

### Flujo de Inicialización

```
┌─────────────────────────────────────────────────────────┐
│ npm run test:e2e                                        │
└────────────────┬────────────────────────────────────────┘
                 ↓
         beforeAll() ejecuta:
┌─────────────────────────────────────────────────────────┐
│ 1. createTestDataSource()                               │
│    ↓ Crea conexión a BD: "smart_stock_hub_e2e_test"    │
│                                                          │
│ 2. Test.createTestingModule()                          │
│    ↓ Inicializa la app NestJS completa                 │
│                                                          │
│ 3. seedTestData()                                       │
│    ↓ Crea roles, usuarios, tiendas de prueba            │
└─────────────────────────────────────────────────────────┘
                 ↓
    Cada test ejecuta independientemente
                 ↓
         afterAll() ejecuta:
┌─────────────────────────────────────────────────────────┐
│ 1. app.close()                                          │
│ 2. closeTestDatabase()                                  │
└─────────────────────────────────────────────────────────┘
```

### Aislamiento de Datos

Para garantizar que cada test sea independiente:

```typescript
afterEach(async () => {
  // Opción 1: Limpiar completamente (más seguro, más lento)
  await cleanDatabase(dataSource);

  // Opción 2: Usar transactions (más rápido pero más complejo)
  // await dataSource.transaction(async () => {
  //   // Test aquí
  //   // Rollback automático al final
  // });
});
```

---

## Estructura de Archivos

```
smart-stock-hub-api/
├── test/                           # ← Carpeta nueva de pruebas E2E
│   ├── jest-e2e.json              # Configuración de Jest para E2E
│   ├── database.ts               # Utilities de BD
│   ├── auth.helpers.ts           # Helpers para crear usuarios, etc.
│   └── auth.e2e-spec.ts          # Tests principales ← Aquí está todo
│
└── src/
    └── auth/
        ├── controllers/
        │   └── auth.controller.spec.ts    # Unit tests ✓ (ya existen)
        ├── services/
        │   └── auth.service.spec.ts       # Unit tests ✓ (ya existen)
        └── ...
```

---

## Base de Datos de Prueba

### Configuración Automática

La BD de prueba se crea automáticamente con estas características:

```typescript
// test/database.ts

new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'smart_stock_hub_e2e_test', // ← Nombre único
  synchronize: true, // ← Schema se crea automático
  dropSchema: false, // ← Preserva entre tests
  entities: ['src/**/*.entity.ts'], // ← Carga todas las entities
});
```

### Limpieza de Datos

```typescript
// Opción 1: Limpiar tablas (usar al final)
await cleanDatabase(dataSource);
// ↓ Ejecuta: TRUNCATE TABLE ... CASCADE
// ↓ Mantiene la estructura, solo borra datos

// Opción 2: Resetear secuencias de ID
await resetSequences(dataSource);
// ↓ Resetea los contadores de ID a 1
// ↓ Útil para tener IDs predecibles en tests
```

### Seedeo de Datos

```typescript
// Ejecutado una sola vez en beforeAll()
const testData = await seedTestData(dataSource);

// Retorna:
testData = {
  store: { id: 1, name: 'Test Store', ... },
  staffUser: { id: 1, email: 'staff@test.com', ... },
  customerUser: { id: 2, email: 'customer@test.com', ... },
  storeUser: { id: 1, customerId: 2, storeId: 1, ... }
}

// Usar en tests:
it('test', () => {
  const { staffUser, store } = testData;
  // testData.staffUser es reutilizable en múltiples tests
});
```

---

## Cómo Ejecutar las Pruebas

### Preparación Previa

1. **Asegurar que PostgreSQL está corriendo**:

   ```bash
   docker-compose up -d postgres
   # O si PostgreSQL está instalado localmente
   # sudo systemctl start postgresql
   ```

2. **Verificar archivo `.env`**:
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASS=postgres
   DB_NAME=smart_stock_hub
   ```

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas E2E
npm run test:e2e

# Ejecutar con modo watch (se actualiza automáticamente)
npm run test:e2e -- --watch

# Ejecutar só tests que coincidan con un patrón
npm run test:e2e -- --testNamePattern="login"

# Ejecutar con output detallado
npm run test:e2e -- --verbose

# Detectar conexiones abiertas (memory leaks)
npm run test:e2e -- --detectOpenHandles

# Coverage de E2E tests
npm run test:e2e -- --coverage
```

### Ejecutar Junto con Unit Tests

```bash
# Todos los tests (unit + e2e)
npm run test:cov

# Unit tests solamente
npm run test

# E2E tests solamente
npm run test:e2e
```

### Solucionar Problemas

```bash
# ❌ Error: "database does not exist"
# Solución: Crear la BD manualmente
psql -U postgres -c "CREATE DATABASE smart_stock_hub_e2e_test;"

# ❌ Error: "Port 5432 already in use"
# Solución: Cambiar puerto en .env
DB_PORT=5433

# ❌ Tests congelados/no terminan
# Solución: Detectar handles abiertos
npm run test:e2e -- --detectOpenHandles --runInBand

# ❌ Tests lentos
# Solución: Comentar cleanDatabase(dataSource) en afterEach
# si no es crítico para cada test
```

---

## Explicación de los Test Cases

### 1️⃣ POST /auth/login

#### Test 1: STAFF Login Exitoso ✅

```typescript
it('[✅ CRÍTICO] debe login exitoso de usuario STAFF', async () => {
  // 1. ARRANGE: Preparar datos
  const loginPayload = {
    email: 'staff@test.com',
    password: 'staffPassword123!',
  };

  // 2. ACT: Enviar request HTTP
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send(loginPayload);

  // 3. ASSERT: Verificar respuesta
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('access_token');

  // 4. ASSERT AVANZADA: Verificar contenido del token
  const decoded = decodeToken(response.body.access_token);
  expect(decoded.sub).toBe(staffUser.id);
  expect(decoded.storeId).toBeUndefined(); // STAFF sin store
});
```

**Por qué es importante**:

- ✅ Verifica el happy path más común
- ✅ Comprueba que JWT se genera correctamente
- ✅ Verifica que STAFF users no tienen storeId

#### Test 2: CUSTOMER con storeId ✅

```typescript
it('[✅ CRÍTICO] debe login de CUSTOMER con storeId en body', async () => {
  const loginPayload = {
    email: 'customer@test.com',
    password: 'customerPassword123!',
    storeId: 1, // ← CRUCIAL: Customer needs storeId
  };

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send(loginPayload);

  expect(response.status).toBe(200);

  // Verificación importante
  const decoded = decodeToken(response.body.access_token);
  expect(decoded.storeId).toBe(1); // ← Token debe incluir storeId
});
```

**Por qué es importante**:

- ✅ Verifica que customers necesitan store context
- ✅ Comprueba que storeId se incluye en el token
- ✅ Critical para multi-tenant architecture

#### Test 3: Validación - storeId requerido ❌

```typescript
it('[❌ VALIDACIÓN] rechaza CUSTOMER sin storeId', async () => {
  const loginPayload = {
    email: 'customer@test.com',
    password: 'customerPassword123!',
    // ← SIN storeId
  };

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send(loginPayload);

  expect(response.status).toBe(400);
  expect(response.body.message).toContain('storeId is required');
});
```

**Por qué es importante**:

- ✅ Verifica validaciones de entrada
- ✅ Previene accesos sin contexto de tienda
- ✅ Test de "sad path" importante para seguridad

#### Test 4: Contraseña incorrecta ❌

```typescript
it('[❌ SEGURIDAD] rechaza contraseña incorrecta', async () => {
  const loginPayload = {
    email: 'staff@test.com',
    password: 'wrongPassword123!', // ← Incorrecta
  };

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send(loginPayload);

  expect(response.status).toBe(401);
});
```

**Por qué es importante**:

- 🔒 Verifica que bcryptjs compara correctamente
- 🔒 Protege contra accesos no autorizados
- 🔒 Test de seguridad crítico

### 2️⃣ POST /auth/register

#### Test 1: Registro Exitoso ✅

```typescript
it('[✅ CRÍTICO] debe registrar nuevo usuario CUSTOMER', async () => {
  const registerPayload = {
    email: `newuser${Date.now()}@example.com`,
    firstName: 'New',
    lastName: 'User',
    password: 'securePassword123!',
  };

  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send(registerPayload);

  expect(response.status).toBe(201); // CREATED, no 200
  expect(response.body).toHaveProperty('access_token');

  // Verificar que se creó en BD
  const users = await dataSource.query(
    'SELECT * FROM "user" WHERE "email" = $1',
    [registerPayload.email],
  );
  expect(users.length).toBe(1);
});
```

**Ventajas vs Unit Test**:

- ✅ Verifica que el usuario se crea REALMENTE en BD
- ✅ Unit test solo mockearía la respuesta
- ✅ E2E test verifica persistencia

#### Test 2: Email Duplicado ❌

```typescript
it('[❌ VALIDACIÓN] rechaza email duplicado', async () => {
  const registerPayload = {
    email: testData.staffUser.email, // ← Ya existe
    firstName: 'Fake',
    lastName: 'User',
    password: 'somePassword123!',
  };

  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send(registerPayload);

  expect([409, 400]).toContain(response.status);
  expect(response.body.message).toMatch(/email|duplicate|already/i);
});
```

**Por qué es importante**:

- ✅ Verifica constraints de BD
- ✅ Previene duplicados en la base de datos real
- ✅ Solo se detecta en E2E, no en unit tests

### 3️⃣ GET /auth/profile

#### Test 1: Perfil con Token Válido ✅

```typescript
it('[✅ CRÍTICO] debe retornar perfil del usuario autenticado', async () => {
  // 1. Obtener token válido
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'staff@test.com', password: '...' });

  const accessToken = extractAccessToken(loginResponse);

  // 2. Usar token para obtener perfil
  const profileResponse = await request(app.getHttpServer())
    .get('/auth/profile')
    .set('Authorization', `Bearer ${accessToken}`);

  expect(profileResponse.status).toBe(200);
  expect(profileResponse.body).toHaveProperty('id');
  expect(profileResponse.body).toHaveProperty('email');
  expect(profileResponse.body).not.toHaveProperty('password'); // No exponer
});
```

**Por qué es importante**:

- ✅ Verifica que JWT es validado correctamente
- ✅ Comprueba que endpoints protegidos funcionan
- ✅ Verifica que no se exponen datos sensibles

#### Test 2: Sin Token ❌

```typescript
it('[🔒 SEGURIDAD] rechaza acceso sin token', async () => {
  const response = await request(app.getHttpServer()).get('/auth/profile');
  // ← SIN header Authorization

  expect(response.status).toBe(401);
});
```

**Por qué es importante**:

- 🔒 Verifica que endpoints protegidos rechacen requests sin token
- 🔒 Critical para seguridad

---

## Helpers y Utilidades

### `test/database.ts`

Proporciona utilidades para manejar la BD de prueba:

```typescript
// Crear conexión de prueba
const dataSource = await createTestDataSource();

// Limpiar todas las tablas
await cleanDatabase(dataSource);

// Resetear sequences de ID
await resetSequences(dataSource);

// Cerrar conexión
await closeTestDatabase();
```

### `test/auth.helpers.ts`

Facilita la creación de datos de prueba:

```typescript
// Crear usuarios
const staffUser = await createTestStaffUser(dataSource, {
  email: 'custom@test.com',
});

const customerUser = await createTestCustomerUser(dataSource);

// Crear tienda
const store = await createTestStore(dataSource, {
  name: 'My Store',
});

// Registrar customer en tienda
const storeUser = await registerCustomerToStore(
  dataSource,
  customerUser.id,
  store.id,
);

// Decodificar JWT
const decoded = decodeToken(accessToken);
console.log(decoded.sub); // User ID
console.log(decoded.storeId); // Store ID

// Seedear todo de una vez
const testData = await seedTestData(dataSource);
// testData.store, testData.staffUser, etc.
```

---

## Best Practices

### ✅ DO's (Hacer)

```typescript
// ✅ Usar describe() para agrupar tests relacionados
describe('POST /auth/login', () => {
  // Tests aquí
});

// ✅ Usar it() con descripción clara
it('[✅ CRÍTICO] debe login exitoso de STAFF', async () => {
  // ...
});

// ✅ Seguir patrón AAA
it('test', async () => {
  // Arrange: Preparar datos
  const loginPayload = { ... };

  // Act: Ejecutar la acción
  const response = await request(...).post(...).send(...);

  // Assert: Verificar resultado
  expect(response.status).toBe(200);
});

// ✅ Usar helpers para reducir repetición
const staffUser = await createTestStaffUser(dataSource);

// ✅ Comentar lógica compleja
// Decodificar JWT sin validar firma (solo para tests)
const decoded = decodeToken(token);

// ✅ Usar testData reutilizable
beforeAll(async () => {
  testData = await seedTestData(dataSource);
});

it('test1', () => {
  const { staffUser } = testData;  // ← Reutilizar
});
```

### ❌ DON'Ts (No hacer)

```typescript
// ❌ NO crear usuario en cada test
// Usar seedTestData() en beforeAll() en lugar
beforeEach(async () => {
  await createTestStaffUser();  // Lento y redundante
});

// ❌ NO hardcodear emails/valores
const email = 'test@example.com';  // Puede causar conflictos

// ❌ SÍ usar timestamp para unicidad
const email = `test${Date.now()}@example.com`;

// ❌ NO ignorar errores
const response = await request(...);
// expect(response.status).toBe(200);  // Ignored!

// ❌ SÍ siempre assert
expect(response.status).toBe(200);

// ❌ NO esperar todo en secuencia si puede ser paralelo
// Esto es lento si hay muchos tests independientes
await test1();
await test2();
await test3();

// ❌ SÍ usar tests paralelos cuando sea posible
// Jest ejecuta múltiples tests en paralelo por defecto
```

### 🚀 Performance Tips

```typescript
// 1. Usar transacciones en lugar de limpiar
it('test', async () => {
  await dataSource.transaction(async (manager) => {
    // Test aquí
    // Rollback automático al final = RÁPIDO
  });
});

// 2. Reutilizar conexión de BD
// ✓ createTestDataSource() usa singleton
const ds1 = await createTestDataSource();
const ds2 = await createTestDataSource();
expect(ds1).toBe(ds2);  // Same instance

// 3. No limpiar entre tests si no es necesario
afterEach(async () => {
  // await cleanDatabase();  // Comentado si tests son independientes
});

// 4. Usar --runInBand para debug
npm run test:e2e -- --runInBand
```

---

## Comparación Rápida

| Aspecto             | Unit Tests          | E2E Tests             |
| ------------------- | ------------------- | --------------------- |
| Velocidad           | ⚡⚡⚡ Muy rápido   | 🐢 Lento              |
| Complejidad         | Simple              | Complejo              |
| Cubre BD            | ❌ No (mockea)      | ✅ Sí                 |
| Detecta integración | ❌ No               | ✅ Sí                 |
| Ubicación           | `/src/**/*.spec.ts` | `/test/*.e2e-spec.ts` |
| Cobertura           | ~80% código         | ~100% flujo real      |
| Cuando ejecutar     | Antes de commit     | Antes de push         |
| Tiempo ejecución    | <10s                | >30s                  |

---

## Conclusión

**Las pruebas E2E son esenciales para garantizar que la aplicación funciona como se espera en el mundo real.** Combinadas con unit tests, proporcionan cobertura completa de la aplicación.

### Próximos Pasos

1. ✅ Ejecutar: `npm run test:e2e`
2. ✅ Verificar que todos los tests pasan
3. ✅ Agregar más tests para otros módulos
4. ✅ Integrar en CI/CD pipeline (GitHub Actions)

---

**¿Preguntas?** Revisar los comentarios en `test/auth.e2e-spec.ts` para más detalles.
