import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthController } from './auth-v1.controller';
import { AuthService } from '../services/auth.service';
import { StoreUsersService } from 'src/access-control/users/services/store-users.service';
import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';
import {
  createMockStaffUser,
  createMockCustomerUser,
  createMockUser,
} from '../__mocks__/user.factory';

/**
 * UNIT TESTS para AuthController
 *
 * Usando Basic Path Testing - Login Endpoint Analysis:
 *
 * Cyclomatic Complexity = 8
 * Decision Points:
 *   1. user.role && user.role.name === 'customer' (2 conditions)
 *   2. !storeId (1)
 *   3. !storeId || isNaN(storeId) (2 conditions with OR)
 *   4. !user.customerId (1)
 *   5. !storeUser (1)
 *
 * Total CC = 1 + 2 + 1 + 2 + 1 + 1 = 8
 *
 * Las 8 rutas independientes están documentadas en su correspondiente test case
 */

describe('AuthController', () => {
  let controller: AuthController;

  // Mocks
  let mockAuthService: any;
  let mockStoreUsersService: any;

  beforeEach(async () => {
    // ============================================
    // SETUP MOCKS
    // ============================================

    mockAuthService = {
      generateJWT: jest.fn(),
      validateUser: jest.fn(),
      validateStaffLogin: jest.fn(),
      validateCustomerLogin: jest.fn(),
      register: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      getProfile: jest.fn(),
      googleLogin: jest.fn(),
    };

    mockStoreUsersService = {
      findStoresForCustomer: jest.fn(),
      findByStoreAndEmail: jest.fn(),
      verifyPassword: jest.fn(),
    };

    // ============================================
    // CREATE MODULE
    // ============================================

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: StoreUsersService, useValue: mockStoreUsersService },
        {
          provide: ThrottlerGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
        {
          provide: CustomApiKeyGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(CustomApiKeyGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  // ===============================================
  // TESTS: login() endpoint
  // CC = 8 independent paths
  // ===============================================

  describe('login()', () => {
    // ----- RUTA 1: STAFF User Login -----
    // Decisión 1 (FALSE): user.role.name !== 'customer'
    // Expected: Generar STAFF token sin storeId
    // Importancia: ✅ CRÍTICO - El flujo principal de STAFF

    it('RUTA 1: debe_loguear_staff_user_exitosamente', async () => {
      // Arrange
      const staffUser = createMockStaffUser({
        id: 1,
        email: 'admin@example.com',
      });

      const loginDto = {
        email: 'admin@example.com',
        password: 'password123',
        storeId: undefined, // ← Sin storeId
      };

      // All validation happens in LocalStrategy now
      // Mock request with store (populated by CustomApiKeyGuard)
      const mockRequest: Partial<Request> = {
        headers: {},
        store: { id: 1, name: 'Main Store' },
      } as any;

      mockAuthService.generateJWT.mockResolvedValue({
        access_token: 'staff_access_token_12345',
        refresh_token: 'staff_refresh_token_67890',
      });

      // Act
      const result = await controller.login(
        staffUser,
        loginDto,
        mockRequest as Request,
      );

      // Assert
      expect(result).toEqual({
        access_token: 'staff_access_token_12345',
        refresh_token: 'staff_refresh_token_67890',
      });

      // Verificar que generateJWT fue llamado SIN storeId para STAFF
      expect(mockAuthService.generateJWT).toHaveBeenCalledWith(staffUser);
      expect(mockAuthService.generateJWT).toHaveBeenCalledTimes(1);

      // No validation should be called in controller (happens in LocalStrategy)
      expect(mockAuthService.validateStaffLogin).not.toHaveBeenCalled();
      expect(mockAuthService.validateCustomerLogin).not.toHaveBeenCalled();
    });

    // ----- RUTA 2: CUSTOMER + StoreId en Body -----
    // Decisión 1 (TRUE): user.role.name === 'customer'
    // Decisión 2 (FALSE): storeId en loginDto
    // Expected: Validar store acceso y generar CUSTOMER token
    // Importancia: ✅ CRÍTICO - CUSTOMER queriendo loguear con storeId explícito

    it('RUTA 2: debe_loguear_customer_con_storeid_en_body', async () => {
      // Arrange
      const customerUser = createMockCustomerUser({
        id: 2,
        email: 'customer@example.com',
      });

      const loginDto = {
        email: 'customer@example.com',
        password: 'password123',
        storeId: 5, // ← StoreId explícitamente en body
      };

      const mockStoreUser = {
        id: 15,
        storeId: 5,
        customerId: 10,
        isActive: true,
      };

      // All validation happens in LocalStrategy now
      // Mock request with store and storeUser (populated by CustomApiKeyGuard + LocalStrategy)
      const mockRequest: Partial<Request> = {
        headers: {},
        store: { id: 5, name: 'Store 5' },
        storeUser: mockStoreUser,
      } as any;

      mockAuthService.generateJWT.mockResolvedValue({
        access_token: 'customer_access_token_12345',
        refresh_token: 'customer_refresh_token_67890',
      });

      // Act
      const result = await controller.login(
        customerUser,
        loginDto,
        mockRequest as Request,
      );

      // Assert
      expect(result).toEqual({
        access_token: 'customer_access_token_12345',
        refresh_token: 'customer_refresh_token_67890',
      });

      // Verificar generateJWT llamado CON storeId y storeUserId
      expect(mockAuthService.generateJWT).toHaveBeenCalledWith(
        customerUser,
        5, // storeId
        15, // storeUserId
      );

      // No validation should be called in controller (happens in LocalStrategy)
      expect(mockAuthService.validateCustomerLogin).not.toHaveBeenCalled();
      expect(mockAuthService.validateStaffLogin).not.toHaveBeenCalled();
    });

    // ----- RUTA 3: CUSTOMER + StoreId en Header (X-Store-ID) -----
    // Decisión 1 (TRUE): user.role.name === 'customer'
    // Decisión 2 (TRUE): !storeId en body, pero presente en header
    // Expected: Parsear header y generar CUSTOMER token
    // Importancia: ⭐ EDGE CASE - Cliente alternativo sin body

    it('RUTA 3: debe_loguear_customer_con_storeid_del_header', async () => {
      // Arrange
      const customerUser = createMockCustomerUser({
        id: 2,
        email: 'customer@example.com',
      });

      const loginDto = {
        email: 'customer@example.com',
        password: 'password123',
        // ← SIN storeId en body
      };

      const mockRequest: Partial<Request> = {
        headers: {
          'x-store-id': '7', // ← StoreId en header
        },
      };

      const mockStoreUser = {
        id: 20,
        storeId: 7,
        customerId: 10,
        isActive: true,
      };

      mockAuthService.validateCustomerLogin.mockResolvedValue({
        user: customerUser,
        storeUser: mockStoreUser,
      });

      mockAuthService.generateJWT.mockResolvedValue({
        access_token: 'token_from_header',
        refresh_token: 'refresh_from_header',
      });

      // Act
      const result = await controller.login(
        customerUser,
        loginDto,
        mockRequest as Request,
      );

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(mockAuthService.validateCustomerLogin).toHaveBeenCalledWith(
        customerUser,
        'password123',
        7, // Parsed from request.store or header
      );
      expect(mockAuthService.generateJWT).toHaveBeenCalledWith(
        customerUser,
        7, // ← Parsed from header/request
        20,
      );
    });

    // ----- RUTA 4: CUSTOMER + Sin StoreId Anywhere -----
    // Decisión 1 (TRUE): user.role.name === 'customer'
    // Decisión 2 (TRUE): !storeId en body
    // Decisión 3 (FALSE): header no tiene x-store-id tampoco
    // Expected: BadRequest - storeId requerido
    // Importancia: ✅ CRÍTICO - Validación de entrada

    it('RUTA 4: debe_rechazar_customer_sin_storeid', async () => {
      // Arrange
      const customerUser = createMockCustomerUser({
        id: 2,
        email: 'customer@example.com',
      });

      const loginDto = {
        email: 'customer@example.com',
        password: 'password123',
        // ← NO storeId
      };

      const mockRequest: Partial<Request> = {
        headers: {
          // ← NO x-store-id header
        },
      };

      mockAuthService.validateCustomerLogin.mockRejectedValue(
        new BadRequestException('storeId is required'),
      );

      // Act & Assert
      await expect(
        controller.login(customerUser, loginDto, mockRequest as Request),
      ).rejects.toThrow(BadRequestException);

      expect(mockAuthService.generateJWT).not.toHaveBeenCalled();
    });

    // ----- RUTA 5: CUSTOMER + StoreId NaN (No es número) -----
    // Decisión 1 (TRUE): user.role.name === 'customer'
    // Decisión 2 (FALSE o TRUE): storeId existe pero
    // Decisión 3 (TRUE): isNaN(storeId) === true
    // Expected: BadRequest - storeId debe ser número válido
    // Importancia: ⭐ EDGE CASE - Validación de tipo

    it('RUTA 5: debe_rechazar_customer_con_storeid_invalido_nan', async () => {
      // Arrange
      const customerUser = createMockCustomerUser({
        id: 2,
        email: 'customer@example.com',
      });

      const loginDto = {
        email: 'customer@example.com',
        password: 'password123',
        storeId: 'invalid_not_a_number', // ← String no numérico
      };

      const mockRequest: Partial<Request> = { headers: {} };

      mockAuthService.validateCustomerLogin.mockRejectedValue(
        new BadRequestException('Invalid storeId'),
      );

      // Act & Assert
      await expect(
        controller.login(customerUser, loginDto, mockRequest as Request),
      ).rejects.toThrow(BadRequestException);

      expect(mockAuthService.generateJWT).not.toHaveBeenCalled();
    });

    // ----- RUTA 6: CUSTOMER + Sin CustomerId -----
    // Decisión 1 (TRUE): user.role.name === 'customer'
    // Decisión 3 (FALSE): storeId es válido (pass validation)
    // Decisión 4 (TRUE): !user.customerId === true
    // Expected: BadRequest - customerId faltante
    // Importancia: ✅ CRÍTICO - Integridad de datos

    it('RUTA 6: debe_rechazar_customer_sin_customerid', async () => {
      // Arrange
      const customerUser = createMockCustomerUser({
        id: 2,
        email: 'customer@example.com',
        customerId: null,
      });

      const loginDto = {
        email: 'customer@example.com',
        password: 'password123',
        storeId: 5,
      };

      const mockRequest: Partial<Request> = { headers: {} };

      mockAuthService.validateCustomerLogin.mockRejectedValue(
        new BadRequestException('Customer ID is missing from user record'),
      );

      // Act & Assert
      await expect(
        controller.login(customerUser, loginDto, mockRequest as Request),
      ).rejects.toThrow(BadRequestException);

      expect(mockAuthService.generateJWT).not.toHaveBeenCalled();
    });

    // ----- RUTA 7: CUSTOMER + StoreUser No Registrado -----
    // Decisión 1 (TRUE): user.role.name === 'customer'
    // Decisión 3 (FALSE): storeId es válido
    // Decisión 4 (FALSE): customerId existe
    // Decisión 5 (TRUE): storeUser no encontrado en array
    // Expected: BadRequest - cliente no registrado en esta tienda
    // Importancia: ✅ CRÍTICO - Control de acceso

    it('RUTA 7: debe_rechazar_customer_no_registrado_en_store', async () => {
      // Arrange
      const customerUser = createMockCustomerUser({
        id: 2,
        email: 'customer@example.com',
      });

      const loginDto = {
        email: 'customer@example.com',
        password: 'password123',
        storeId: 999, // ← Tienda donde NO está registrado
      };

      const mockRequest: Partial<Request> = { headers: {} };

      mockAuthService.validateCustomerLogin.mockRejectedValue(
        new BadRequestException('Customer is not registered for store 999'),
      );

      // Act & Assert
      await expect(
        controller.login(customerUser, loginDto, mockRequest as Request),
      ).rejects.toThrow(BadRequestException);

      expect(mockAuthService.generateJWT).not.toHaveBeenCalled();
    });

    // ----- RUTA 8: CUSTOMER + Todos los Validaciones Pasan -----
    // Decisión 1 (TRUE): user.role.name === 'customer'
    // Decisión 2 (FALSE o TRUE): storeId presente
    // Decisión 3 (FALSE): storeId es válido
    // Decisión 4 (FALSE): customerId existe
    // Decisión 5 (FALSE): storeUser encontrado
    // Expected: Generar CUSTOMER token con store context
    // Importancia: ✅ CRÍTICO - Happy path completo, todas las validaciones

    it('RUTA 8: debe_loguear_customer_cuando_todas_validaciones_pasan', async () => {
      // Arrange
      const customerUser = createMockCustomerUser({
        id: 2,
        email: 'customer@example.com',
      });

      const loginDto = {
        email: 'customer@example.com',
        password: 'password123',
        storeId: 5,
      };

      const mockRequest: Partial<Request> = { headers: {} };

      const mockStoreUser = {
        id: 15,
        storeId: 5,
        customerId: 10,
        isActive: true,
      };

      mockAuthService.validateCustomerLogin.mockResolvedValue({
        user: customerUser,
        storeUser: mockStoreUser,
      });

      mockAuthService.generateJWT.mockResolvedValue({
        access_token: 'customer_complete_token',
        refresh_token: 'customer_complete_refresh',
      });

      // Act
      const result = await controller.login(
        customerUser,
        loginDto,
        mockRequest as Request,
      );

      // Assert
      expect(result).toEqual({
        access_token: 'customer_complete_token',
        refresh_token: 'customer_complete_refresh',
      });

      // Verificar que validateCustomerLogin fue llamado correctamente
      expect(mockAuthService.validateCustomerLogin).toHaveBeenCalledWith(
        customerUser,
        'password123',
        5,
      );

      // Verificar que generateJWT fue llamado con los parámetros correctos
      expect(mockAuthService.generateJWT).toHaveBeenCalledWith(
        customerUser,
        5,
        15,
      );
    });
  });

  // ===============================================
  // TESTS: register() endpoint
  // CC = 2 (simpler than login)
  // ===============================================

  describe('register()', () => {
    it('debe_registrar_nuevo_customer', async () => {
      // Arrange
      const registerDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockRequest: Partial<Request> = {
        headers: {
          'x-api-key': 'test-api-key',
        },
      } as any;
      (mockRequest as any).store = { id: 1 };

      mockAuthService.register.mockResolvedValue({
        access_token: 'new_customer_access_token',
        refresh_token: 'new_customer_refresh_token',
      });

      // Act
      const result = await controller.register(
        registerDto,
        mockRequest as Request,
      );

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto, 1);
    });

    it('debe_manejar_conflicto_email_duplicado', async () => {
      // Arrange
      const registerDto = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      const mockRequest: Partial<Request> = {
        headers: {
          'x-api-key': 'test-api-key',
        },
      } as any;
      (mockRequest as any).store = { id: 1 };

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Email already in use'),
      );

      // Act & Assert
      await expect(
        controller.register(registerDto, mockRequest as Request),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ===============================================
  // TESTS: forgotPassword() endpoint
  // ===============================================

  describe('forgotPassword()', () => {
    it('debe_manejar_solicitud_reset_password', async () => {
      // Arrange
      const forgotPasswordDto = {
        email: 'user@example.com',
      };

      const mockRequest: Partial<Request> = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      };

      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      // Act
      const result = await controller.forgotPassword(
        forgotPasswordDto,
        mockRequest as Request,
      );

      // Assert
      expect(result).toEqual({
        message:
          'Si existe una cuenta con ese correo, se enviarán instrucciones para restablecer la contraseña.',
      });

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        'user@example.com',
        '127.0.0.1',
        'Mozilla/5.0',
      );
    });
  });

  // ===============================================
  // TESTS: resetPassword() endpoint
  // ===============================================

  describe('resetPassword()', () => {
    it('debe_resetear_password_con_token_valido', async () => {
      // Arrange
      const resetPasswordDto = {
        token: 'valid_reset_token',
        newPassword: 'newPassword123',
      };

      const mockRequest: Partial<Request> = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      };

      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Contraseña actualizada correctamente',
      });

      // Act
      const result = await controller.resetPassword(
        resetPasswordDto,
        mockRequest as Request,
      );

      // Assert
      expect(result).toEqual({
        message: 'Contraseña actualizada correctamente',
      });

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        'valid_reset_token',
        'newPassword123',
        '127.0.0.1',
        'Mozilla/5.0',
      );
    });
  });

  // ===============================================
  // TESTS: getProfile() endpoint
  // ===============================================

  describe('getProfile()', () => {
    it('debe_retornar_perfil_usuario', async () => {
      // Arrange
      const userPayload = {
        sub: 1,
        role: 'admin',
      };

      mockAuthService.getProfile.mockResolvedValue({
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['create_user', 'edit_user', 'delete_user'],
      });

      // Act
      const result = await controller.getProfile(userPayload as any);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('permissions');
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(userPayload);
    });
  });
});
