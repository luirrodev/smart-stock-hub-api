import MyDataSourse from '../database/data-source';
import { Brand } from '../products/entities/brand.entity';
import { Category } from '../products/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../products/entities/warehouse.entity';
import { User } from '../users/entities/user.entity';

async function seedProducts() {
  await MyDataSourse.initialize();

  // Crear marcas
  const brandsData = [
    { name: 'Brand A', image: 'https://dummyimage.com/brandA.png' },
    { name: 'Brand B', image: 'https://dummyimage.com/brandB.png' },
  ];
  const brands: Brand[] = [];
  for (const data of brandsData) {
    let brand = await MyDataSourse.getRepository(Brand).findOneBy({
      name: data.name,
    });
    if (!brand) {
      brand = await MyDataSourse.getRepository(Brand).save(data);
    }
    brands.push(brand);
  }

  // Crear categorías
  const categoriesData = [{ name: 'Category X' }, { name: 'Category Y' }];
  const categories: Category[] = [];
  for (const data of categoriesData) {
    let category = await MyDataSourse.getRepository(Category).findOneBy({
      name: data.name,
    });
    if (!category) {
      category = await MyDataSourse.getRepository(Category).save(data);
    }
    categories.push(category);
  }

  // Buscar un usuario existente para manager de almacén
  const manager = await MyDataSourse.getRepository(User).findOne({ where: {} });

  // Crear almacenes solo si hay manager
  const warehouses: Warehouse[] = [];
  if (manager) {
    const warehousesData = [
      {
        name: 'Warehouse 1',
        address: 'Calle 123',
        code: 'ALMACEN-Warehouse 1-TEST',
        manager: manager,
        active: true,
      },
      {
        name: 'Warehouse 2',
        address: 'Avenida 456',
        code: 'ALMACEN-Warehouse 2-TEST',
        manager: manager,
        active: true,
      },
    ];
    for (const data of warehousesData) {
      let warehouse = await MyDataSourse.getRepository(Warehouse).findOneBy({
        name: data.name,
      });
      if (!warehouse) {
        warehouse = await MyDataSourse.getRepository(Warehouse).save(data);
      }
      warehouses.push(warehouse);
    }
  } else {
    console.warn('No hay usuario manager para asignar a los almacenes.');
  }

  // Crear productos
  const productsData = [
    {
      name: 'Product 1',
      description: 'Descripción del producto 1',
      salePrice: 100,
      stock: 50,
      image: 'https://dummyimage.com/product1.png',
      sku: 'PROD-1-TEST',
      barcode: '1234567890',
      status: 'active' as 'active',
      purchasePrice: 80,
      notes: 'Nota 1',
      brand: brands[0],
      categories: [categories[0]],
    },
    {
      name: 'Product 2',
      description: 'Descripción del producto 2',
      salePrice: 200,
      stock: 30,
      image: 'https://dummyimage.com/product2.png',
      sku: 'PROD-2-TEST',
      barcode: '0987654321',
      status: 'active' as 'active',
      purchasePrice: 150,
      notes: 'Nota 2',
      brand: brands[1],
      categories: [categories[1]],
    },
  ];
  for (const data of productsData) {
    let product = await MyDataSourse.getRepository(Product).findOneBy({
      name: data.name,
    });
    if (!product) {
      product = await MyDataSourse.getRepository(Product).save(data);
    }
  }

  console.log('Seed de productos, marcas, categorías y almacenes completado');
  await MyDataSourse.destroy();
}

seedProducts().catch((e) => {
  console.error(e);
  process.exit(1);
});
