const { Usuario, Tablero, Lista, Tarjeta, BoardMember } = require("../models");

const crearTarjeta = async (req, res) => {
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
};

const editarTarjeta = async (req, res) => {
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
};

const eliminarTarjeta = async (req, res) => {
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
};

module.exports = {
  crearTarjeta,
  editarTarjeta,
  eliminarTarjeta
};
