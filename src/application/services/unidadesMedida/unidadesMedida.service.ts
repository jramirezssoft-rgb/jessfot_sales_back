import type { RowDataPacket } from "mysql2";
import { db } from "../../../infrastructure/db/mysql.connection.js";

type UnidadMedidaRow = RowDataPacket & {
  id_unidad: number;
  nombre: string;
  abreviatura: string;
};

export class UnidadesMedidaService {
  async getAll(): Promise<UnidadMedidaRow[]> {
    const [rows] = await db.execute<UnidadMedidaRow[]>(
      "SELECT id_unidad, nombre, abreviatura FROM unidades_medida",
    );

    return rows;
  }
}
