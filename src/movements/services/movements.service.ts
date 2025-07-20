import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { MovementDetail } from '../entities/movement-detail.entity';
import { MovementApproval } from '../entities/movement-approval.entity';
import { MovementType } from '../entities/movement-type.entity';
import {
  CreateMovementDto,
  CreateMovementDetailDto,
} from '../dtos/create-movement.dto';
import { MovementStatus } from '../entities/inventory-movement.entity';
import { StockEffect } from '../entities/movement-type.entity';
import { CreateMovementTypeDto } from '../dtos/create-movement-type.dto';
import { MovementTypesService } from './movement-types.service';
import { WarehousesService } from 'src/products/services/warehouses.service';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementRepository: Repository<InventoryMovement>,
    @InjectRepository(MovementApproval)
    private readonly movementApprovalRepository: Repository<MovementApproval>,
    @InjectRepository(MovementDetail)
    private readonly movementDetailRepo: Repository<MovementDetail>,

    private readonly movementsTypeService: MovementTypesService,
    private readonly warehouseService: WarehousesService,
    private readonly userService: UsersService,
  ) {}

  // Aquí irán los métodos para:
  // - Crear movimiento (con reserva de stock si aplica)
  // - Aprobar movimiento
  // - Procesar movimiento
  // - Cancelar movimiento
  // - Consultar movimientos

  async createMovement(data: CreateMovementDto) {
    const newMovement = this.inventoryMovementRepository.create(data);

    // Obtener el tipo de movimiento
    newMovement.movementType = await this.movementsTypeService.findOne(
      data.movementTypeId,
    );

    // Obtener el usuario que hace el movimiento
    newMovement.user = await this.userService.findOne(data.userId);

    // Obtener el usuario que tiene que aprovar el movimiento
    newMovement.approvalUser = await this.userService.findOne(
      data.approvalUserId,
    );

    // Obtener el almacen de origen (si viene en data)
    if (data.originWarehouseId) {
      const originWarehouse = await this.warehouseService.findOne(
        data.originWarehouseId,
      );
      newMovement.originWarehouse = originWarehouse;
    }
    // Obtener el almacen de destino (si viene en data)
    if (data.destinationWarehouseId) {
      const destinationWarehouse = await this.warehouseService.findOne(
        data.destinationWarehouseId,
      );
      newMovement.destinationWarehouse = destinationWarehouse;
    }
    // Establecer el estado ("pending" por defecto)
    newMovement.status = newMovement.movementType
      ? MovementStatus.PENDING
      : MovementStatus.PROCESSED;

    newMovement.totalItems = data.details.length;
    newMovement.totalValue = data.details.reduce(
      (sum, d) => sum + d.purchasePrice * d.quantity,
      0,
    );

    const savedMovement =
      await this.inventoryMovementRepository.save(newMovement);

    // 3. Crear los detalles
    for (const detail of data.details) {
      const movementDetail = this.movementDetailRepo.create({
        movementId: savedMovement.id,
        productId: detail.productId,
        quantity: detail.quantity,
        purchasePrice: detail.purchasePrice,
        salePrice: detail.salePrice,
      });
      await this.movementDetailRepo.save(movementDetail);
    }

    // 4. Si requiere aprobación, reservar stock (lógica a implementar)
    if (savedMovement.movementType.requiresApproval) {
      // await this.reserveStock(savedMovement);
    } else {
      // 5. Si no requiere aprobación, procesar el movimiento (actualizar stock)
      // Ejemplo: await this.processMovement(savedMovement.id);
    }

    // // 6. Retornar el movimiento creado (puedes incluir detalles si lo deseas)
    // return savedMovement;
  }
}
