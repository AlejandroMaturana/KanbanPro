require("dotenv").config();
const express = require("express");
const hbs = require("hbs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");

const sequelize = require("./config/db");
const { Usuario, Tablero, Lista, Tarjeta, BoardMember, Invitation } = require("./models");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "TuClaveSecretaParaKanban2026!";

// --- INICIALIZACIÓN DE DB ---
// En producción, las migraciones se ejecutan fuera del runtime (CI/CD o CLI).
// El runtime asume que el esquema ya es correcto.
sequelize
  .authenticate()
  .then(() => console.log("📡 Conectado a la base de datos"))
  .catch((err) => console.error("❌ Error de conexión DB:", err));

// --- CONFIGURACIÓN DE HANDLEBARS ---
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
hbs.registerPartials(path.join(__dirname, "views", "layouts"));
app.set("view options", { layout: "layouts/layout" });

// --- MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

// Middleware Global para cargar contexto del usuario
app.use(async (req, res, next) => {
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
});

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
      const tableroId = req.params.id || req.body.tableroId || req.params.tableroId;
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

// ==========================================
// 🔐 RUTAS DE AUTENTICACIÓN
// ==========================================

app.post("/api/auth/register", async (req, res) => {
  const { nombre, email, contrasena } = req.body;
  try {
    if (!nombre || !email || !contrasena)
      return res.status(400).json({ error: "Faltan datos." });
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(409).json({ error: "Email ya en uso." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      contrasena: hashedPassword,
    });

    // --- CREACIÓN AUTOMÁTICA DE ESTRUCTURA POR DEFECTO ---
    const tablero = await Tablero.create({
      titulo: `Tablero de ${nuevoUsuario.nombre}`,
      descripcion: "Tu primer tablero de tareas.",
      owner_id: nuevoUsuario.id,
    });

    // Agregar usuario como miembro owner en board_members
    await BoardMember.create({
      usuarioId: nuevoUsuario.id,
      tableroId: tablero.id,
      role: "owner",
    });

    const listasPrincipales = ["Por Hacer", "En Progreso", "Terminado"];
    for (const titulo of listasPrincipales) {
      await Lista.create({ titulo, tableroId: tablero.id });
    }

    console.log(
      `\n👤 --- Nuevo Usuario Registrado (con tablero): ${nuevoUsuario.nombre} ---`,
    );
    res
      .status(201)
      .json({
        mensaje: "Cuenta creada con éxito.",
        usuarioId: nuevoUsuario.id,
      });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error en registro." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, contrasena } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: "2h" },
    );
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 120 * 60 * 1000,
    });
    res.json({ token, mensaje: "Acceso concedido." });
  } catch (error) {
    console.error("❌ Error en Login:", error);
    res.status(500).json({ error: "Error en login.", detalle: error.message });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/login");
});

// ==========================================
// 📊 RUTAS DE VISTAS (SSR)
// ==========================================

app.get("/", (req, res) => res.render("home"));
app.get("/register", (req, res) => res.render("register"));
app.get("/login", (req, res) => res.render("login"));
app.get("/invitations", verificarContexto, async (req, res) => {
  try {
    res.render("invitations", { title: "Invitaciones" });
  } catch (error) {
    console.error("Error cargando invitaciones:", error);
    res.status(500).send("Error cargando invitaciones.");
  }
});
app.get("/cookie-policy", (req, res) =>
  res.render("cookie-policy", { title: "Política de Cookies" }),
);
app.get("/privacy-policy", (req, res) =>
  res.render("privacy-policy", { title: "Política de Privacidad" }),
);

