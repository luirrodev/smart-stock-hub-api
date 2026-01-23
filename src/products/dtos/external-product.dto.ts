export interface ExternalProductDto {
  xarticulo_id: number;
  xreferencia?: string;
  xarticulo?: string; // nombre
  xreposicion?: string; // 'N'/'S'
  xprecio_coste?: number;
  xprecio_venta?: number;
  xarticulo_rev?: string; // nombre alternativo
  xalmacen_id?: number;
  xresumen?: string; // HTML
  xobs?: string; // HTML
  xstock?: number;
  xcategoria_id?: number;
  xcategoria?: string;
}
