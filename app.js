require("dotenv").config();
const express = require("express");
const hbs = require("hbs");
const path = require("path");
const cookieParser = require("cookie-parser");

const sequelize = require("./config/db");

// Middlewares
const { contextMiddleware } = require("./middlewares/contextMiddleware");

// Routes
const viewRoutes = require("./routes/viewRoutes");
const authRoutes = require("./routes/authRoutes");
const boardRoutes = require("./routes/boardRoutes");
const cardRoutes = require("./routes/cardRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

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

// --- MIDDLEWARES GLOBALES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

// Contexto global del usuario
app.use(contextMiddleware);

// --- RUTAS ---
app.use("/", viewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tableros", boardRoutes);
app.use("/api/tarjetas", cardRoutes);
app.post("/nueva-tarjeta", require("./middlewares/authMiddleware").verificarContexto, require("./controllers/cardController").crearTarjeta);
app.use("/api/invitations", invitationRoutes);
app.use("/api/usuarios", userRoutes);

// EXPORTACIÓN PARA EL SERVIDOR
module.exports = app;