app.get("/tableros", verificarContexto, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (!usuario) {
      return res.redirect("/login");
    }

    const tableros = await usuario.getMiembro_tableros({
      attributes: ["id", "titulo", "descripcion", "owner_id", "createdAt"],
    });

    res.render("tableros", { 
      title: "Administrar Tableros",
      data: {
        tableros: tableros.map(t => ({
          id: t.id,
          titulo: t.titulo,
          descripcion: t.descripcion,
          esOwner: t.owner_id === req.usuarioId,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    console.error("Error cargando tableros:", error);
    res.status(500).send("Error cargando administración de tableros.");
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    if (!req.usuarioId) {
      // Fallback a modo local / demo
      const tableros = [
        {
          id: "demo-board",
          titulo: "Tablero Demo (Modo Local)",
          listas: [
            {
              id: "todo",
              titulo: "Por Hacer",
              tarjetas: [
                {
                  id: "demo-1",
                  titulo: "Descubrir un buen desarrollador",
                  descripcion:
                    "Apoyar al talento emergente con una estrella en Github",
                  prioridad: "Media",
                },
              ],
            },
            { id: "in-progress", titulo: "En Progreso", tarjetas: [] },
            { id: "done", titulo: "Terminado", tarjetas: [] },
          ],
        },
      ];
      return res.render("dashboard", { data: { tableros }, isDemo: true });
    }

    // Obtener usuario autenticado
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (!usuario) {
      return res.status(401).send("Usuario no autenticado");
    }

    // Obtener tableros donde el usuario es miembro (vía many-to-many)
    let tableros = await usuario.getMiembro_tableros({
      include: [
        {
          model: Lista,
          as: "listas",
          include: [{ model: Tarjeta, as: "tarjetas" }],
        },
      ],
    });

    // Fallback: si no tiene tableros, crear uno nuevo
    if (tableros.length === 0) {
      const tablero = await Tablero.create({
        titulo: "Mi Primer Tablero",
        owner_id: req.usuarioId,
      });
      
      // Agregar usuario como miembro owner
      await BoardMember.create({
        usuarioId: req.usuarioId,
        tableroId: tablero.id,
        role: "owner",
      });
      
      // Crear listas por defecto
      const listas = ["Por Hacer", "En Progreso", "Terminado"];
      for (const l of listas) {
        await Lista.create({ titulo: l, tableroId: tablero.id });
      }
      
      // Recargar tableros
      tableros = await usuario.getMiembro_tableros({
        include: [
          {
            model: Lista,
            as: "listas",
            include: [{ model: Tarjeta, as: "tarjetas" }],
          },
        ],
      });
    }

    // --- REORDENAMIENTO DE LISTAS (Prioridad UI) ---
    const orderMap = {
      "por hacer": 1,
      hacer: 1,
      todo: 1,
      "en progreso": 2,
      "en proceso": 2,
      "in-progress": 2,
      terminado: 3,
      completado: 3,
      done: 3,
    };
    tableros.forEach((t) => {
      if (t.listas) {
        t.listas.sort((a, b) => {
          const titA = a.titulo.toLowerCase().trim();
          const titB = b.titulo.toLowerCase().trim();
          return (orderMap[titA] || 99) - (orderMap[titB] || 99);
        });
      }
    });

    res.render("dashboard", { data: { tableros } });
  } catch (error) {
    console.error("Error dashboard:", error);
    res.status(500).send("Error cargando el dashboard.");
  }
});

// ==========================================
// 🎯 API TABLEROS - CRUD ENDPOINTS
// ==========================================

// POST /api/tableros - Crear nuevo tablero
app.post("/api/tableros", verificarContexto, async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    
    if (!titulo || titulo.trim() === "") {
      return res.status(400).json({ error: "El título es requerido." });
    }

    const usuario = await Usuario.findByPk(req.usuarioId);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    // Crear tablero con owner_id
    const tablero = await Tablero.create({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || "",
      owner_id: req.usuarioId,
    });

    // Agregar usuario como miembro owner en board_members
    await BoardMember.create({
      usuarioId: req.usuarioId,
      tableroId: tablero.id,
      role: "owner",
    });

    // Crear listas por defecto
    const listasDefecto = ["Por Hacer", "En Progreso", "Terminado"];
    for (const nombreLista of listasDefecto) {
      await Lista.create({
        titulo: nombreLista,
        tableroId: tablero.id,
      });
    }

    res.status(201).json({
      mensaje: "Tablero creado exitosamente.",
      tablero: {
        id: tablero.id,
        titulo: tablero.titulo,
        descripcion: tablero.descripcion,
        owner_id: tablero.owner_id,
      },
    });
  } catch (error) {
    console.error("❌ Error en POST tableros:", error);
    res.status(500).json({ error: "Error al crear tablero." });
  }
});

// GET /api/tableros - Obtener tableros del usuario
app.get("/api/tableros", verificarContexto, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    // Obtener tableros donde el usuario es miembro
    const tableros = await usuario.getMiembro_tableros({
      attributes: ["id", "titulo", "descripcion", "owner_id", "createdAt"],
    });

    res.json({
      mensaje: "Tableros obtenidos.",
      tableros: tableros.map(t => ({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        esOwner: t.owner_id === req.usuarioId,
      })),
    });
  } catch (error) {
    console.error("❌ Error en GET tableros:", error);
    res.status(500).json({ error: "Error al obtener tableros." });
  }
});

