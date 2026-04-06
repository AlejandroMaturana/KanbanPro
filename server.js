<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser'); 

// Importamos la conexión y los modelos
const sequelize = require('./config/db');
const { Usuario, Tablero, Lista, Tarjeta } = require('./models');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_por_defecto_123';

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

// Middleware Global para cargar contexto del usuario logueado en las Vistas
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

// --- MIDDLEWARE DE AUTENTICACIÓN ---
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
      return res.status(401).json({ error: 'Acceso denegado. Se requiere firma digital (Token).' });
    }
    return res.redirect('/login');
  }

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuarioId = verificado.id;
    next();
  } catch (error) {
    if (req.url.startsWith('/api')) {
      return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
    res.clearCookie('access_token');
    res.redirect('/login');
  }
};

// ==========================================
// 🔐 RUTAS DE AUTENTICACIÓN (API)
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, contrasena } = req.body;
  try {
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({ error: 'Ese email ya se encuentra en uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      contrasena: hashedPassword
    });

    res.status(201).json({ mensaje: '¡Cuenta creada con éxito!', usuarioId: nuevoUsuario.id });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'No pudimos registrarte en este momento.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, contrasena } = req.body;
  try {
    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValida) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '2h' });

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 120 * 60 * 1000 
    });

    res.json({ token, mensaje: 'Autenticación exitosa.' });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error del sistema al autenticar.' });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.redirect('/login');
});

// ==========================================
// 📊 RUTAS DE LAS VISTAS (Handlebars)
// ==========================================

app.get('/', (req, res) => res.render('home'));
app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));

app.get('/dashboard', verificarContexto, async (req, res) => {
  try {
    const tableros = await Tablero.findAll({
      where: { usuarioId: req.usuarioId },
      include: [{
        model: Lista,
        as: 'listas',
        include: [{
          model: Tarjeta,
          as: 'tarjetas'
        }]
      }]
    });

    const data = { tableros };
    res.render('dashboard', { data });
  } catch (error) {
    console.error('Falla al cargar Dashboard:', error);
    res.status(500).send('Error cargando los datos del sistema.');
  }
});

app.post('/nueva-tarjeta', verificarContexto, async (req, res) => {
  try {
    const { titulo, descripcion, lista, prioridad } = req.body;
    
    let nombreListaBuscada = "Por Hacer";
    if (lista === "in-progress") nombreListaBuscada = "En Progreso";
    if (lista === "done") nombreListaBuscada = "Terminado";
    
    const tablerosUsuario = await Tablero.findAll({ where: { usuarioId: req.usuarioId } });
    const tableroIds = tablerosUsuario.map(t => t.id);

    const listaEncontrada = await Lista.findOne({ 
      where: { 
        titulo: nombreListaBuscada,
        tableroId: tableroIds
      } 
    });
    
    if (listaEncontrada) {
      await Tarjeta.create({ 
        titulo, 
        descripcion, 
        listaId: listaEncontrada.id,
        prioridad: prioridad || "Media"
      });
    }
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error al crear tarjeta:', error);
    res.status(500).send('No se pudo guardar la tarea.');
  }
});

// --- API PARA MANIPULACIÓN DINÁMICA ---

app.patch('/api/tarjetas/:id', verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, listaId, prioridad, fechaVencimiento } = req.body;
    
    const tarjeta = await Tarjeta.findByPk(id, {
      include: [{ 
        model: Lista, 
        as: 'lista', 
        include: [{ model: Tablero, as: 'tablero' }] 
      }]
    });

    if (!tarjeta || tarjeta.lista.tablero.usuarioId !== req.usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta tarjeta.' });
    }

    await tarjeta.update({ titulo, descripcion, listaId, prioridad, fechaVencimiento });
    res.json({ mensaje: 'Tarjeta actualizada con éxito.', tarjeta });
  } catch (error) {
    console.error('Error al actualizar tarjeta:', error);
    res.status(500).json({ error: 'Error al actualizar la tarjeta.' });
  }
});

app.delete('/api/tarjetas/:id', verificarContexto, async (req, res) => {
  try {
    const { id } = req.params;
    const tarjeta = await Tarjeta.findByPk(id, {
      include: [{ 
        model: Lista, 
        as: 'lista', 
        include: [{ model: Tablero, as: 'tablero' }] 
      }]
    });

    if (!tarjeta || tarjeta.lista.tablero.usuarioId !== req.usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta tarjeta.' });
    }

    await tarjeta.destroy();
    res.json({ mensaje: 'Tarjeta eliminada con éxito.' });
  } catch (error) {
    console.error('Error al eliminar tarjeta:', error);
    res.status(500).json({ error: 'Error al eliminar la tarjeta.' });
  }
});

module.exports = app;
=======
const app = require('./app');
const sequelize = require('./config/db');

/**
 * server.js: Punto de entrada para desarrollo LOCAL.
 * Este archivo NO se usa en Vercel, pero permite que 'pnpm run dev' siga funcionando
 * para un desarrollador novato de forma sencilla.
 */

const PORT = process.env.PORT || 3000;

// Sincronizamos la base de datos (usando alter para actualizar esquema sin borrar datos)
// E inciamos el servidor
sequelize.sync({ alter: true })
  .then(() => {
    console.log('\n🗄️ --- Sistema Conectado (Local/Desarrollo) ---');
    app.listen(PORT, () => {
      console.log(`🚀 KanbanPro iniciado localmente en: http://localhost:${PORT}`);
      console.log('💡 Recuerda que en Vercel el arranque es automático.\n');
    });
  })
  .catch(err => {
    console.error('❌ Error al iniciar el servidor local:', err);
    process.exit(1);
  });
>>>>>>> de121cd4c74e1e7399d7a516cd7661f43f5529ec
