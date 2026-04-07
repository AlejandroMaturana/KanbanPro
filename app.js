require("dotenv").config();
const express = require('express');
const hbs = require('hbs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser'); 

const sequelize = require('./config/db');
const { Usuario, Tablero, Lista, Tarjeta } = require('./models');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'TuClaveSecretaParaKanban2026!';

// --- INICIALIZACIÓN DE DB ---
// En Vercel (Serverless), sincronizamos las tablas si no existen al arrancar la función
sequelize.sync()
  .then(() => console.log('📡 Base de datos sincronizada'))
  .catch(err => console.error('❌ Error sincronizando DB:', err));

// --- CONFIGURACIÓN DE HANDLEBARS ---
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'layouts'));
app.set('view options', { layout: 'layouts/layout' });

// --- MIDDLEWARES ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 
app.use(express.static(path.join(__dirname, 'public')));

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
      res.clearCookie('access_token');
    }
  }
  next();
});

// Middleware de autenticación
const verificarContexto = (req, res, next) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    if (req.url.startsWith('/api')) {
      return res.status(401).json({ error: 'Acceso denegado.' });
    }
    return res.redirect('/login');
  }

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuarioId = verificado.id;
    next();
  } catch (error) {
    if (req.url.startsWith('/api')) {
      return res.status(403).json({ error: 'Token inválido.' });
    }
    res.clearCookie('access_token');
    res.redirect('/login');
  }
};

// ==========================================
// 🔐 RUTAS DE AUTENTICACIÓN
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, contrasena } = req.body;
  try {
    if (!nombre || !email || !contrasena) return res.status(400).json({ error: 'Faltan datos.' });
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(409).json({ error: 'Email ya en uso.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);
    const nuevoUsuario = await Usuario.create({ nombre, email, contrasena: hashedPassword });

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

    console.log(`\n👤 --- Nuevo Usuario Registrado (con tablero): ${nuevoUsuario.nombre} ---`);
    res.status(201).json({ mensaje: 'Cuenta creada con éxito.', usuarioId: nuevoUsuario.id });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: 'Error en registro.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, contrasena } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '2h' });
    res.cookie('access_token', token, { httpOnly: true, secure: false, maxAge: 120 * 60 * 1000 });
    res.json({ token, mensaje: 'Acceso concedido.' });
  } catch (error) {
    console.error("❌ Error en Login:", error);
    res.status(500).json({ error: 'Error en login.', detalle: error.message });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.redirect('/login');
});

// ==========================================
// 📊 RUTAS DE VISTAS (SSR)
// ==========================================

app.get('/', (req, res) => res.render('home'));
app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));

app.get('/dashboard', verificarContexto, async (req, res) => {
  try {
    let tableros = await Tablero.findAll({
      where: { usuarioId: req.usuarioId },
      include: [{
        model: Lista,
        as: 'listas',
        include: [{ model: Tarjeta, as: 'tarjetas' }]
      }]
    });

    // Fallback para usuarios que no tengan tableros (por si falló el registro o son antiguos)
    if (tableros.length === 0) {
      const tablero = await Tablero.create({
        titulo: "Mi Primer Tablero",
        usuarioId: req.usuarioId
      });
      const listas = ["Por Hacer", "En Progreso", "Terminado"];
      for (const l of listas) {
        await Lista.create({ titulo: l, tableroId: tablero.id });
      }
      // Recargar tableros
      tableros = await Tablero.findAll({
        where: { usuarioId: req.usuarioId },
        include: [{
          model: Lista,
          as: 'listas',
          include: [{ model: Tarjeta, as: 'tarjetas' }]
        }]
      });
    }

    res.render('dashboard', { data: { tableros } });
  } catch (error) {
    console.error("Error dashboard:", error);
    res.status(500).send('Error cargando el dashboard.');
  }
});

app.post('/nueva-tarjeta', verificarContexto, async (req, res) => {
  try {
    const { titulo, descripcion, lista, prioridad } = req.body;
    let nombreListaBuscada = "Por Hacer";
    if (lista === "in-progress") nombreListaBuscada = "En Progreso";
    if (lista === "done") nombreListaBuscada = "Terminado";
    
    // Buscar todas las listas del usuario que coincidan con el nombre
    const tablerosUsuario = await Tablero.findAll({ where: { usuarioId: req.usuarioId } });
    const tableroIds = tablerosUsuario.map(t => t.id);

    const listaEncontrada = await Lista.findOne({ 
      where: { 
        titulo: nombreListaBuscada, 
        tableroId: tableroIds 
      } 
    });

    let nuevaTarjeta;
    if (!listaEncontrada) {
      // Si por alguna razón no se encuentra la lista, intentamos crearla en el primer tablero
      if (tableroIds.length > 0) {
        const nuevaLista = await Lista.create({ titulo: nombreListaBuscada, tableroId: tableroIds[0] });
        nuevaTarjeta = await Tarjeta.create({ titulo, descripcion, listaId: nuevaLista.id, prioridad: prioridad || "Media" });
      } else {
        return res.status(400).send('No se tiene un tablero configurado para añadir tareas.');
      }
    } else {
      nuevaTarjeta = await Tarjeta.create({ titulo, descripcion, listaId: listaEncontrada.id, prioridad: prioridad || "Media" });
    }

    // Para soportar tanto AJAX como formularios clásicos
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(201).json({ mensaje: 'Tarea creada.', tarjeta: nuevaTarjeta });
    }
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error("Error nueva tarjeta:", error);
    res.status(500).send('Error al crear tarjeta.');
  }
});

// ==========================================
// 🛠️ API DINÁMICA
// ==========================================

app.patch('/api/tarjetas/:id', verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;
    const tarjeta = await Tarjeta.findByPk(id, {
      include: [{ model: Lista, as: 'lista', include: [{ model: Tablero, as: 'tablero' }] }]
    });

    if (!tarjeta || tarjeta.lista.tablero.usuarioId !== req.usuarioId) {
      return res.status(403).json({ error: 'Sin permiso.' });
    }

    await tarjeta.update(req.body);
    res.json({ mensaje: 'Tarjeta actualizada.', tarjeta });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar.' });
  }
});

app.delete('/api/tarjetas/:id', verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;
    const tarjeta = await Tarjeta.findByPk(id, {
      include: [{ model: Lista, as: 'lista', include: [{ model: Tablero, as: 'tablero' }] }]
    });

    if (!tarjeta || tarjeta.lista.tablero.usuarioId !== req.usuarioId) {
      return res.status(403).json({ error: 'Sin permiso.' });
    }

    await tarjeta.destroy();
    res.json({ mensaje: 'Tarjeta eliminada.' });
  } catch (error) {
    console.error("❌ Error en DELETE tarjeta:", error);
    res.status(500).json({ error: 'Error al eliminar.' });
  }
});

// EXPORTACIÓN PARA VERCEL
module.exports = app;
