export const authenticateWorker = (req, res, next) => {
  const expected = process.env.WORKER_TOKEN;

  if (!expected) {
    return res.status(503).json({
      message: "El worker no está configurado en el servidor.",
    });
  }

  const header = req.headers.authorization || "";

  if (header !== `Bearer ${expected}`) {
    return res.status(401).json({
      message: "Token de worker inválido.",
    });
  }

  next();
};
