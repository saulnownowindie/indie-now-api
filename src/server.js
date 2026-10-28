import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 3000;

// 1. Exportamos la app para que Vercel la use
export default app;

// 2. Solo encendemos el servidor tradicional si estamos en nuestra PC (desarrollo)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });
}
