import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";

const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Ejemplo demo: usuario fijo para probar JWT.
authRouter.post("/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Datos inválidos",
      errors: parsed.error.flatten(),
    });
  }

  const { email, password } = parsed.data;

  // Usuario demo con contraseña hasheada para pruebas.
  const demoUser = {
    id: 1,
    email: "admin@jessoft.com",
    password: "$2b$10$purhyIbXCup6HmRIiUEnYuLPaffiATrzU0IM8JTQMV1CvFsrXadnG",
    role: "admin",
  };

  if (email !== demoUser.email) {
    return response.status(401).json({ message: "Credenciales inválidas" });
  }

  const validPassword = await bcrypt.compare(password, demoUser.password);

  if (!validPassword) {
    return response.status(401).json({ message: "Credenciales inválidas" });
  }

  const jwtSecret = env.JWT_SECRET as string;
  const jwtOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  const token = jwt.sign(
    { id: demoUser.id, email: demoUser.email, role: demoUser.role },
    jwtSecret,
    jwtOptions,
  );

  return response.status(200).json({
    message: "Login exitoso",
    token,
  });
});

export { authRouter };
