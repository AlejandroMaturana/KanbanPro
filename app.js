require("dotenv").config();
const express = require("express");
const hbs = require("hbs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");

const sequelize = require("./config/db");
const { Usuario, Tablero, Lista, Tarjeta, BoardMember } = require("./models");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "TuClaveSecretaParaKanban2026!";

// --- INICIALIZACIÓN DE DB ---
// En Vercel (Serverless), sincronizamos las tablas si no existen al arrancar la función
sequelize
  .sync()
  .then(() => console.log("📡 Base de datos sincronizada"))
  .catch((err) => console.error("❌ Error sincronizando DB:", err));

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
      usuarioId: nuevoUsuario.id,
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
app.get("/cookie-policy", (req, res) =>
  res.render("cookie-policy", { title: "Política de Cookies" }),
);
app.get("/privacy-policy", (req, res) =>
  res.render("privacy-policy", { title: "Política de Privacidad" }),
);

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
app.patch("/api/tableros/:id", verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;

    const tablero = await Tablero.findByPk(id);
    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    // Verificar que es el owner
    if (tablero.owner_id !== req.usuarioId) {
      return res.status(403).json({ error: "Solo el owner puede editar." });
    }

    // Actualizar campos
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
app.delete("/api/tableros/:id", verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;

    const tablero = await Tablero.findByPk(id);
    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    // Verificar que es el owner
    if (tablero.owner_id !== req.usuarioId) {
      return res.status(403).json({ error: "Solo el owner puede eliminar." });
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
    const { titulo, descripcion, lista, prioridad } = req.body;
    let nombreListaBuscada = "Por Hacer";
    if (lista === "in-progress") nombreListaBuscada = "En Progreso";
    if (lista === "done") nombreListaBuscada = "Terminado";

    // Obtener tableros del usuario vía many-to-many
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (!usuario) return res.status(401).send("Usuario no autenticado");
    
    const tablerosUsuario = await usuario.getMiembro_tableros();
    const tableroIds = tablerosUsuario.map((t) => t.id);

    const listaEncontrada = await Lista.findOne({
      where: {
        titulo: nombreListaBuscada,
        tableroId: tableroIds,
      },
    });

    let nuevaTarjeta;
    if (!listaEncontrada) {
      // Si por alguna razón no se encuentra la lista, intentamos crearla en el primer tablero
      if (tableroIds.length > 0) {
        const nuevaLista = await Lista.create({
          titulo: nombreListaBuscada,
          tableroId: tableroIds[0],
        });
        nuevaTarjeta = await Tarjeta.create({
          titulo,
          descripcion,
          listaId: nuevaLista.id,
          prioridad: prioridad || "Media",
        });
      } else {
        return res
          .status(400)
          .send("No se tiene un tablero configurado para añadir tareas.");
      }
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

    await tarjeta.destroy();
    res.json({ mensaje: "Tarjeta eliminada." });
  } catch (error) {
    console.error("❌ Error en DELETE tarjeta:", error);
    res.status(500).json({ error: "Error al eliminar." });
  }
});

// EXPORTACIÓN PARA VERCEL
module.exports = app;
