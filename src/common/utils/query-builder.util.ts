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

    const conditions: FindOptionsWhere<T>[] = [];

    for (const field of fields) {
      const fieldName = String(field);

      // Si es el campo `id` y la búsqueda es numérica, hacemos match exacto.
      // Si la búsqueda no es numérica, omitimos `id` porque es una columna integer.
      if (fieldName === 'id') {
        if (isInteger) {
          conditions.push({
            [field]: Equal(Number(search!.trim())),
          } as FindOptionsWhere<T>);
        }
        continue;
      }

      conditions.push({ [field]: ILike(searchPattern) } as FindOptionsWhere<T>);
    }

    return conditions.length
      ? (conditions as FindOptionsWhere<T>[])
      : ({} as FindOptionsWhere<T>);
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
