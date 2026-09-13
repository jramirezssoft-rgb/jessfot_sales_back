import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { db } from "../../../infrastructure/db/mysql.connection.js";

const ID_SUCURSAL_DEFAULT = 1;
const ID_USUARIO_DEFAULT = 1;
const ID_CLIENTE_DEFAULT = 1;

export type DetalleVentaInput = {
  id_producto: number;
  cantidad: number;
  subtotal: number;
};

export type CreateVentaInput = {
  total: number;
  detalle: DetalleVentaInput[];
};

export type CreateVentaResult = {
  id_venta: number;
  total: number;
  detalle: DetalleVentaInput[];
};

export class VentasService {
  async create(input: CreateVentaInput): Promise<CreateVentaResult> {
    const connection: PoolConnection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [ventaResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO ventas (id_sucursal, id_usuario, id_cliente, fecha_venta, total)
         VALUES (?, ?, ?, NOW(), ?)`,
        [
          ID_SUCURSAL_DEFAULT,
          ID_USUARIO_DEFAULT,
          ID_CLIENTE_DEFAULT,
          input.total,
        ],
      );

      const id_venta = ventaResult.insertId;

      const detalleValues = input.detalle.map((detalle) => [
        id_venta,
        detalle.id_producto,
        detalle.cantidad,
        detalle.subtotal,
      ]);

      await connection.query(
        `INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, subtotal) VALUES ?`,
        [detalleValues],
      );

      await connection.commit();

      return { id_venta, total: input.total, detalle: input.detalle };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
