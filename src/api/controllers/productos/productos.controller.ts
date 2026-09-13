import type { Request, Response } from "express";
import { z } from "zod";
import { ProductosService } from "../../../application/services/productos/productos.service.js";
import { NotFoundError } from "../../../shared/errors.js";

const createProductoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  codigo_barras: z.string().min(1),
  id_proveedor_principal: z.number().int().positive().nullable().optional(),
  id_unidad: z.number().int().positive(),
  precio_compra: z.number().positive(),
  porcentaje_ganancia: z.number().nonnegative().optional(),
  precio_venta: z.number().positive().optional(),
});

const listProductosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const searchProductoQuerySchema = z.object({
  producto: z.string().trim().min(1).max(150),
});

const updateProductoPrecioSchema = z
  .object({
    id_unidad: z.number().int().positive().optional(),
    precio_compra: z.number().positive().optional(),
    porcentaje_ganancia: z.number().nonnegative().optional(),
    precio_venta: z.number().positive().optional(),
  })
  .refine(
    (precio) => {
      const values = Object.values(precio).filter(
        (value) => value !== undefined,
      );
      return (
        values.length === 0 || values.length === Object.keys(precio).length
      );
    },
    {
      message:
        "Si se envía precio, debe incluir todos sus campos: id_unidad, precio_compra, porcentaje_ganancia y precio_venta",
    },
  )
  .transform((precio) =>
    precio.id_unidad === undefined
      ? undefined
      : (precio as Required<typeof precio>),
  );

const updateProductoSchema = z.object({
  id_producto: z.number().int().positive(),
  nombre: z.string().min(1),
  codigo_barras: z.string().min(1),
  sku: z.string().min(1),
  precio: updateProductoPrecioSchema.optional(),
});

export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  getAll = async (request: Request, response: Response): Promise<void> => {
    const parsed = listProductosQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      response.status(400).json({
        message: "Datos inválidos",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const productos = await this.productosService.getAll(parsed.data);
    response.status(200).json(productos);
  };

  search = async (request: Request, response: Response): Promise<void> => {
    const parsed = searchProductoQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      response.status(400).json({
        message: "Datos inválidos",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const productos = await this.productosService.search(parsed.data.producto);
    response.status(200).json(productos);
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const parsed = createProductoSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        message: "Datos inválidos",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const producto = await this.productosService.create(parsed.data);
    response.status(201).json(producto);
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const parsed = updateProductoSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        message: "Datos inválidos",
        errors: parsed.error.flatten(),
      });
      return;
    }

    try {
      const producto = await this.productosService.update(parsed.data);
      response.status(200).json(producto);
    } catch (error) {
      if (error instanceof NotFoundError) {
        response.status(404).json({ message: error.message });
        return;
      }
      throw error;
    }
  };
}
