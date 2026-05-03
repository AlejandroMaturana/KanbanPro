const { Usuario, Tablero, Invitation, BoardMember } = require("../models");
const { Op } = require("sequelize");

const buscarUsuarios = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ usuarios: [] });
    }

    const usuarios = await Usuario.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { nombre: { [Op.iLike]: `%${q.trim()}%` } },
              { email: { [Op.iLike]: `%${q.trim()}%` } },
            ],
          },
          // Excluir al usuario que hace la búsqueda
          { id: { [Op.ne]: req.usuarioId } },
        ],
      },
      attributes: ["id", "nombre", "email"],
      limit: 8,
    });

    res.json({
      usuarios: usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
      })),
    });
  } catch (error) {
    console.error("❌ Error en búsqueda de usuarios:", error);
    res.status(500).json({ error: "Error al buscar usuarios." });
  }
};

const enviarInvitacion = async (req, res) => {
  try {
    const { boardId, inviteeEmail, role } = req.body;

    if (!boardId || !inviteeEmail || !role) {
      return res.status(400).json({ error: "Faltan datos: boardId, inviteeEmail, role." });
    }

    if (!["viewer", "editor", "owner"].includes(role)) {
      return res.status(400).json({ error: "Rol inválido. Debe ser viewer, editor u owner." });
    }

    // Verificar que el usuario tiene permisos para invitar (owner o editor)
    const membresiaInvitador = await BoardMember.findOne({
      where: {
        usuarioId: req.usuarioId,
        tableroId: boardId,
      },
    });

    if (!membresiaInvitador || !["owner", "editor"].includes(membresiaInvitador.role)) {
      return res.status(403).json({ error: "No tienes permisos para invitar a este tablero." });
    }

    // Verificar que el tablero existe
    const tablero = await Tablero.findByPk(boardId);
    if (!tablero) {
      return res.status(404).json({ error: "Tablero no encontrado." });
    }

    // Verificar que no hay invitación pendiente para este email en este tablero
    const invitacionExistente = await Invitation.findOne({
      where: {
        boardId,
        inviteeEmail,
        status: "pending",
      },
    });

    if (invitacionExistente) {
      return res.status(409).json({ error: "Ya existe una invitación pendiente para este email." });
    }

    // Verificar que el email no es ya miembro
    const usuarioExistente = await Usuario.findOne({ where: { email: inviteeEmail } });
    if (usuarioExistente) {
      const yaMiembro = await BoardMember.findOne({
        where: {
          usuarioId: usuarioExistente.id,
          tableroId: boardId,
        },
      });
      if (yaMiembro) {
        return res.status(409).json({ error: "Este usuario ya es miembro del tablero." });
      }
    }

    // Crear invitación
    const invitacion = await Invitation.create({
      boardId,
      inviterId: req.usuarioId,
      inviteeEmail,
      role,
    });

    res.status(201).json({
      mensaje: "Invitación enviada exitosamente.",
      invitacion: {
        id: invitacion.id,
        boardId: invitacion.boardId,
        inviteeEmail: invitacion.inviteeEmail,
        role: invitacion.role,
        status: invitacion.status,
        expiresAt: invitacion.expiresAt,
      },
    });
  } catch (error) {
    console.error("❌ Error en POST invitaciones:", error);
    res.status(500).json({ error: "Error al enviar invitación." });
  }
};

const obtenerInvitaciones = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuarioId);

    // Invitaciones enviadas
    const enviadas = await Invitation.findAll({
      where: { inviterId: req.usuarioId },
      include: [
        {
          model: Tablero,
          as: "board",
          attributes: ["id", "titulo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Invitaciones recibidas (buscar por email)
    const recibidas = await Invitation.findAll({
      where: { inviteeEmail: usuario.email },
      include: [
        {
          model: Tablero,
          as: "board",
          attributes: ["id", "titulo"],
        },
        {
          model: Usuario,
          as: "inviter",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      mensaje: "Invitaciones obtenidas.",
      enviadas: enviadas.map(i => ({
        id: i.id,
        board: i.board,
        inviteeEmail: i.inviteeEmail,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
      recibidas: recibidas.map(i => ({
        id: i.id,
        board: i.board,
        inviter: i.inviter,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Error en GET invitaciones:", error);
    res.status(500).json({ error: "Error al obtener invitaciones." });
  }
};

const aceptarInvitacion = async (req, res) => {
  try {
    const { id } = req.params;

    const invitacion = await Invitation.findByPk(id, {
      include: [{ model: Tablero, as: "board" }],
    });

    if (!invitacion) {
      return res.status(404).json({ error: "Invitación no encontrada." });
    }

    if (invitacion.status !== "pending") {
      return res.status(400).json({ error: "La invitación ya no está pendiente." });
    }

    // Verificar que el usuario actual es el destinatario
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (invitacion.inviteeEmail !== usuario.email) {
      return res.status(403).json({ error: "No tienes permiso para aceptar esta invitación." });
    }

    // Verificar que no está expirada
    if (new Date() > new Date(invitacion.expiresAt)) {
      invitacion.status = "expired";
      await invitacion.save();
      return res.status(400).json({ error: "La invitación ha expirado." });
    }

    // Agregar usuario al tablero
    await BoardMember.create({
      usuarioId: req.usuarioId,
      tableroId: invitacion.boardId,
      role: invitacion.role,
    });

    // Actualizar invitación
    invitacion.status = "accepted";
    await invitacion.save();

    res.json({
      mensaje: "Invitación aceptada. Ahora eres miembro del tablero.",
      tablero: {
        id: invitacion.board.id,
        titulo: invitacion.board.titulo,
      },
    });
  } catch (error) {
    console.error("❌ Error en PATCH accept invitación:", error);
    res.status(500).json({ error: "Error al aceptar invitación." });
  }
};

const rechazarInvitacion = async (req, res) => {
  try {
    const { id } = req.params;

    const invitacion = await Invitation.findByPk(id);

    if (!invitacion) {
      return res.status(404).json({ error: "Invitación no encontrada." });
    }

    if (invitacion.status !== "pending") {
      return res.status(400).json({ error: "La invitación ya no está pendiente." });
    }

    // Verificar que el usuario actual es el destinatario
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (invitacion.inviteeEmail !== usuario.email) {
      return res.status(403).json({ error: "No tienes permiso para rechazar esta invitación." });
    }

    invitacion.status = "rejected";
    await invitacion.save();

    res.json({ mensaje: "Invitación rechazada." });
  } catch (error) {
    console.error("❌ Error en PATCH reject invitación:", error);
    res.status(500).json({ error: "Error al rechazar invitación." });
  }
};

const cancelarInvitacion = async (req, res) => {
  try {
    const { id } = req.params;

    const invitacion = await Invitation.findByPk(id);

    if (!invitacion) {
      return res.status(404).json({ error: "Invitación no encontrada." });
    }

    // Verificar que el usuario es el enviador
    if (invitacion.inviterId !== req.usuarioId) {
      return res.status(403).json({ error: "Solo el enviador puede cancelar la invitación." });
    }

    if (invitacion.status !== "pending") {
      return res.status(400).json({ error: "Solo se pueden cancelar invitaciones pendientes." });
    }

    await invitacion.destroy();

    res.json({ mensaje: "Invitación cancelada." });
  } catch (error) {
    console.error("❌ Error en DELETE invitación:", error);
    res.status(500).json({ error: "Error al cancelar invitación." });
  }
};

module.exports = {
  buscarUsuarios,
  enviarInvitacion,
  obtenerInvitaciones,
  aceptarInvitacion,
  rechazarInvitacion,
  cancelarInvitacion
};
