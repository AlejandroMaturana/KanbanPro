require("dotenv").config();
const sequelize = require("./config/db");
const { Usuario, Tablero, Lista, Tarjeta, BoardMember } = require("./models");
const bcrypt = require("bcryptjs");

const seed = async () => {
  try {
    // IMPORTANTE: En un sistema basado en migraciones, NO usamos sync() ni force: true.
    // El esquema debe ser creado con 'pnpm migrate'.
    console.log("🗄️  --- Iniciando poblado de datos (Seeds) ---");
    console.log("⚠️  Asegúrate de haber ejecutado 'pnpm migrate' antes.\n");

    const saltRounds = 10;

    // --- DEFINICIÓN DE USUARIOS (Roles Industriales) ---
    const personas = [
      { nombre: "Carolina Vega", email: "c.vega@email.cl", clave: "caro123" },
      {
        nombre: "Rodrigo Fuentes",
        email: "r.fuentes@email.cl",
        clave: "rorro369",
      },
      {
        nombre: "Mariana Silva",
        email: "m.silva@email.cl",
        clave: "mariana2024",
      },
      {
        nombre: "Sebastián Torres",
        email: "s.torres@email.cl",
        clave: "seba_ing",
      },
    ];

    const usuarios = [];
    for (const p of personas) {
      const [usuario, created] = await Usuario.findOrCreate({
        where: { email: p.email },
        defaults: {
          nombre: p.nombre,
          contrasena: await bcrypt.hash(p.clave, saltRounds),
        }
      });
      usuarios.push(usuario);
      console.log(`👤 Usuario ${created ? 'creado' : 'existente'}: ${usuario.nombre} (${usuario.email})`);
    }

    // --- CREAR MÚLTIPLES TABLEROS PERSONALES ---
    const tablerosPersonales = [
      {
        titulo: "Optimización Línea de Producción N°3",
        descripcion: "Foco en reducción de desperdicios y mejora de OEE.",
        usuario: usuarios[0], // Carolina
      },
      {
        titulo: "Proyectos Personales",
        descripcion: "Tareas personales y hobbies.",
        usuario: usuarios[0],
      },
      {
        titulo: "Rediseño Almacén de Producto Terminado",
        descripcion: "Gestión de layout y flujo de materiales en bodega principal.",
        usuario: usuarios[1], // Rodrigo
      },
      {
        titulo: "Estudios y Capacitación",
        descripcion: "Cursos y certificaciones en progreso.",
        usuario: usuarios[1],
      },
      {
        titulo: "Invernadero A: Monitoreo Hidropónico",
        descripcion: "Control de PH, conductividad y nutrientes en tiempo real.",
        usuario: usuarios[2], // Mariana
      },
      {
        titulo: "Jardinería Urbana",
        descripcion: "Proyecto personal de cultivo en balcón.",
        usuario: usuarios[2],
      },
      {
        titulo: "Mantenimiento Preventivo Planta Sur",
        descripcion: "Gestión de activos industriales y paradas programadas.",
        usuario: usuarios[3], // Sebastián
      },
      {
        titulo: "Reparaciones del Hogar",
        descripcion: "Mantenimiento y mejoras en la casa.",
        usuario: usuarios[3],
      },
    ];

    for (const tp of tablerosPersonales) {
      const [tablero, tCreated] = await Tablero.findOrCreate({
        where: { titulo: tp.titulo, owner_id: tp.usuario.id },
        defaults: { descripcion: tp.descripcion }
      });

      await BoardMember.findOrCreate({
        where: { usuarioId: tp.usuario.id, tableroId: tablero.id },
        defaults: { role: "owner" }
      });

      if (tCreated) {
        console.log(`   📋 Tablero personal creado: "${tablero.titulo}" para ${tp.usuario.nombre}`);
      }

      // Crear listas por defecto
      const listas = ["Por Hacer", "En Progreso", "Terminado"];
      for (const tituloLista of listas) {
        await Lista.findOrCreate({
          where: { titulo: tituloLista, tableroId: tablero.id }
        });
      }
    }

    // --- CREAR TABLEROS COMPARTIDOS ---
    const tablerosCompartidos = [
      {
        titulo: "Proyecto Integrado: Optimización Global",
        descripcion: "Colaboración entre todos los departamentos para mejora continua.",
        owner: usuarios[0], // Carolina como owner
        miembros: [
          { usuario: usuarios[1], role: "editor" }, // Rodrigo editor
          { usuario: usuarios[2], role: "editor" }, // Mariana editor
          { usuario: usuarios[3], role: "viewer" }, // Sebastián viewer
        ],
      },
      {
        titulo: "Mantenimiento Cruzado: Planta Norte-Sur",
        descripcion: "Coordinación de mantenimientos entre plantas industriales.",
        owner: usuarios[3], // Sebastián como owner
        miembros: [
          { usuario: usuarios[0], role: "editor" }, // Carolina editor
          { usuario: usuarios[1], role: "viewer" }, // Rodrigo viewer
        ],
      },
    ];

    for (const tc of tablerosCompartidos) {
      const [tablero, tCreated] = await Tablero.findOrCreate({
        where: { titulo: tc.titulo, owner_id: tc.owner.id },
        defaults: { descripcion: tc.descripcion }
      });

      // Owner
      await BoardMember.findOrCreate({
        where: { usuarioId: tc.owner.id, tableroId: tablero.id },
        defaults: { role: "owner" }
      });

      // Miembros adicionales
      for (const miembro of tc.miembros) {
        await BoardMember.findOrCreate({
          where: { usuarioId: miembro.usuario.id, tableroId: tablero.id },
          defaults: { role: miembro.role }
        });
      }

      if (tCreated) {
        console.log(`   📋 Tablero compartido creado: "${tablero.titulo}"`);
      }

      // Crear listas por defecto
      const listas = ["Por Hacer", "En Progreso", "Terminado"];
      for (const tituloLista of listas) {
        await Lista.findOrCreate({
          where: { titulo: tituloLista, tableroId: tablero.id }
        });
      }

      // Agregar algunas tareas de ejemplo a tableros compartidos
      if (tc.titulo.includes("Optimización Global")) {
        const listasTablero = await Lista.findAll({ where: { tableroId: tablero.id } });
        const porHacer = listasTablero.find(l => l.titulo === "Por Hacer");
        const enProgreso = listasTablero.find(l => l.titulo === "En Progreso");

        if (porHacer) {
          await Tarjeta.findOrCreate({
            where: { titulo: "Reunión Interdepartamental", listaId: porHacer.id },
            defaults: {
              descripcion: "Coordinar equipos para alineación de objetivos Q2.",
              prioridad: "Alta"
            }
          });
        }
        
        if (enProgreso) {
          await Tarjeta.findOrCreate({
            where: { titulo: "Análisis de Datos Cruzados", listaId: enProgreso.id },
            defaults: {
              descripcion: "Comparar métricas de producción entre plantas."
            }
          });
        }
      }
    }

    console.log("🚀 --- Poblado de Base de Datos finalizado con éxito ---");
  } catch (error) {
    console.error("❌ Hubo un error al poblar la base de datos:", error);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Conexión cerrada. Puedes iniciar con: npm start");
  }
};

// Autenticamos y ejecutamos
sequelize
  .authenticate()
  .then(() => {
    console.log("🔍 Conectando a PostgreSQL...");
    seed();
  })
  .catch((err) => {
    console.error("❌ No se pudo conectar a PostgreSQL:", err);
  });
