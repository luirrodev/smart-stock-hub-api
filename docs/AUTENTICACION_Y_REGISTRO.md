# Sistema de Autenticación y Registro - Documentación Completa

## Índice

1. [Descripción General](#descripción-general)
2. [Entidades Principales](#entidades-principales)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Flujos de Autenticación](#flujos-de-autenticación)
5. [Gestión de Usuarios](#gestión-de-usuarios)
6. [System de API-KEY](#sistema-de-api-key)

---

## Descripción General

El sistema de autenticación y registro implementa un modelo **multi-role** con separación entre:

- **CUSTOMER**: Clientes que compran en tiendas (pueden estar en múltiples tiendas)
- **STAFF**: Personal administrativo (sin asociación a tienda específica)

Cada rol tiene sus propias credenciales almacenadas en tablas diferentes, permitiendo máxima flexibilidad y seguridad.

---

## Entidades Principales

### 1. **User** (Tabla: `users`)

Entidad base que representa a cualquier usuario del sistema.

**Ubicación:** `/src/access-control/users/entities/user.entity.ts`

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | Identificador único |
| `email` | VARCHAR(255) UNIQUE | Email único para login |
| `name` | VARCHAR(255) | Nombre completo |
| `phone` | VARCHAR(20) | Teléfono (opcional) |
| `avatar` | TEXT | URL de avatar (hasta 500 chars) |
| `preferences` | JSONB | Preferencias del usuario |
| `role_id` (FK) | INT | Referencia a tabla `roles` |
| `customer_id` (FK) | INT | Solo para CUSTOMERS: referencia a tabla `customers` |
| `created_by` (FK) | INT | Usuario que creó este registro |
| `updated_by` (FK) | INT | Usuario que actualizó este registro |
| `created_at` | TIMESTAMPTZ | Timestamp de creación |
| `updated_at` | TIMESTAMPTZ | Timestamp de actualización |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

**Relaciones:**

```typescript
- Many-to-One → Role (eager loading)
- One-to-One → Customer (solo para CUSTOMER)
- One-to-One → StaffUser (solo para STAFF)
- Many-to-One → User (createdBy/updatedBy - auditoría)
```

---

### 2. **Customer** (Tabla: `customers`)

Entidad específica para clientes que compran en tiendas.

**Ubicación:** `/src/customers/entities/customer.entity.ts`

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | Identificador único |
| `user_id` (FK) | INT UNIQUE | Referencia a tabla `users` |
| `purchase_count` | INT | Número de compras totales |
| `total_spent` | NUMERIC(14,2) | Total gastado |
| `last_purchase_at` | TIMESTAMPTZ | Última compra |
| `notes` | TEXT | Notas adicionales |
| `created_at` | TIMESTAMPTZ | Timestamp de creación |
| `updated_at` | TIMESTAMPTZ | Timestamp de actualización |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

**Relaciones:**

```typescript
- One-to-One → User (lado propietario, cascade on delete)
- One-to-Many → ShippingAddress
- One-to-Many → StoreUser (credenciales por tienda)
```

**Características:**

- Se crea automáticamente cuando se registra un CUSTOMER
- Almacena estadísticas de compra
- Vinculado a múltiples tiendas mediante StoreUser

---

### 3. **StoreUser** (Tabla: `store_users`)

Tabla de relación que vincula un CUSTOMER a una STORE específica con credenciales propias.

**Ubicación:** `/src/access-control/users/entities/store-user.entity.ts`

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | Identificador único |
| `store_id` (FK) | INT | Referencia a tabla `stores` |
| `customer_id` (FK) | INT | Referencia a tabla `customers` |
| `password` | VARCHAR(255) | Contraseña hasheada específica de tienda (nullable) |
| `credentials` | JSONB | JSON con `{ googleId?, authProvider? }` |
| `is_active` | BOOLEAN | Estado del cliente en la tienda |
| `last_login_at` | TIMESTAMPTZ | Último login en esta tienda |
| `created_at` | TIMESTAMPTZ | Timestamp de creación |
| `updated_at` | TIMESTAMPTZ | Timestamp de actualización |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

**Constraint:**

```sql
UNIQUE(store_id, customer_id)  -- Un cliente solo una vez por tienda
```

**Relaciones:**

```typescript
- Many-to-One → Store (eager loading, cascade delete)
- Many-to-One → Customer (eager loading, cascade delete)
```

**Propósito:**

- Permite que un CUSTOMER esté registrado en múltiples tiendas
- Cada tienda puede tener credenciales diferentes
- Contraseña hasheada separadamente para cada tienda
- Soporta OAuth (googleId) por tienda

---

### 4. **StaffUser** (Tabla: `staff_users`)

Entidad específica para personal administrativo.

**Ubicación:** `/src/access-control/users/entities/staff-user.entity.ts`

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | Identificador único |
| `user_id` (FK) | INT UNIQUE | Referencia a tabla `users` |
| `password` | VARCHAR(255) | Contraseña hasheada (nullable) |
| `google_id` | VARCHAR(255) | ID de Google OAuth (nullable) |
| `auth_provider` | VARCHAR(50) | 'local' o 'google' |
| `is_active` | BOOLEAN | Estado activo/inactivo |
| `last_login_at` | TIMESTAMPTZ | Último login |
| `created_at` | TIMESTAMPTZ | Timestamp de creación |
| `updated_at` | TIMESTAMPTZ | Timestamp de actualización |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

**Relaciones:**

```typescript
- One-to-One → User (eager loading, cascade on delete)
```

**Características:**

- Se crea cuando se registra un STAFF (admin, etc.)
- Credenciales globales (no por tienda)
- Soporta OAuth global
- Puede estar inactivo sin eliminar el perfil

---

### 5. **Store** (Tabla: `stores`)

Entidad que representa una tienda.

**Ubicación:** `/src/stores/entities/store.entity.ts`

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | Identificador único |
| `name` | VARCHAR(150) | Nombre de la tienda |
| `address` | VARCHAR(255) | Dirección |
| `city` | VARCHAR(100) | Ciudad |
| `state` | VARCHAR(100) | Estado/Provincia |
| `zip_code` | VARCHAR(20) | Código postal |
| `country` | VARCHAR(100) | País |
| `phone` | VARCHAR(20) | Teléfono (opcional) |
| `email` | VARCHAR(150) | Email (opcional) |
| `api_key` | VARCHAR(255) UNIQUE | API-KEY para autenticación |
| `created_at` | TIMESTAMPTZ | Timestamp de creación |
| `updated_at` | TIMESTAMPTZ | Timestamp de actualización |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

**Relaciones:**

```typescript
- One-to-Many → StoreUser (cascade delete)
```

**API-KEY:**

- Se genera automáticamente con `crypto.randomBytes(32).toString('hex')` (64 caracteres hex)
- UNIQUE en la base de datos
- Se puede regenerar mediante endpoint
- Se usa para autenticar requests en header: `X-API-Key: <key>`

---

## Arquitectura del Sistema

```
                       ┌─────────────┐
                       │    Role     │
                       │  (roles)    │
                       └─────────────┘
                            ▲
                            │ (FK role_id)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        │            ╔══════════════╗           │
        │            ║    User      ║           │
        │            ║   (users)    ║           │
        │            ╚══════════════╝           │
        │             ▲            ▲            │
        │ (acl_user)  │  one-to-one│ (acl_user)
        │             │            │            │
   ┌─────────────┐    │      ┌──────────────┐   │
   │  StaffUser  │◄───┘      │   Customer   │   │
   │(staff_users)│           │ (customers)  │   │
   │             │           │              │   │
   │ • password  │           │ • purchaseC. │   │
   │ • googleId  │           │ • totalSpent │   │
   │ • is_active │           │              │   │
   └─────────────┘           └──────────────┘   │
                                     │           │
                                     │ (OneToMany)
                                     │
                              ┌──────────────────┐
                              │   StoreUser      │
                              │  (store_users)   │
                              │                  │
                              │  • store_id (FK) │
                              │  • customer_id   │
                              │  • password      │
                              │  • credentials   │
                              │  • is_active     │
                              │  • UNIQUE        │
                              │    (store,custo) │
                              └────────┬─────────┘
                                       │ (ManyToOne, FK store_id)
                                       │
                                    ┌──────────────┐
                                    │    Store     │
                                    │  (stores)    │
                                    │              │
                                    │ • name       │
                                    │ • address    │
                                    │ • api_key    │
                                    └──────────────┘
```

---

## Flujos de Autenticación

### Flujo 1: Registro de CUSTOMER (Nuevo - Actualizado a API-Key)

**Endpoint:** `POST /auth/register`
**Header requerido:** `X-API-Key: <api_key_de_tienda>`
**Body:**

```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "password": "Password123"
}
```

**Proceso:**

```
1. ApiKeyGuard valida la solicitud
   ├─ Lee X-API-Key del header
   ├─ Busca la tienda asociada
   ├─ Valida que el API-KEY sea válido
   └─ Popula request.store con los datos de la tienda

2. AuthController.register() recibe request
   ├─ Extrae storeId desde request.store.id
   └─ Pasa storeId a AuthService.register()

3. AuthService.register(dto, storeId)
   ├─ Busca si el email ya existe
   │  ├─ Si NO existe: Crea User + Customer
   │  └─ Si EXISTE y es CUSTOMER: Reutiliza User + Customer
   │
   ├─ StoreUsersService.registerCustomerToStore(storeId, customerId, password)
   │  ├─ Valida tienda existe
   │  ├─ Valida customer existe
   │  ├─ Valida no existe StoreUser(storeId, customerId)
   │  ├─ Hash contraseña con bcrypt (salt: 10) - HASH DIFERENTE
   │  └─ Crea StoreUser con password hasheada
   │
   └─ AuthService.generateJWT(user, storeId, storeUserId)
      └─ Retorna JWT con payload:
         {
           sub: customerId,
           customerId: customerId,
           role: 'customer',
           storeId: storeId,
           storeUserId: storeUserId,
           authMethod: 'local'
         }
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

**Validaciones:**

- ✅ X-API-Key presente y válido (validado por ApiKeyGuard)
- ✅ Tienda existe (validada por ApiKeyGuard, lanza 401 si inválida)
- ✅ Email reutilizable (si ya existe, debe ser CUSTOMER)
- ✅ Contraseña cumple regex validations
- ✅ UNIQUE(store_id, customer_id) (ConflictException si duplicado en misma tienda)

**Resultado en BD:**

- ✅ Registro en `users` con role_id=2
- ✅ Registro en `customers`
- ✅ Registro en `store_users` con password hasheada
- ✅ Token listo para usar inmediatamente

---

### Flujo 2: Login de CUSTOMER (Actualizado a API-Key)

**Endpoint:** `POST /auth/login`
**Header requerido:** `X-API-Key: <api_key_de_tienda>`
**Body:**

```json
{
  "email": "juan@example.com",
  "password": "Password123"
}
```

**Proceso:**

```
1. CustomApiKeyGuard valida la solicitud
   ├─ Lee X-API-Key del header
   ├─ Busca la tienda asociada
   ├─ Valida que el API-KEY sea válido
   └─ Popula request.store con los datos de la tienda

2. LocalStrategy valida credenciales
   ├─ Busca User por email
   └─ Para CUSTOMER: retorna User sin validar contraseña (se valida con tienda)

3. AuthController.login() para CUSTOMERS
   ├─ Extrae storeId desde request.store.id
   ├─ Valida que storeId esté presente
   ├─ Busca StoreUsers activos del customer
   ├─ Valida que StoreUser(storeId, customerId) existe
   └─ Genera token con storeId y storeUserId

4. AuthService.generateJWT(user, storeId, storeUserId)
   └─ Retorna JWT con contexto de tienda
```

**Validaciones:**

- ✅ X-API-Key presente y válido (validado por CustomApiKeyGuard)
- ✅ Tienda existe (validada por CustomApiKeyGuard, lanza 401 si inválida)
- ✅ Email existe
- ✅ Contraseña correcta (contra users.password)
- ✅ Customer registrado en esa tienda
- ✅ StoreUser.is_active = true

**Respuesta:**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

---

### Flujo 3: Login de STAFF (Existente)

**Endpoint:** `POST /auth/login`
**Body:**

```json
{
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```

**Proceso:**

```
1. LocalStrategy valida credenciales
   ├─ Busca User por email
   └─ Para STAFF: valida contraseña contra StaffUser.password

2. AuthController.login() para STAFF
   └─ No requiere storeId

3. AuthService.generateJWT(user)
   └─ Retorna JWT sin contexto de tienda
```

**Token STAFF:**

```json
{
  "sub": userId,
  "role": "admin|staff",
  "roleId": roleId,
  "authMethod": "local"
}
```

**Nota:** STAFF no tiene storeId ni storeUserId en token

---

## Gestión de Usuarios

### Creación de CUSTOMER

**Automático en:** `POST /auth/register` con `X-API-Key`

**Componentes:**

1. **ApiKeyGuard** → Valida X-API-Key header y popula request.store
2. **UsersService.create()** → Crea o reutiliza User con role_id=2
3. **CustomersService.create()** → Crea o reutiliza Customer vinculado
4. **StoreUsersService.registerCustomerToStore()** → Vincula a tienda

### Creación de STAFF

**Manual mediante:** Admin panel o API (no documentado en auth)

**Componentes:**

1. **UsersService.create()** → Crea User con role_id != 2
2. **StaffUsersService.create()** → Crea StaffUser con credenciales

### Cambio de Contraseña

**Para CUSTOMER en una tienda:**

```
StoreUsersService.changePassword(storeUserId, newPassword)
├─ Hash con bcrypt (salt: 10)
└─ Actualiza store_users.password
```

**Para STAFF:**

```
StaffUsersService.changePassword(userId, newPassword)
├─ Hash con bcrypt (salt: 10)
└─ Actualiza staff_users.password
```

### Múltiples Tiendas - CUSTOMER

Un CUSTOMER puede estar registrado en múltiples tiendas:

```
Customer(id=1) está en:
  ├─ Store(id=1) → StoreUser(id=1, password=hash1, credentials=local)
  ├─ Store(id=2) → StoreUser(id=2, password=hash2, credentials=google)
  └─ Store(id=3) → StoreUser(id=3, password=hash3, credentials=local)

Login en Store(id=1): usa StoreUser(id=1).password
Login en Store(id=2): usa StoreUser(id=2) + Google OAuth
```

---

## Sistema de API-KEY

### Generación Automática

**Cuándo:** Cuando se crea una tienda (`POST /stores`)

**Cómo:**

```typescript
crypto.randomBytes(32).toString('hex');
// Resultado: 64 caracteres hex
// Ejemplo: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
```

**Propiedades:**

- ✅ UNIQUE en la base de datos
- ✅ 256 bits de entropía (crypto-seguro)
- ✅ Prácticamente imposible de adivinar
- ✅ Sin colisiones en la práctica

---

### Regeneración Manual

**Endpoint:** `POST /stores/:id/regenerate-api-key`

**Requerimientos:**

- Autenticación: STAFF con JWT válido
- Rol: Admin o equivalente

**Proceso:**

```
1. Valida autenticación
2. Busca Store por ID
3. Genera nuevo API-KEY
4. Guarda en BD
5. Retorna Store con nuevo apiKey
```

**Respuesta:**

```json
{
  "id": 1,
  "name": "My Store",
  "apiKey": "newkey123...",
  "createdAt": "2025-02-12T10:00:00Z"
}
```

---

### Uso del API-KEY

**En requests protegidos:**

```bash
curl -X GET http://localhost:3000/protected-endpoint \
  -H "X-API-Key: a1b2c3d4e5f6..."
```

**Guard (ApiKeyGuard):**

```typescript
@UseGuards(ApiKeyGuard)
@Get('/protected')
async protectedEndpoint(@Request() req) {
  const store = req.store; // Attachado por guard
}
```

**Validaciones:**

- ❌ Falta header → 401 Unauthorized
- ❌ API-KEY inválido → 401 Unauthorized
- ✅ API-KEY válido → Continúa, `request.store` disponible

---

## Contraseñas y Hashing

### Estrategia de Hashing

**Librería:** `bcryptjs`
**Salt Rounds:** 10

**Ubicaciones:**

1. **User.password** (users table)

   - Se crea en `UsersService.create()`
   - Se valida en `LocalStrategy` para STAFF

2. **StaffUser.password** (staff_users table)

   - Se crea/actualiza en `StaffUsersService`
   - Se valida en `LocalStrategy` para STAFF

3. **StoreUser.password** (store_users table)
   - Se crea/actualiza en `StoreUsersService.registerCustomerToStore()`
   - No se valida en login común (es separado por tienda)

**Importante:** Una CUSTOMER puede tener 3 contraseñas hasheadas diferentes:

- Una en `users.password` (global)
- Una en `store_users.password` para Store(id=1)
- Una en `store_users.password` para Store(id=2)

---

## Servicios Clave

| Servicio              | Ubicación                                                   | Responsabilidad                      |
| --------------------- | ----------------------------------------------------------- | ------------------------------------ |
| **AuthService**       | `/src/auth/services/auth.service.ts`                        | Registro, login, JWT, password reset |
| **UsersService**      | `/src/access-control/users/services/users.service.ts`       | CRUD de User                         |
| **CustomersService**  | `/src/customers/services/customers.service.ts`              | CRUD de Customer                     |
| **StaffUsersService** | `/src/access-control/users/services/staff-users.service.ts` | CRUD de StaffUser                    |
| **StoreUsersService** | `/src/access-control/users/services/store-users.service.ts` | CRUD de StoreUser                    |
| **StoresService**     | `/src/stores/services/stores.service.ts`                    | CRUD de Store + API-KEY              |

---

## Guards y Middleware

| Guard                | Ubicación                                                     | Uso                                |
| -------------------- | ------------------------------------------------------------- | ---------------------------------- |
| **JWTAuthGuard**     | `/src/auth/guards/jwt-auth.guard.ts`                          | Valida JWT en endpoints protegidos |
| **PermissionsGuard** | `/src/access-control/permissions/guards/permissions.guard.ts` | Valida permisos por rol            |
| **ApiKeyGuard**      | `/src/stores/guards/api-key.guard.ts`                         | Valida API-KEY en header X-API-Key |

---

## Flujo Completo de Ejemplo

### Escenario: Un cliente se registra y accede a su cuenta

**Paso 1: Registro (con X-API-Key)**

```bash
POST /auth/register
X-API-Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
Content-Type: application/json

{
  "firstName": "Carlos",
  "lastName": "López",
  "email": "carlos@example.com",
  "password": "SecurePass123"
}
```

**BD después del Paso 1:**

- `users`: id=100, email=carlos@example.com, role_id=2
- `customers`: id=50, user_id=100
- `store_users`: id=200, store_id=5, customer_id=50, password=hash1, is_active=true

**Response:**

```json
{
  "access_token": "eyJzdWIiOjUwLCJjdXN0b21lcklkIjo1MCwicm9sZSI6ImN1c3RvbWVyIiwic3RvcmVJZCI6NSwic3RvcmVVc2VySWQiOjIwMH0...",
  "refresh_token": "..."
}
```

---

**Paso 2: Login en la misma tienda (24 horas después - con X-API-Key)**

```bash
POST /auth/login
X-API-Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
Content-Type: application/json

{
  "email": "carlos@example.com",
  "password": "SecurePass123"
}
```

**Validaciones:**

1. ✅ CustomApiKeyGuard lee y valida X-API-Key
2. ✅ User existe con ese email
3. ✅ Contraseña coincide con users.password
4. ✅ X-API-Key válida y popula request.store
5. ✅ StoreUser(5, 50) existe y is_active=true

**Response:** Nuevo JWT con storeId=5, storeUserId=200

------

**Paso 3: Cliente se registra también en Store 8 (con su API-Key)**

La tienda 8 proporciona su propia API-Key

```bash
POST /auth/register
X-API-Key: z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v
Content-Type: application/json

{
  "firstName": "Carlos",
  "lastName": "López",
  "email": "carlos@example.com",
  "password": "DifferentPass456"
}
```

**¿Qué pasa?**

- ✅ Sistema detecta que el email `carlos@example.com` ya existe
- ✅ Verifica que sea un CUSTOMER (no STAFF)
- ✅ **Reutiliza User + Customer existente**
- ✅ Crea un nuevo StoreUser(store_id=8, customer_id=50)
- ✅ Retorna JWT con contexto de Store 8

**BD después del Paso 3:**

```
users: id=100, email=carlos@example.com, role_id=2 (MISMO)
customers: id=50, user_id=100 (MISMO)
store_users:
  - id=200, store_id=5, customer_id=50, password=hash1, is_active=true (Ya existía)
  - id=300, store_id=8, customer_id=50, password=hash3, is_active=true (NUEVO)
```

El cliente ahora puede hacer login en Store 5 y Store 8 con el mismo email pero contraseñas diferentes.

---

## Notas Importantes

1. **Emails y Múltiples Tiendas:** Un email puede registrarse en múltiples tiendas
   - Primera tienda: Se crea User + Customer + StoreUser
   - Tiendas adicionales: Se reutiliza User + Customer, solo se crea StoreUser
   - Cada tienda puede tener contraseña diferente en store_users.password
   - El login siempre valida contra users.password (global)

2. **Validación de Rol:** Si un email está registrado como STAFF, no puede ser CUSTOMER
   - Los roles son mutuamente excluyentes
   - Un email STAFF no puede registrarse como CUSTOMER

3. **Contraseñas Múltiples:** Un CUSTOMER puede tener contraseñas diferentes por tienda
   - Una en `users.password` (global, para login)
   - Una en `store_users.password` para cada tienda (almacenadas, no validadas en login común)

4. **Seguridad:**
   - Contraseñas hasheadas con bcryptjs (salt: 10)
   - API-KEYs generadas con crypto.randomBytes (256-bit)
   - Soft deletes con deleted_at para auditoría

5. **Multi-Tenant:**
   - Un CUSTOMER está en múltiples tiendas
   - Cada Store tiene su propio API-KEY
   - Los JWT incluyen contexto de tienda (storeId)

6. **Roles:**
   - CUSTOMER (id=2): Acceso a tiendas específicas
   - STAFF (id!=2): Acceso global sin tienda específica
   - Otros roles posibles: ADMIN, MANAGER, etc.

---

## Variables de Entorno

```env
# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Password Reset
PASSWORD_RESET_EXPIRES_IN=3600  # 1 hora

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/smart_stock

# API
API_PORT=3000
```

---

## Conclusión

El sistema está diseñado para:

- ✅ Soportar múltiples roles (CUSTOMER, STAFF, etc.)
- ✅ Permitir clientes en múltiples tiendas
- ✅ Mantener credenciales separadas per role
- ✅ Generar tokens con contexto de tienda
- ✅ Proteger endpoints con API-KEY
- ✅ Mantener auditoría via created_by/updated_by

Es un sistema robusto, escalable y seguro para e-commerce multi-tienda.
