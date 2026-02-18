import { Request } from 'express';
import { Store } from 'src/stores/entities/store.entity';
import { StoreUser } from 'src/access-control/users/entities/store-user.entity';

/**
 * Extiende Express.Request con atributos custom agregados por guards e interceptores
 *
 * - store: Agregado por CustomApiKeyGuard (siempre presente si el guard pasó)
 * - storeUser: Agregado por LocalStrategy.validate() para clientes autenticados
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Store extraída del header X-API-Key por CustomApiKeyGuard
       * SIEMPRE present si CustomApiKeyGuard pasó
       */
      store?: Store;

      /**
       * StoreUser del cliente autenticado (CUSTOMER)
       * Solo present si el usuario es CUSTOMER autenticado
       */
      storeUser?: StoreUser | null;
    }
  }
}
