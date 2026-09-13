import type { Request, Response } from "express";
import { UnidadesMedidaService } from "../../../application/services/unidadesMedida/unidadesMedida.service.js";

export class UnidadesMedidaController {
  constructor(private readonly unidadesMedidaService: UnidadesMedidaService) {}

  getAll = async (_request: Request, response: Response): Promise<void> => {
    const unidadesMedida = await this.unidadesMedidaService.getAll();
    response.status(200).json(unidadesMedida);
  };
}
