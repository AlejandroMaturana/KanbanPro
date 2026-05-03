const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "TuClaveSecretaParaKanban2026!";

// Middleware Global para cargar contexto del usuario
const contextMiddleware = async (req, res, next) => {
  let token = req.cookies.access_token;
  if (token) {
    try {
      const verificado = jwt.verify(token, JWT_SECRET);
      req.usuarioId = verificado.id;
      const usuario = await Usuario.findByPk(verificado.id);
      if (usuario) {
        res.locals.nombreUsuario = usuario.nombre;
        res.locals.isAutenticado = true;
      }
    } catch (error) {
      res.clearCookie("access_token");
    }
  }
  next();
};

module.exports = { contextMiddleware };