// GET /api/tableros/:id - Obtener tablero específico
app.get("/api/tableros/:id", verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;
    
    const tablero = await Tablero.findByPk(id, {
      include: [
        {
          model: Lista,
          as: "listas",
          include: [{ model: Tarjeta, as: "tarjetas" }],
        },
      ],
    });

    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    // Verificar que el usuario es miembro
    const usuario = await Usuario.findByPk(req.usuarioId);
    const tablerosMiembro = await usuario.getMiembro_tableros();
    const tieneAcceso = tablerosMiembro.some(t => t.id === tablero.id);

    if (!tieneAcceso) {
      return res.status(403).json({ error: "Sin acceso a este tablero." });
    }

    res.json({
      mensaje: "Tablero obtenido.",
      tablero: {
        id: tablero.id,
        titulo: tablero.titulo,
        descripcion: tablero.descripcion,
        owner_id: tablero.owner_id,
        esOwner: tablero.owner_id === req.usuarioId,
        listas: tablero.listas.map(l => ({
          id: l.id,
          titulo: l.titulo,
          tarjetas: l.tarjetas || [],
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error en GET tablero específico:", error);
    res.status(500).json({ error: "Error al obtener tablero." });
  }
});

// PATCH /api/tableros/:id - Editar tablero (solo owner)
app.patch("/api/tableros/:id", verificarContexto, verificarPermisosTablero(["owner"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;

    const tablero = await Tablero.findByPk(id);
    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    // Actualizar campos (permisos ya verificados por middleware)
    if (titulo && titulo.trim() !== "") {
      tablero.titulo = titulo.trim();
    }
    if (descripcion !== undefined) {
      tablero.descripcion = descripcion?.trim() || "";
    }

    await tablero.save();

    res.json({
      mensaje: "Tablero actualizado.",
      tablero: {
        id: tablero.id,
        titulo: tablero.titulo,
        descripcion: tablero.descripcion,
      },
    });
  } catch (error) {
    console.error("❌ Error en PATCH tablero:", error);
    res.status(500).json({ error: "Error al actualizar tablero." });
  }
});

// DELETE /api/tableros/:id - Eliminar tablero (solo owner)
app.delete("/api/tableros/:id", verificarContexto, verificarPermisosTablero(["owner"]), async (req, res) => {
  try {
    const { id } = req.params;

    const tablero = await Tablero.findByPk(id);
    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    await tablero.destroy();

    res.json({
      mensaje: "Tablero eliminado.",
    });
  } catch (error) {
    console.error("❌ Error en DELETE tablero:", error);
    res.status(500).json({ error: "Error al eliminar tablero." });
  }
});

// ==========================================
// 📝 RUTAS TARJETAS
// ==========================================

app.post("/nueva-tarjeta", verificarContexto, async (req, res) => {
  try {
    const { titulo, descripcion, lista, prioridad, tableroId } = req.body;
    let nombreListaBuscada = "Por Hacer";
    if (lista === "in-progress") nombreListaBuscada = "En Progreso";
    if (lista === "done") nombreListaBuscada = "Terminado";

    // Obtener tableros del usuario vía many-to-many
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (!usuario) return res.status(401).send("Usuario no autenticado");

    const tablerosUsuario = await usuario.getMiembro_tableros();
    const tableroIds = tablerosUsuario.map((t) => t.id);

    // Validar que el tableroId enviado pertenece al usuario
    let tableroIdObjetivo = null;
    if (tableroId && tableroIds.includes(parseInt(tableroId))) {
      tableroIdObjetivo = parseInt(tableroId);
    } else if (tableroIds.length > 0) {
      // Fallback: primer tablero disponible
      tableroIdObjetivo = tableroIds[0];
    } else {
      return res.status(400).send("No se tiene un tablero configurado para añadir tareas.");
    }

    // Buscar la lista destino SOLO en el tablero seleccionado
    const listaEncontrada = await Lista.findOne({
      where: {
        titulo: nombreListaBuscada,
        tableroId: tableroIdObjetivo,
      },
    });

    let nuevaTarjeta;
    if (!listaEncontrada) {
      // Si no existe esa lista en el tablero, crearla
      const nuevaLista = await Lista.create({
        titulo: nombreListaBuscada,
        tableroId: tableroIdObjetivo,
      });
      nuevaTarjeta = await Tarjeta.create({
        titulo,
        descripcion,
        listaId: nuevaLista.id,
        prioridad: prioridad || "Media",
      });
    } else {
      nuevaTarjeta = await Tarjeta.create({
        titulo,
        descripcion,
        listaId: listaEncontrada.id,
        prioridad: prioridad || "Media",
      });
    }

    // Para soportar tanto AJAX como formularios clásicos
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res
        .status(201)
        .json({ mensaje: "Tarea creada.", tarjeta: nuevaTarjeta });
    }

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error nueva tarjeta:", error);
    res.status(500).send("Error al crear tarjeta.");
  }
});

// ==========================================
// 🛠️ API DINÁMICA
// ==========================================

app.patch("/api/tarjetas/:id", verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;
    const tarjeta = await Tarjeta.findByPk(id, {
      include: [
        {
          model: Lista,
          as: "lista",
          include: [{ model: Tablero, as: "tablero" }],
        },
      ],
    });

    if (!tarjeta) {
      return res.status(404).json({ error: "Tarjeta no encontrada." });
    }

    // Verificar que el usuario es miembro del tablero
    const usuario = await Usuario.findByPk(req.usuarioId);
    const tablerosMiembro = await usuario.getMiembro_tableros();
    const tieneAcceso = tablerosMiembro.some(t => t.id === tarjeta.lista.tablero.id);
    
    if (!tieneAcceso) {
      return res.status(403).json({ error: "Sin permiso." });
    }

    // Verificar rol: solo owner y editor pueden editar
    const membresia = await BoardMember.findOne({
      where: {
        usuarioId: req.usuarioId,
        tableroId: tarjeta.lista.tablero.id,
      },
    });

    if (!membresia || !["owner", "editor"].includes(membresia.role)) {
      return res.status(403).json({ error: "Rol insuficiente para editar tarjetas." });
    }

    await tarjeta.update(req.body);
    res.json({ mensaje: "Tarjeta actualizada.", tarjeta });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar." });
  }
});

app.delete("/api/tarjetas/:id", verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;
    const tarjeta = await Tarjeta.findByPk(id, {
      include: [
        {
          model: Lista,
          as: "lista",
          include: [{ model: Tablero, as: "tablero" }],
        },
      ],
    });

    if (!tarjeta) {
      return res.status(404).json({ error: "Tarjeta no encontrada." });
    }

    // Verificar que el usuario es miembro del tablero
    const usuario = await Usuario.findByPk(req.usuarioId);
    const tablerosMiembro = await usuario.getMiembro_tableros();
    const tieneAcceso = tablerosMiembro.some(t => t.id === tarjeta.lista.tablero.id);
    
    if (!tieneAcceso) {
      return res.status(403).json({ error: "Sin permiso." });
    }

    // Verificar rol: solo owner y editor pueden eliminar
    const membresia = await BoardMember.findOne({
      where: {
        usuarioId: req.usuarioId,
        tableroId: tarjeta.lista.tablero.id,
      },
    });

    if (!membresia || !["owner", "editor"].includes(membresia.role)) {
      return res.status(403).json({ error: "Rol insuficiente para eliminar tarjetas." });
    }

    await tarjeta.destroy();
    res.json({ mensaje: "Tarjeta eliminada." });
  } catch (error) {
    console.error("❌ Error en DELETE tarjeta:", error);
    res.status(500).json({ error: "Error al eliminar." });
  }
});

