import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../../../infrastructure/db/mysql.connection.js";
import { ConflictError, NotFoundError } from "../../../shared/errors.js";

const ID_CATEGORIA_DEFAULT = 1;

export type CreateProductoInput = {
  nombre: string;
  descripcion?: string;
  codigo_barras: string;
  id_proveedor_principal?: number | null;
  id_unidad: number;
  precio_compra: number;
  porcentaje_ganancia?: number;
  precio_venta?: number;
};

export type CreateProductoResult = {
  id_producto: number;
  id_precio: number;
};

export type UpdateProductoInput = {
  id_producto: number;
  nombre: string;
  codigo_barras: string;
  sku: string;
  precio?: {
    id_unidad: number;
    precio_compra: number;
    porcentaje_ganancia?: number;
    precio_venta?: number;
  };
};

export type ProductoSummary = RowDataPacket & {
  id_producto: number;
  nombre: string;
  codigo_barras: string;
  sku: string;
  precio_compra: number;
  porcentaje_ganancia: number | null;
  precio_venta: number | null;
  maxId: number;
  id_unidad: number;
  tipo_unidad: string;
  abreviatura: string;
};

type ProductoBusquedaRow = RowDataPacket & {
  id_producto: number;
  nombre: string;
  codigo_barras: string;
  sku: string;
  id_categoria: number;
  fecha_alta: Date;
  id_precio: number;
  id_unidad: number;
  precio_compra: number;
  porcentaje_ganancia: number | null;
  precio_venta: number | null;
  precio_fecha_inicio: Date;
  precio_fecha_fin: Date | null;
  unidad_nombre: string;
  unidad_abreviatura: string;
};

export type ProductoBuscado = {
  id_producto: number;
  nombre: string;
  codigo_barras: string;
  sku: string;
  id_categoria: number;
  fecha_alta: Date;
  precio: {
    id_precio: number;
    id_unidad: number;
    precio_compra: number;
    porcentaje_ganancia: number | null;
    precio_venta: number | null;
    fecha_inicio: Date;
    fecha_fin: Date | null;
    unidad: {
      nombre: string;
      abreviatura: string;
    };
  };
};

export type PaginationInput = {
  page: number;
  limit: number;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
};

const PRODUCTO_SUMMARY_BASE_QUERY = `
  SELECT
    p.id_producto,
    p.nombre,
    p.codigo_barras,
    p.sku,
    pp.precio_compra,
    pp.porcentaje_ganancia,
    pp.precio_venta,
    tmp.maxId,
    pp.id_unidad,
    um.nombre AS tipo_unidad,
    um.abreviatura
  FROM
    productos AS p
    INNER JOIN (
      SELECT DISTINCT
        id_producto,
        MAX(id_precio) AS maxId
      FROM
        precios_producto
      GROUP BY
        id_producto
    ) AS tmp ON p.id_producto = tmp.id_producto
    INNER JOIN precios_producto AS pp ON tmp.maxId = pp.id_precio
    INNER JOIN unidades_medida um ON pp.id_unidad = um.id_unidad
`;

