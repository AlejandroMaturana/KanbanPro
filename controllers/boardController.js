const { Usuario, Tablero, Lista, Tarjeta, BoardMember } = require("../models");

const createTablero = async (req, res) => {
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
};

const getTableros = async (req, res) => {
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
};

const getTableroById = async (req, res) => {
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
};

const updateTablero = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;

    const tablero = await Tablero.findByPk(id);
    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    // Actualizar campos (permisos ya verificados por middleware)
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
};

const deleteTablero = async (req, res) => {
  try {
    const { id } = req.params;

    const tablero = await Tablero.findByPk(id);
    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    await tablero.destroy();

    res.json({
      mensaje: "Tablero eliminado.",
    });
  } catch (error) {
    console.error("❌ Error en DELETE tablero:", error);
    res.status(500).json({ error: "Error al eliminar tablero." });
  }
};

module.exports = {
  createTablero,
  getTableros,
  getTableroById,
  updateTablero,
  deleteTablero
};