// ==========================================
// 📨 API INVITACIONES
// ==========================================

// GET /api/usuarios/buscar - Buscar usuarios por nombre o email
app.get("/api/usuarios/buscar", verificarContexto, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ usuarios: [] });
    }

    const { Op } = require("sequelize");
    const usuarios = await Usuario.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { nombre: { [Op.iLike]: `%${q.trim()}%` } },
              { email: { [Op.iLike]: `%${q.trim()}%` } },
            ],
          },
          // Excluir al usuario que hace la búsqueda
          { id: { [Op.ne]: req.usuarioId } },
        ],
      },
      attributes: ["id", "nombre", "email"],
      limit: 8,
    });

    res.json({
      usuarios: usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
      })),
    });
  } catch (error) {
    console.error("❌ Error en búsqueda de usuarios:", error);
    res.status(500).json({ error: "Error al buscar usuarios." });
  }
});

// POST /api/invitations - Enviar invitación

app.post("/api/invitations", verificarContexto, async (req, res) => {
  try {
    const { boardId, inviteeEmail, role } = req.body;

    if (!boardId || !inviteeEmail || !role) {
      return res.status(400).json({ error: "Faltan datos: boardId, inviteeEmail, role." });
    }

    if (!["viewer", "editor", "owner"].includes(role)) {
      return res.status(400).json({ error: "Rol inválido. Debe ser viewer, editor u owner." });
    }

    // Verificar que el usuario tiene permisos para invitar (owner o editor)
    const membresiaInvitador = await BoardMember.findOne({
      where: {
        usuarioId: req.usuarioId,
        tableroId: boardId,
      },
    });

    if (!membresiaInvitador || !["owner", "editor"].includes(membresiaInvitador.role)) {
      return res.status(403).json({ error: "No tienes permisos para invitar a este tablero." });
    }

    // Verificar que el tablero existe
    const tablero = await Tablero.findByPk(boardId);
    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    // Verificar que no hay invitación pendiente para este email en este tablero
    const invitacionExistente = await Invitation.findOne({
      where: {
        boardId,
        inviteeEmail,
        status: "pending",
      },
    });

    if (invitacionExistente) {
      return res.status(409).json({ error: "Ya existe una invitación pendiente para este email." });
    }

    // Verificar que el email no es ya miembro
    const usuarioExistente = await Usuario.findOne({ where: { email: inviteeEmail } });
    if (usuarioExistente) {
      const yaMiembro = await BoardMember.findOne({
        where: {
          usuarioId: usuarioExistente.id,
          tableroId: boardId,
        },
      });
      if (yaMiembro) {
        return res.status(409).json({ error: "Este usuario ya es miembro del tablero." });
      }
    }

    // Crear invitación
    const invitacion = await Invitation.create({
      boardId,
      inviterId: req.usuarioId,
      inviteeEmail,
      role,
    });

    res.status(201).json({
      mensaje: "Invitación enviada exitosamente.",
      invitacion: {
        id: invitacion.id,
        boardId: invitacion.boardId,
        inviteeEmail: invitacion.inviteeEmail,
        role: invitacion.role,
        status: invitacion.status,
        expiresAt: invitacion.expiresAt,
      },
    });
  } catch (error) {
    console.error("❌ Error en POST invitaciones:", error);
    res.status(500).json({ error: "Error al enviar invitación." });
  }
});