export class ProductosService {
  async getAll(
    pagination: PaginationInput,
  ): Promise<PaginatedResult<ProductoSummary>> {
    const [productos] = await db.execute<ProductoSummary[]>(
      PRODUCTO_SUMMARY_BASE_QUERY,
    );

    const { page, limit } = pagination;
    const total = productos.length;
    const offset = (page - 1) * limit;
    const data = productos.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };
  }

  async search(producto: string): Promise<ProductoBuscado[]> {
    const [rows] = await db.execute<ProductoBusquedaRow[]>(
      `WITH precios_vigentes AS (
        SELECT
          pp.*,
          ROW_NUMBER() OVER (
            PARTITION BY pp.id_producto
            ORDER BY pp.fecha_inicio DESC, pp.id_precio DESC
          ) AS posicion
        FROM precios_producto AS pp
        WHERE pp.activo = 1
          AND pp.fecha_inicio <= CURDATE()
          AND (pp.fecha_fin IS NULL OR pp.fecha_fin >= CURDATE())
      )
      SELECT
        p.id_producto,
        p.nombre,
        p.codigo_barras,
        p.sku,
        p.id_categoria,
        p.fecha_alta,
        pv.id_precio,
        pv.id_unidad,
        pv.precio_compra,
        pv.porcentaje_ganancia,
        pv.precio_venta,
        pv.fecha_inicio AS precio_fecha_inicio,
        pv.fecha_fin AS precio_fecha_fin,
        um.nombre AS unidad_nombre,
        um.abreviatura AS unidad_abreviatura
      FROM productos AS p
      INNER JOIN precios_vigentes AS pv
        ON pv.id_producto = p.id_producto
       AND pv.posicion = 1
      INNER JOIN unidades_medida AS um ON um.id_unidad = pv.id_unidad
      WHERE p.nombre LIKE CONCAT('%', ?, '%')
         OR p.codigo_barras LIKE CONCAT('%', ?, '%')
      ORDER BY
        CASE
          WHEN p.codigo_barras = ? THEN 0
          WHEN p.nombre = ? THEN 1
          WHEN p.nombre LIKE CONCAT(?, '%') THEN 2
          ELSE 3
        END,
        p.nombre ASC`,
      [producto, producto, producto, producto, producto],
    );

    return rows.map((row) => ({
      id_producto: row.id_producto,
      nombre: row.nombre,
      codigo_barras: row.codigo_barras,
      sku: row.sku,
      id_categoria: row.id_categoria,
      fecha_alta: row.fecha_alta,
      precio: {
        id_precio: row.id_precio,
        id_unidad: row.id_unidad,
        precio_compra: row.precio_compra,
        porcentaje_ganancia: row.porcentaje_ganancia,
        precio_venta: row.precio_venta,
        fecha_inicio: row.precio_fecha_inicio,
        fecha_fin: row.precio_fecha_fin,
        unidad: {
          nombre: row.unidad_nombre,
          abreviatura: row.unidad_abreviatura,
        },
      },
    }));
  }

  async create(input: CreateProductoInput): Promise<CreateProductoResult> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute<RowDataPacket[]>(
        `SELECT id_producto
         FROM productos
         WHERE codigo_barras = ? OR sku = ?
         LIMIT 1`,
        [input.codigo_barras, input.codigo_barras],
      );

      if (existing.length > 0) {
        throw new ConflictError("El código de barras o SKU ya está registrado");
      }

      const [productoResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO productos
          (id_categoria, id_proveedor_principal, codigo_barras, sku, nombre, descripcion, control_lote, control_serie)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          ID_CATEGORIA_DEFAULT,
          input.id_proveedor_principal ?? null,
          input.codigo_barras,
          input.codigo_barras,
          input.nombre,
          input.descripcion ?? null,
        ],
      );

      const idProducto = productoResult.insertId;

      // El precio inicial nace activo y sin fecha de fin.
      const [precioResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO precios_producto
          (id_producto, id_unidad, precio_compra, porcentaje_ganancia, precio_venta, fecha_inicio, activo)
         VALUES (?, ?, ?, ?, ?, CURDATE(), 1)`,
        [
          idProducto,
          input.id_unidad,
          input.precio_compra,
          input.porcentaje_ganancia ?? null,
          input.precio_venta ?? null,
        ],
      );

      await connection.commit();

      return {
        id_producto: idProducto,
        id_precio: precioResult.insertId,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(input: UpdateProductoInput): Promise<ProductoSummary> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute<RowDataPacket[]>(
        "SELECT id_producto FROM productos WHERE id_producto = ?",
        [input.id_producto],
      );

      if (existing.length === 0) {
        throw new NotFoundError(`Producto ${input.id_producto} no encontrado`);
      }

      await connection.execute(
        `UPDATE productos
         SET codigo_barras = ?, sku = ?, nombre = ?, fecha_alta = NOW()
         WHERE id_producto = ?`,
        [input.codigo_barras, input.sku, input.nombre, input.id_producto],
      );

      if (input.precio) {
        const [priceRows] = await connection.execute<RowDataPacket[]>(
          "SELECT MAX(id_precio) AS maxId FROM precios_producto WHERE id_producto = ?",
          [input.id_producto],
        );
        const currentPriceId = priceRows[0]?.maxId as number | null;

        if (currentPriceId) {
          await connection.execute(
            "UPDATE precios_producto SET fecha_fin = CURDATE(), activo = 0 WHERE id_precio = ?",
            [currentPriceId],
          );
        }

        await connection.execute(
          `INSERT INTO precios_producto
            (id_producto, id_unidad, precio_compra, porcentaje_ganancia, precio_venta, fecha_inicio, activo)
           VALUES (?, ?, ?, ?, ?, CURDATE(), 1)`,
          [
            input.id_producto,
            input.precio.id_unidad,
            input.precio.precio_compra,
            input.precio.porcentaje_ganancia ?? null,
            input.precio.precio_venta ?? null,
          ],
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.findSummaryById(input.id_producto);
  }

  private async findSummaryById(idProducto: number): Promise<ProductoSummary> {
    const [productos] = await db.execute<ProductoSummary[]>(
      `${PRODUCTO_SUMMARY_BASE_QUERY} WHERE p.id_producto = ?`,
      [idProducto],
    );

    const producto = productos[0];

    if (!producto) {
      throw new NotFoundError(`Producto ${idProducto} no encontrado`);
    }

    return producto;
  }
}
