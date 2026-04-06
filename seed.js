require("dotenv").config();
const sequelize = require("./config/db");
const { Usuario, Tablero, Lista, Tarjeta } = require("./models");
const bcrypt = require("bcryptjs");

const seed = async () => {
  try {
    // Sincronizamos todos los modelos con la BD, force: true recrea las tablas desde cero
    await sequelize.sync({ force: true });
    console.log(
      "🗄️  --- Sistema Reiniciado: Tablas creadas en PostgreSQL ---\n",
    );

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

    for (const p of personas) {
      const usuario = await Usuario.create({
        nombre: p.nombre,
        email: p.email,
        contrasena: await bcrypt.hash(p.clave, saltRounds),
      });
      console.log(`👤 Usuario creado: ${usuario.nombre} (${usuario.email})`);

      // --- CADA USUARIO TIENE SU PROPIO TABLERO ---
      let tituloTablero = `Gestión de ${usuario.nombre}`;
      let descTablero = "Tablero oficial de monitoreo de procesos.";

      if (p.nombre.includes("Carolina")) {
        tituloTablero = "Optimización Línea de Producción N°3";
        descTablero = "Foco en reducción de desperdicios y mejora de OEE.";
      } else if (p.nombre.includes("Rodrigo")) {
        tituloTablero = "Rediseño Almacén de Producto Terminado";
        descTablero =
          "Gestión de layout y flujo de materiales en bodega principal.";
      } else if (p.nombre.includes("Mariana")) {
        tituloTablero = "Invernadero A: Monitoreo Hidropónico";
        descTablero =
          "Control de PH, conductividad y nutrientes en tiempo real.";
      } else if (p.nombre.includes("Sebastián")) {
        tituloTablero = "Mantenimiento Preventivo Planta Sur";
        descTablero = "Gestión de activos industriales y paradas programadas.";
      }

      const tablero = await Tablero.create({
        titulo: tituloTablero,
        descripcion: descTablero,
        usuarioId: usuario.id,
      });
      console.log(`   📋 Tablero creado: "${tablero.titulo}"`);

      // --- CADA TABLERO TIENE 3 LISTAS ---
      const listas = [
        { titulo: "Por Hacer" },
        { titulo: "En Progreso" },
        { titulo: "Terminado" },
      ];

      for (const l of listas) {
        const listaNueva = await Lista.create({
          titulo: l.titulo,
          tableroId: tablero.id,
        });

        // --- AGREGAMOS TAREAS SEGÚN EL ROL ---
        if (l.titulo === "Por Hacer") {
          if (p.nombre.includes("Mariana")) {
            await Tarjeta.create({
              titulo: "Calibración Sensores NPK",
              descripcion:
                "Calibrar los 3 sensores del tanque principal después del cambio de filtro.",
              listaId: listaNueva.id,
              prioridad: "Urgente"
            });
            await Tarjeta.create({
              titulo: "Revisión Tasa Transpiración",
              descripcion:
                "Monitoreo de humedad relativa en zona de cultivo Vertical.",
              listaId: listaNueva.id,
            });
          } else if (p.nombre.includes("Sebastián")) {
            await Tarjeta.create({
              titulo: "Inspección Caldera N°2",
              descripcion:
                "Revisar presión de vapor y válvulas de seguridad presostáticas.",
              listaId: listaNueva.id,
              prioridad: "Alta"
            });
          } else {
            await Tarjeta.create({
              titulo: "Reunión de Planificación",
              descripcion: "Definir KPI del Sprint 3 con el equipo técnico.",
              listaId: listaNueva.id,
            });
          }
        }

        if (l.titulo === "En Progreso") {
          if (p.nombre.includes("Carolina")) {
            await Tarjeta.create({
              titulo: "Mapeo VSM Línea 3",
              descripcion:
                "Identificar cuellos de botella en la fase de empaquetado.",
              listaId: listaNueva.id,
            });
          } else if (p.nombre.includes("Rodrigo")) {
            await Tarjeta.create({
              titulo: "Inventario Cíclico Sector B",
              descripcion: "Conteo físico de materias primas críticas.",
              listaId: listaNueva.id,
            });
          } else {
            await Tarjeta.create({
              titulo: "Documentación de Procesos",
              descripcion: "Actualizar manuales de operación estándar (SOP).",
              listaId: listaNueva.id,
            });
          }
        }

        if (l.titulo === "Terminado") {
          await Tarjeta.create({
            titulo: "Cierre Auditoría Interna",
            descripcion: "Informe final enviado a gerencia técnica.",
            listaId: listaNueva.id,
            prioridad: "Baja"
          });
        }
      }
      console.log(`   ✅ Listas y Tareas generadas para ${usuario.nombre}\n`);
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
