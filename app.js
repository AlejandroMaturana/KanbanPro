require("dotenv").config();
const app = require("./server");
const sequelize = require("./config/db");

const PORT = process.env.PORT || 3000;

// Sincronización de Base de Datos y Arranque
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("\n🗄️ --- Sistema Conectado a PostgreSQL ---");
    app.listen(PORT, () => {
      console.log(`🚀 KanbanPro 3.0 iniciado en: http://localhost:${PORT}`);
      console.log(`- Cuentas Seed: c.vega@email.cl / r.fuentes@email.cl\n`);
    });
<<<<<<< HEAD
  })
  .catch((err) => {
    console.error("❌ Error crítico al sincronizar con DB:", err);
  });
=======

    console.log(`\n👤 --- Nuevo Usuario Registrado: ${nuevoUsuario.nombre} ---`);
    res.status(201).json({ mensaje: '¡Cuenta creada con éxito!', usuarioId: nuevoUsuario.id });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'No pudimos registrarte en este momento.' });
  }
});

// Login de Usuario
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

    // Guardamos el token en una Cookie para permitir el acceso al dashboard SSR (HU-07)
    res.cookie('access_token', token, {
      httpOnly: true, // Seguridad ante XSS
      secure: false,  // True en HTTPS (producción)
      maxAge: 120 * 60 * 1000 // 2 horas
    });

    console.log(`\n🔑 Acceso concedido para: ${usuario.email}`);
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

// Dashboard (HU-07: Conexión con Datos Reales PER USER)
// Protegido por verificarContexto para saber quién es el usuario logueado
app.get('/dashboard', verificarContexto, async (req, res) => {
  try {
    // Solo traemos los tableros del usuario actual (req.usuarioId)
    // Esto es lo que pide la HU-07 (mostre SUS tableros)
    const tableros = await Tablero.findAll({
      where: { usuarioId: req.usuarioId },
      include: [{
        model: Lista,
        as: 'listas', // Alias definido en models/index.js
        include: [{
          model: Tarjeta,
          as: 'tarjetas' // Alias definido en models/index.js
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

// Crear nueva tarjeta (POST con contexto de usuario)
app.post('/nueva-tarjeta', verificarContexto, async (req, res) => {
  try {
    const { titulo, descripcion, lista, prioridad } = req.body;
    
    // Mapeamos los valores del select (.hbs) a los títulos del seed
    let nombreListaBuscada = "Por Hacer";
    if (lista === "in-progress") nombreListaBuscada = "En Progreso";
    if (lista === "done") nombreListaBuscada = "Terminado";
    
    // Buscamos una lista válida dentro de CUALQUIERA de los tableros del usuario actual
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

// --- API PARA MANIPULACIÓN DINÁMICA (Drag & Drop / Eliminar) ---

// Actualizar tarjeta (PATCH)
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

// Eliminar tarjeta (DELETE)
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

// ==========================================
// 🚀 EXPORTACIÓN PARA VERCEL / SERVERLESS
// ==========================================
module.exports = app;
>>>>>>> de121cd4c74e1e7399d7a516cd7661f43f5529ec