// GET /api/invitations - Obtener invitaciones del usuario
app.get("/api/invitations", verificarContexto, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuarioId);

    // Invitaciones enviadas
    const enviadas = await Invitation.findAll({
      where: { inviterId: req.usuarioId },
      include: [
        {
          model: Tablero,
          as: "board",
          attributes: ["id", "titulo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Invitaciones recibidas (buscar por email)
    const recibidas = await Invitation.findAll({
      where: { inviteeEmail: usuario.email },
      include: [
        {
          model: Tablero,
          as: "board",
          attributes: ["id", "titulo"],
        },
        {
          model: Usuario,
          as: "inviter",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      mensaje: "Invitaciones obtenidas.",
      enviadas: enviadas.map(i => ({
        id: i.id,
        board: i.board,
        inviteeEmail: i.inviteeEmail,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
      recibidas: recibidas.map(i => ({
        id: i.id,
        board: i.board,
        inviter: i.inviter,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Error en GET invitaciones:", error);
    res.status(500).json({ error: "Error al obtener invitaciones." });
  }
});

// PATCH /api/invitations/:id/accept - Aceptar invitación
app.patch("/api/invitations/:id/accept", verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;

    const invitacion = await Invitation.findByPk(id, {
      include: [{ model: Tablero, as: "board" }],
    });

    if (!invitacion) {
      return res.status(404).json({ error: "Invitación no encontrada." });
    }

    if (invitacion.status !== "pending") {
      return res.status(400).json({ error: "La invitación ya no está pendiente." });
    }

    // Verificar que el usuario actual es el destinatario
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (invitacion.inviteeEmail !== usuario.email) {
      return res.status(403).json({ error: "No tienes permiso para aceptar esta invitación." });
    }

    // Verificar que no está expirada
    if (new Date() > new Date(invitacion.expiresAt)) {
      invitacion.status = "expired";
      await invitacion.save();
      return res.status(400).json({ error: "La invitación ha expirado." });
    }

    // Agregar usuario al tablero
    await BoardMember.create({
      usuarioId: req.usuarioId,
      tableroId: invitacion.boardId,
      role: invitacion.role,
    });

    // Actualizar invitación
    invitacion.status = "accepted";
    await invitacion.save();

    res.json({
      mensaje: "Invitación aceptada. Ahora eres miembro del tablero.",
      tablero: {
        id: invitacion.board.id,
        titulo: invitacion.board.titulo,
      },
    });
  } catch (error) {
    console.error("❌ Error en PATCH accept invitación:", error);
    res.status(500).json({ error: "Error al aceptar invitación." });
  }
});

// PATCH /api/invitations/:id/reject - Rechazar invitación
app.patch("/api/invitations/:id/reject", verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;

    const invitacion = await Invitation.findByPk(id);

    if (!invitacion) {
      return res.status(404).json({ error: "Invitación no encontrada." });
    }

    if (invitacion.status !== "pending") {
      return res.status(400).json({ error: "La invitación ya no está pendiente." });
    }

    // Verificar que el usuario actual es el destinatario
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (invitacion.inviteeEmail !== usuario.email) {
      return res.status(403).json({ error: "No tienes permiso para rechazar esta invitación." });
    }

    invitacion.status = "rejected";
    await invitacion.save();

    res.json({ mensaje: "Invitación rechazada." });
  } catch (error) {
    console.error("❌ Error en PATCH reject invitación:", error);
    res.status(500).json({ error: "Error al rechazar invitación." });
  }
});

// DELETE /api/invitations/:id - Cancelar invitación (enviador)
app.delete("/api/invitations/:id", verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;

    const invitacion = await Invitation.findByPk(id);

    if (!invitacion) {
      return res.status(404).json({ error: "Invitación no encontrada." });
    }

    // Verificar que el usuario es el enviador
    if (invitacion.inviterId !== req.usuarioId) {
      return res.status(403).json({ error: "Solo el enviador puede cancelar la invitación." });
    }

    if (invitacion.status !== "pending") {
      return res.status(400).json({ error: "Solo se pueden cancelar invitaciones pendientes." });
    }

    await invitacion.destroy();

    res.json({ mensaje: "Invitación cancelada." });
  } catch (error) {
    console.error("❌ Error en DELETE invitación:", error);
    res.status(500).json({ error: "Error al cancelar invitación." });
  }
});

// EXPORTACIÓN PARA VERCEL
module.exports = app;
