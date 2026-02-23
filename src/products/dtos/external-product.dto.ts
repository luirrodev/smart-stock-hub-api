export interface ExternalProductDto {
  // Campos básicos
  xarticulo_id: number;
  xarticulo?: string; // nombre principal
  xarticulo_rev?: string; // nombre alternativo para tienda rev

  // Campos de usuario y fechas
  xuseralta_id?: number;
  xusermodif_id?: number;
  xdatealta?: string | Date;
  xdatemodif?: string | Date;

  // Campos de estado activo/eliminado
  xactivo?: string; // 'S'/'N'
  xeliminado?: number; // 0/1
  xarchivado?: string; // 'S'/'N'

  // Campos de precios principales
  xprecio?: number; // precio de venta
  xcoste?: number; // precio de costo
  xrecargas?: string; // información de recargas
  xprecio_fijo_cup?: number; // precio fijo en CUP

  // Campos de precios por tienda (rev)
  xprecio1_rev?: number;
  xprecio2_rev?: number;
  xprecio3_rev?: number;
  xprecio4_rev?: number;
  xactivo_venta_rev?: string; // 'S'/'N'

  // Campos de precios por tienda (mr)
  xprecio_mr?: number;
  xprecio_old_mr?: number;
  xactivo_web_mr?: string; // 'S'/'N'
  xactivo_venta_mr?: string; // 'S'/'N'
  xurl_amigable_mr?: string;
  xarticulo_mr?: string;
  xorden_mr?: number;
  xdestacado_mr?: string; // 'S'/'N'
  ximage_alt_mr?: string;
  xobs_mr?: string;
  xresumen_mr?: string;

  // Campos de precios por tienda (sd)
  xprecio_sd?: number;
  xprecio_old_sd?: number;
  xactivo_web_sd?: string; // 'S'/'N'
  xactivo_venta_sd?: string; // 'S'/'N'
  xurl_amigable_sd?: string;
  xarticulo_sd?: string;
  xorden_sd?: number;
  xdestacado_sd?: string; // 'S'/'N'
  ximage_alt_sd?: string;
  xobs_sd?: string;
  xresumen_sd?: string;

  // Campos de precios por tienda (an)
  xprecio_an?: number;
  xprecio_old_an?: number;
  xactivo_web_an?: string; // 'S'/'N'
  xactivo_venta_an?: string; // 'S'/'N'
  xurl_amigable_an?: string;
  xarticulo_an?: string;
  xorden_an?: number;
  xdestacado_an?: string; // 'S'/'N'
  ximage_alt_an?: string;
  xobs_an?: string;
  xresumen_an?: string;

  // Campos de presentación y contenido
  xresumen?: string; // HTML - descripción corta
  xobs?: string; // HTML - observaciones/descripción larga
  xinfadd_title?: string; // título de información adicional
  xinfadd_content?: string; // contenido adicional
  xinfadd_activo?: string; // 'S'/'N' - información adicional activa
  xpage_title?: string; // título alterno para página SEO
  xpage_description?: string; // descripción para SEO
  xkeywords?: string; // palabras clave para SEO
  ximage_alt?: string; // texto alternativo para imágenes

  // Campos de relaciones
  xproveedor_id?: number;
  xalmacen_id?: number;
  xrepartidor_id?: number;
  xcategoria_id?: number;
  xcategoria?: string;

  // Campos de flags/estados especiales
  xpreventa?: string; // 'S'/'N'
  xservicio?: string; // 'S'/'N'
  xrecarga?: string; // 'S'/'N'
  xpicking?: string; // 'S'/'N'
  xreposicion?: string; // 'S'/'N' - reposición automática

  // Campos web y visibilidad
  xactivo_web?: string; // 'S'/'N'
  xactivo_venta?: string; // 'S'/'N'
  xurl_amigable?: string; // URL amigable
  xorden?: number; // orden de aparición
  xdestacado?: string; // 'S'/'N' - producto destacado

  // Campos de información técnica
  xhash?: string; // hash para validación
  xfactor?: number; // factor multiplicativo
  xaduana?: string; // información aduanal
  xnota_stock?: string; // nota sobre stock
  xcantidad_maxima?: number; // cantidad máxima a comprar

  // Campos de logística y reparto
  xarticulo_pro?: string; // nombre para repartidor
  xcoste_reparto_cup?: number; // costo de reparto en CUP
  xcoste_cup?: number; // costo en CUP
  xeditable_coste_cup?: string; // 'S'/'N' - costo editable
  xseguro?: number; // costo de seguro
  xpeso?: number; // peso del producto

  // Campos de Marketing e IA
  xcategory_fb?: number; // categoría Facebook
  xia_activo?: number; // 0/1 - IA activo
  xia_product_image_url?: string;
  xia_promo?: number; // 0/1 - promoción IA
  xia_promo_image_url?: string;
  xia_warranty?: string; // garantía
  xia_notes?: string; // notas IA
  xia_daily_publication?: number; // 0/1 - publicación diaria
  xia_promo_description?: string; // descripción de promoción
  xia_publish_social?: number | null; // 0/1/null - publicar en redes
  xia_prioridad?: number; // prioridad IA

  // Campos de permisos
  xpermiso_agencias?: string; // permisos para agencias
}
