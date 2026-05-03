const jwt = require("jsonwebtoken");
const { Usuario, BoardMember } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "TuClaveSecretaParaKanban2026!";

// Middleware de autenticación
const verificarContexto = (req, res, next) => {
  let token = null;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    if (req.url.startsWith("/api")) {
      return res.status(401).json({ error: "Acceso denegado." });
    }
    return res.redirect("/login");
  }

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuarioId = verificado.id;
    next();
  } catch (error) {
    if (req.url.startsWith("/api")) {
      return res.status(403).json({ error: "Token inválido." });
    }
    res.clearCookie("access_token");
    res.redirect("/login");
  }
};

// Middleware de permisos por tablero
const verificarPermisosTablero = (rolesPermitidos = ["owner", "editor", "viewer"]) => {
  return async (req, res, next) => {
    try {
      const tableroId = req.params.id || req.body.tableroId || req.params.tableroId || req.body.boardId;
      if (!tableroId) {
        return res.status(400).json({ error: "ID de tablero requerido." });
      }

      const usuario = await Usuario.findByPk(req.usuarioId);
      if (!usuario) {
        return res.status(401).json({ error: "Usuario no autenticado." });
      }

      // Buscar membresía del usuario en el tablero
      const membresia = await BoardMember.findOne({
        where: {
          usuarioId: req.usuarioId,
          tableroId: tableroId,
        },
      });

      if (!membresia) {
        return res.status(403).json({ error: "No tienes acceso a este tablero." });
      }

      if (!rolesPermitidos.includes(membresia.role)) {
        return res.status(403).json({
          error: `Rol insuficiente. Se requiere: ${rolesPermitidos.join(" o ")}. Tu rol: ${membresia.role}`,
        });
      }

      req.userRole = membresia.role;
      req.boardMember = membresia;
      next();
    } catch (error) {
      console.error("Error en middleware de permisos:", error);
      res.status(500).json({ error: "Error verificando permisos." });
    }
  };
};

module.exports = { verificarContexto, verificarPermisosTablero };
