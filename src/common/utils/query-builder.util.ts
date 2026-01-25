import {
  FindOptionsWhere,
  ILike,
  Equal,
  MoreThan,
  LessThan,
  Between,
} from 'typeorm';

export class QueryBuilderUtil {
  /**
   * Construye condiciones de búsqueda para múltiples campos con ILIKE.
   */
  static buildSearchConditions<T>(
    search: string | undefined | null,
    fields: (keyof T)[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (!this.hasValidSearch(search)) {
      return {};
    }

    const searchPattern = this.buildSearchPattern(search);
    const isInteger = /^-?\d+$/.test(search!.trim());

    return fields.map((field) => {
      const fieldName = String(field);

      // Evitar aplicar ILike sobre columnas numéricas (p. ej. id) cuando la búsqueda es un número
      if (isInteger && fieldName === 'id') {
        return {
          [field]: Equal(Number(search!.trim())),
        } as FindOptionsWhere<T>;
      }

      return { [field]: ILike(searchPattern) } as FindOptionsWhere<T>;
    });
  }

  /**
   * Construye condiciones de búsqueda exacta para múltiples campos.
   */
  static buildExactMatchConditions<T>(
    value: string | undefined | null,
    fields: (keyof T)[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (!this.hasValidSearch(value)) {
      return {};
    }

    return fields.map((field) => ({
      [field]: Equal(value.trim()),
    })) as FindOptionsWhere<T>[];
  }

  /**
   * Construye condiciones para búsqueda de rangos numéricos.
   */
  static buildRangeConditions<T>(
    field: keyof T,
    min?: number,
    max?: number,
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (min !== undefined && max !== undefined) {
      return { [field]: Between(min, max) } as FindOptionsWhere<T>;
    }

    if (min !== undefined) {
      return { [field]: MoreThan(min) } as FindOptionsWhere<T>;
    }

    if (max !== undefined) {
      return { [field]: LessThan(max) } as FindOptionsWhere<T>;
    }

    return {};
  }

  /**
   * Verifica si un término de búsqueda es válido (no vacío).
   * @private
   */
  private static hasValidSearch(search?: string | null): search is string {
    return !!search?.trim();
  }

  /**
   * Construye el patrón de búsqueda con wildcards.
   * @private
   */
  private static buildSearchPattern(search: string): string {
    return `%${search.trim()}%`;
  }
}
