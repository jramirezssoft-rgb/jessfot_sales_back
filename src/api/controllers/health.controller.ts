import type { Request, Response } from "express";
import { HealthService } from "../../application/services/health.service.js";

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getStatus = (_request: Request, response: Response): void => {
    response.status(200).json(this.healthService.getStatus());
  };
}
