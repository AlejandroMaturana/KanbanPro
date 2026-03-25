require("dotenv").config();
const sequelize = require("./config/db");
const { Usuario, Tablero, Lista, Tarjeta } = require("./models");

const testCRUD = async () => {
  try {
    // Sincronizamos sin force para respetar los datos existentes del seed
    await sequelize.sync();
    console.log("PRUEBAS CRUD - KanbanPro\n");

    // --- CREATE ---
    console.log("--- CREATE ---");

    // Tomamos la primera lista existente en la BD para asociarle la nueva tarjeta
    const listaExistente = await Lista.findOne();

    if (!listaExistente) {
      console.log(
        "No hay listas en la BD. Ejecuta primero: node seed.js\nAbortando prueba.",
      );
      return;
    }

    const nuevaTarjeta = await Tarjeta.create({
      titulo: "Revisión de indicadores KPI - semana 12",
      descripcion: "Consolidar OEE, tasa de rechazo y tiempo medio de reparación (MTTR)",
      listaId: listaExistente.id,
    });
    console.log(`Tarjeta creada: "${nuevaTarjeta.titulo}" (ID: ${nuevaTarjeta.id})\n`);

    // --- READ ---
    console.log("--- READ ---");

    // Leemos un tablero completo con todas sus listas y tarjetas usando include
    const tablero = await Tablero.findOne({
      include: {
        model: Lista,
        include: Tarjeta,
      },
    });

    console.log("Tablero leído con sus listas y tarjetas:");
    console.log(JSON.stringify(tablero, null, 2));
    console.log();

    // --- UPDATE ---
    console.log("--- UPDATE ---");

    // Actualizamos el título de la tarjeta que recién creamos
    await nuevaTarjeta.update({ titulo: "Revisión KPI semana 12 (informe enviado)" });
    console.log(`Tarjeta actualizada. Nuevo título: "${nuevaTarjeta.titulo}"\n`);

    // --- DELETE ---
    console.log("--- DELETE ---");

    await nuevaTarjeta.destroy();
    console.log(`Tarjeta ID ${nuevaTarjeta.id} eliminada correctamente.`);

    // Verificamos que ya no existe en la BD
    const verificacion = await Tarjeta.findByPk(nuevaTarjeta.id);
    if (!verificacion) {
      console.log("Verificación: la tarjeta fue eliminada exitosamente de la BD.\n");
    }

    console.log("Pruebas CRUD completadas correctamente.");
  } catch (error) {
    console.error("Error durante las pruebas CRUD:", error);
  } finally {
    await sequelize.close();
    console.log("Conexión cerrada. Finalizando test-crud.js");
  }
};

// Autenticamos la conexión y ejecutamos las pruebas
sequelize
  .authenticate()
  .then(() => {
    console.log("Conectando a la base de datos...");
    testCRUD();
  })
  .catch((err) => {
    console.error(
      "No se pudo conectar a PostgreSQL. Verifica el .env o si el servicio está corriendo.",
      err,
    );
  });
