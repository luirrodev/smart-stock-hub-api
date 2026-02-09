# Guía Completa: Unit Testing con Basic Path Testing

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Fundamentos de Basic Path Testing](#fundamentos-de-basic-path-testing)
3. [Cyclomatic Complexity](#cyclomatic-complexity)
4. [Análisis de Rutas Independientes](#análisis-de-rutas-independientes)
5. [Estructura de Tests en NestJS](#estructura-de-tests-en-nestjs)
6. [Estrategia de Mocking](#estrategia-de-mocking)
7. [Patrones de Assertions](#patrones-de-assertions)
8. [Caso Real: Login Endpoint](#caso-real-login-endpoint)

---

## Introducción

### ¿Qué es Unit Testing?

Unit Testing es la práctica de escribir y ejecutar pruebas para componentes individuales (funciones, métodos, servicios) en aislamiento de otros componentes. Los objetivos son:

- **Validar comportamiento**: Asegurar que el código funciona como está diseñado
- **Detectar regresiones**: Cambios futuros no rompan funcionalidad existente
- **Documentar comportamiento**: Los tests actúan como especificación del código
- **Facilitar refactoring**: Si los tests pasan, es seguro cambiar el código

### ¿Por qué Basic Path Testing?

Hay varias técnicas de testing:

| Técnica        | Enfoque              | Cobertura  | Complejidad |
| -------------- | -------------------- | ---------- | ----------- |
| **Black Box**  | Entrada/Salida       | Variable   | Baja        |
| **White Box**  | Estructura interna   | Completa   | Media       |
| **Basic Path** | Rutas independientes | Óptima     | Media       |
| **Branch**     | Todos los if/else    | Exhaustiva | Alta        |

**Basic Path Testing** es el mejor equilibrio: garantiza cobertura completa sin ser excesivamente exhaustivo.

---

## Fundamentos de Basic Path Testing

### Concepto Clave

> Una **ruta independiente** es un camino de ejecución que tiene **al menos una arista (decisión) new que no había sido tomada antes**.

### Ejemplo Simple

```typescript
function checkAccess(role: string, age: number): boolean {
  if (role === 'admin') {
    // ⚠️ Decisión 1
    return true;
  }
  if (age >= 18) {
    // ⚠️ Decisión 2
    return true;
  }
  return false;
}
```

**Cyclomatic Complexity = 3** (3 rutas independientes)

**Rutas:**

1. role === 'admin' → true ✓
2. role !== 'admin' AND age >= 18 → true ✓
3. role !== 'admin' AND age < 18 → false ✓

**Minimo de tests requeridos: 3**

---

## Cyclomatic Complexity

### Formula

```
CC = E - N + 2P

Donde:
  E = número de aristas (líneas de control de flujo)
  N = número de nodos (componentes, decisiones)
  P = número de componentes conexos (usualmente 1)
```

### Fórmula Simplificada

Para código secuencial con if/else:

```
CC = 1 + (número de puntos de decisión)
```

### Tabla de Referencia

| CC   | Interpretación | Tests Mínimos | Complejidad         |
| ---- | -------------- | ------------- | ------------------- |
| 1    | Código lineal  | 1             | Trivial             |
| 2-3  | Bajo           | 2-3           | Bajo                |
| 4-7  | Moderado       | 4-7           | Aceptable           |
| 8-10 | Complejo       | 8-10          | Difícil de mantener |
| >10  | Muy Complejo   | >10           | 🚨 REFACTOR         |

---

## Análisis de Rutas Independientes

### Paso 1: Mapear Decisiones

```typescript
async login(
  @GetUser() user: User,
  @Body() loginDto: LoginDto,
  @Req() request: Request,
) {
  // ⚠️ Decisión 1: ¿Es CUSTOMER?
  if (user.role && user.role.name === 'customer') {

    // ⚠️ Decisión 2: ¿StoreId en body?
    let storeId = loginDto['storeId'] as number | undefined;
    if (!storeId) {
      storeId = request.headers['x-store-id']
        ? parseInt(request.headers['x-store-id'] as string, 10)
        : undefined;
    }

    // ⚠️ Decisión 3: ¿StoreId válido?
    if (!storeId || isNaN(storeId)) {
      throw new BadRequestException(...);
    }

    // ⚠️ Decisión 4: ¿CustomerId existe?
    if (!user.customerId) {
      throw new BadRequestException('Customer ID is missing');
    }

    // ⚠️ Decisión 5: ¿StoreUser existe?
    const storeUser = storeUsers.find((su) => su.storeId === storeId);
    if (!storeUser) {
      throw new BadRequestException(...);
    }

    return this.authService.generateJWT(user, storeId, storeUser.id);
  }

  // ✓ Ruta alternativa: Usuario STAFF
  return this.authService.generateJWT(user);
}
```

### Paso 2: Contar Decisiones

```
Decisión 1: user.role && user.role.name === 'customer'
  - Tiene 2 condiciones con AND = 2 ramas (truthy/falsy para cada)

Decisión 2: !storeId
  - 1 rama

Decisión 3: !storeId || isNaN(storeId)
  - 2 condiciones, 1 rama (se ejecuta si cualquiera es true)

Decisión 4: !user.customerId
  - 1 rama

Decisión 5: !storeUser
  - 1 rama

Inicial: +1

CC = 1 + 2 + 1 + 2 + 1 + 1 = 8
```

### Paso 3: Listar Rutas Independientes

| #   | Ruta                           | Descripción        | Resultado Esperado     |
| --- | ------------------------------ | ------------------ | ---------------------- |
| 1   | STAFF user                     | role != 'customer' | Generar STAFF token    |
| 2   | CUSTOMER + storeId en body     | Valid              | Generar CUSTOMER token |
| 3   | CUSTOMER + storeId en header   | Valid              | Generar CUSTOMER token |
| 4   | CUSTOMER + sin storeId         | Sin valor          | BadRequest             |
| 5   | CUSTOMER + storeId NaN         | isNaN=true         | BadRequest             |
| 6   | CUSTOMER + sin customerId      | customerId=null    | BadRequest             |
| 7   | CUSTOMER + storeUser no existe | find()=undefined   | BadRequest             |
| 8   | CUSTOMER + todos válidos       | Valid all          | Generar CUSTOMER token |

### Paso 4: Priorizar Rutas

**Críticas** (deben funcionar):

- ✅ Ruta 1: STAFF login
- ✅ Ruta 8: CUSTOMER login completo

**Error handling** (validaciones):

- ✅ Ruta 4: Sin storeId
- ✅ Ruta 5: StoreId inválido
- ✅ Ruta 6: Sin customerId
- ✅ Ruta 7: StoreUser no existe

**Edge cases** (casos especiales):

- ✅ Ruta 2: StoreId en body
- ✅ Ruta 3: StoreId en header

---

## Estructura de Tests en NestJS

### 1. Dependencias Necesarias

```bash
npm install --save-dev @nestjs/testing jest @types/jest ts-jest
```

### 2. Configuración de Jest (jest.config.js)

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

### 3. Estructura Básica de un Test

```typescript
describe('NombreDelComponente', () => {
  // 1️⃣ VARIABLES: Declarar mocks y instancias
  let service: AuthService;
  let authService: AuthService;
  let mockUsersService: any;

  // 2️⃣ SETUP: Configuración antes de cada test
  beforeEach(async () => {
    // Crear mocks
    mockUsersService = {
      findByEmail: jest.fn(),
      // ... otros métodos
    };

    // Crear módulo de testing
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    // Obtener instancia
    service = module.get<AuthService>(AuthService);
  });

  // 3️⃣ CLEANUP: Limpiar después de cada test (opcional)
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 4️⃣ SUITE DE TESTS: Agrupar tests relacionados
  describe('validateUser()', () => {
    it('Ruta 1: Usuario no encontrado', async () => {
      // Arrange: Preparar datos
      const email = 'user@example.com';
      const password = 'password123';
      mockUsersService.findByEmail.mockResolvedValue(null);

      // Act: Ejecutar función bajo test
      const result = await service.validateUser(email, password);

      // Assert: Verificar resultado
      expect(result).toBeNull();
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('Ruta 2: Usuario STAFF válido', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        role: { name: 'admin' },
        email: 'staff@example.com',
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      // ... más setup

      // Act
      const result = await service.validateUser('staff@example.com', 'pass123');

      // Assert
      expect(result).toEqual(mockUser);
    });
  });
});
```

### 4. Sintaxis AAA (Arrange-Act-Assert)

**Arrange**: Preparar datos y mocks

```typescript
const user = { id: 1, email: 'test@example.com' };
mockService.findUser.mockResolvedValue(user);
```

**Act**: Ejecutar la función siendo testeada

```typescript
const result = await controller.login(user, loginDto, request);
```

**Assert**: Verificar que el resultado sea correcto

```typescript
expect(result).toHaveProperty('access_token');
expect(mockService.generateJWT).toHaveBeenCalledWith(user);
```

---

## Estrategia de Mocking

### Qué Mockear

**SÍ mockear** (servicios externos):

```typescript
// ✅ Servicios inyectados
mockAuthService = {
  generateJWT: jest.fn(),
  validateUser: jest.fn(),
};

// ✅ Llamadas a base de datos
mockRepository.findOne.mockResolvedValue(user);

// ✅ Llamadas HTTP
mockHttpClient.get.mockResolvedValue(response);
```

**NO mockear** (componentes siendo testeados):

```typescript
// ❌ No mockes el servicio que estás testeando
// En lugar de eso, pruébalo directamente

// ❌ No mockees lógica simple de transformación
// Pruébalo con datos reales

// ❌ No mockees promesas de forma innecesaria
// Jest maneja promises bien
```

### Configurar Mocks

```typescript
beforeEach(() => {
  // Mock simple
  mockService.method = jest.fn();

  // Mock con valor de retorno
  mockService.method = jest.fn().mockReturnValue(value);

  // Mock con Promise (async)
  mockService.method = jest.fn().mockResolvedValue(user);

  // Mock que lanza error
  mockService.method = jest.fn().mockRejectedValue(new Error('Fail'));

  // Mock con comportamiento complejo
  mockService.method = jest.fn((arg) => {
    if (arg === 'special') {
      return Promise.reject(new Error('Special case'));
    }
    return Promise.resolve(arg);
  });
});
```

### Verificar Llamadas a Mocks

```typescript
// ¿Fue llamado?
expect(mockService.method).toHaveBeenCalled();

// ¿Fue llamado N veces?
expect(mockService.method).toHaveBeenCalledTimes(1);

// ¿Fue llamado con argumentos específicos?
expect(mockService.method).toHaveBeenCalledWith(expectedArg1, expectedArg2);

// ¿Fue llamado con CUALQUIER objeto/valor?
expect(mockService.method).toHaveBeenCalledWith(
  expect.any(Object),
  expect.any(Number)
);

// ¿Fue llamado como primera y última vez?
expect(mockService.method).toHaveBeenFirstCalledWith(...);
expect(mockService.method).toHaveBeenLastCalledWith(...);
```

---

## Patrones de Assertions

### 1. Verificar Valores

```typescript
// Igualdad exacta
expect(result).toBe(5);
expect(result).toEqual(expectedObject);

// Tipos
expect(result).toBeDefined();
expect(result).not.toBeNull();
expect(result).not.toBeUndefined();

// Valores especiales
expect(result).toBeTruthy();
expect(result).toBeFalsy();
expect(result).toBeNaN();
expect(result).toBeInfinite();
```

### 2. Verificar Objetos

```typescript
// Tiene propiedad
expect(result).toHaveProperty('access_token');
expect(result).toHaveProperty('access_token', 'token_value');

// Contiene propiedades
expect(result).toEqual(
  expect.objectContaining({
    access_token: expect.any(String),
    refresh_token: expect.any(String),
  }),
);

// Coincide con estructura
expect(result).toMatchObject({
  statusCode: 200,
  data: expect.any(Object),
});
```

### 3. Verificar Arrays

```typescript
// Longitud
expect(result).toHaveLength(3);

// Contiene elemento
expect(result).toContain(element);

// Existe elemento que coincide
expect(result).toEqual(expect.arrayContaining([element1, element2]));

// Filtrar y verificar
expect(result.filter((x) => x.id === 1)).toHaveLength(1);
```

### 4. Verificar Excepciones

```typescript
// Lanza error
await expect(service.method()).rejects.toThrow();

// Lanza tipo específico de error
await expect(service.method()).rejects.toThrow(BadRequestException);

// Lanza error con mensaje específico
await expect(service.method()).rejects.toThrow('Invalid input');

// Verifica mensaje de error
await expect(service.method()).rejects.toThrow(
  expect.objectContaining({
    message: expect.stringContaining('required'),
  }),
);

// No lanza error
await expect(service.method()).resolves.not.toThrow();
```

### 5. Verificar Strings

```typescript
expect(result).toMatch(/pattern/);
expect(result).toEqual(expect.stringContaining('substring'));
expect(result).toEqual(expect.stringMatching(/^start/));
```

---

## Caso Real: Login Endpoint

### Análisis del Código

El endpoint `login()` en `auth.controller.ts` tiene **CC = 8**.

**8 Rutas Independientes:**

1. ✅ STAFF user → generar STAFF token
2. ✅ CUSTOMER + storeId en body → válido
3. ✅ CUSTOMER + storeId en header → válido
4. ✅ CUSTOMER + sin storeId → BadRequest
5. ✅ CUSTOMER + storeId NaN → BadRequest
6. ✅ CUSTOMER + sin customerId → BadRequest
7. ✅ CUSTOMER + storeUser no existe → BadRequest
8. ✅ CUSTOMER + todo válido → generar CUSTOMER token

### Test Case #1: STAFF User

```typescript
describe('AuthController.login', () => {
  describe('Ruta 1: STAFF user login', () => {
    it('should_login_staff_user', async () => {
      // Arrange: Preparar datos
      const staffUser = {
        id: 1,
        email: 'admin@example.com',
        role: { name: 'admin', id: 1, version: 1 },
        customerId: null, // ← STAFF no tiene cliente
      };

      const mockRequest = { headers: {} } as any;
      const loginDto = {
        email: 'admin@example.com',
        password: 'password123',
      };

      mockAuthService.generateJWT = jest.fn().mockResolvedValue({
        access_token: 'staff_token_123',
        refresh_token: 'refresh_token_123',
      });

      // Act: Ejecutar login
      const result = await controller.login(staffUser, loginDto, mockRequest);

      // Assert: Verificar resultados
      expect(result).toHaveProperty('access_token');
      expect(mockAuthService.generateJWT).toHaveBeenCalledWith(
        staffUser,
        // ← Sin storeId para STAFF
      );
    });
  });
});
```

### Test Case #2: CUSTOMER con StoreId en Body

```typescript
describe('Ruta 2: CUSTOMER login from body', () => {
  it('should_login_customer_with_storeid_in_body', async () => {
    // Arrange
    const customerUser = {
      id: 2,
      email: 'customer@example.com',
      role: { name: 'customer', id: 2, version: 1 },
      customerId: 10, // ← CUSTOMER tiene cliente
    };

    const loginDto = {
      email: 'customer@example.com',
      password: 'password123',
      storeId: 5, // ← StoreId en body
    };

    const mockRequest = { headers: {} } as any;

    const mockStoreUser = { id: 15, storeId: 5, isActive: true };

    mockStoreUsersService.findStoresForCustomer = jest
      .fn()
      .mockResolvedValue([mockStoreUser]);

    mockAuthService.generateJWT = jest.fn().mockResolvedValue({
      access_token: 'customer_token_123',
      refresh_token: 'refresh_token_123',
    });

    // Act
    const result = await controller.login(customerUser, loginDto, mockRequest);

    // Assert
    expect(result).toHaveProperty('access_token');
    expect(mockAuthService.generateJWT).toHaveBeenCalledWith(
      customerUser,
      5, // ← storeId
      15, // ← storeUserId
    );
    expect(mockStoreUsersService.findStoresForCustomer).toHaveBeenCalledWith(
      10,
    );
  });
});
```

### Test Case #4: CUSTOMER sin StoreId

```typescript
describe('Ruta 4: CUSTOMER without storeId', () => {
  it('should_reject_customer_without_storeid', async () => {
    // Arrange
    const customerUser = {
      id: 2,
      email: 'customer@example.com',
      role: { name: 'customer', id: 2, version: 1 },
      customerId: 10,
    };

    const loginDto = {} as any; // ← Sin storeId
    const mockRequest = { headers: {} } as any;

    // Act & Assert
    await expect(
      controller.login(customerUser, loginDto, mockRequest),
    ).rejects.toThrow(BadRequestException);

    // Verificar que NunCA llegó a generar token
    expect(mockAuthService.generateJWT).not.toHaveBeenCalled();
  });
});
```

---

## Best Practices

### ✅ DO's

```typescript
// ✅ Usar nombres descriptivos
it('should_return_token_when_valid_credentials_provided', () => {});

// ✅ Una asserción por concepto
expect(result.status).toBe(200);
expect(result.body).toHaveProperty('data');

// ✅ DRY: Usar beforeEach para setup común
beforeEach(() => {
  mockService.setup();
});

// ✅ Test casos edge (límites)
it('should_handle_empty_string', () => {});
it('should_handle_null_values', () => {});
it('should_handle_very_long_input', () => {});

// ✅ Usar test doubles adecuados
const stub = jest.fn().mockResolvedValue(null); // Sin comportamiento
const mock = jest.fn().mockImplementation((x) => x * 2); // Comportamiento específico
```

### ❌ DON'Ts

```typescript
// ❌ Nombres vagos
it('should work', () => {})
it('test login', () => {})

// ❌ Múltiples comportamientos por test
it('should login and create session and send email', () => {})

// ❌ Lógica en tests
it('test', () => {
  if (someCondition) {
    expect(...).toBe(true);
  }
})

// ❌ Dormir en tests (no es determinista)
await new Promise(r => setTimeout(r, 1000));

// ❌ Test sin assertions
it('should call service', () => {
  service.method();
  // ← Falta expect()
})
```

---

## Cobertura de Tests

### Tipos de Cobertura

| Tipo          | Métrica                    | Objetivo |
| ------------- | -------------------------- | -------- |
| **Line**      | % de líneas ejecutadas     | >80%     |
| **Branch**    | % de decisiones (if/else)  | >80%     |
| **Function**  | % de funciones ejecutadas  | >80%     |
| **Statement** | % de statements ejecutados | >90%     |

### Generar Reporte

```bash
# Ejecutar tests con cobertura
npm test -- --coverage

# Solo archivos específicos
npm test -- auth.service --coverage

# Ver reporte en HTML
npm test -- --coverage && open coverage/index.html
```

### Check Cobertura en CI/CD

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## Resumen

### Checklist para Escribir Buen Tests

- [ ] Identificar todas las decisiones (CC)
- [ ] Crear test para cada ruta independiente
- [ ] Usar Arrange-Act-Assert
- [ ] Mockear dependencias externas
- [ ] Usar nombres descriptivos
- [ ] Probar casos happy path y error
- [ ] Verificar llamadas a mocks
- [ ] Mantener tests DRY (beforeEach)
- [ ] Mantener tests independientes
- [ ] Documentar casos complejos

### Próximos Pasos

1. Abre `auth.service.spec.ts` para ver todos los tests
2. Abre `auth.controller.spec.ts` para ver tests del login endpoint
3. Ejecuta: `npm test -- auth --coverage`
4. Verifica que todos los tests pasen
5. Verifica cobertura >80%

¡Feliz testing! 🧪
