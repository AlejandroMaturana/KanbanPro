const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Usuario, Tablero, Lista, BoardMember } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "TuClaveSecretaParaKanban2026!";

const register = async (req, res) => {
  const { nombre, email, contrasena } = req.body;
  try {
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: "Faltan datos." });
    }
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
};

const login = async (req, res) => {
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
};

const logout = (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/login");
};

module.exports = { register, login, logout };
