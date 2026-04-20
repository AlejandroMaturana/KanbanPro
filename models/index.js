const Usuario = require("./Usuario");
const Tablero = require("./Tablero");
const Lista = require("./Lista");
const Tarjeta = require("./Tarjeta");
const BoardMember = require("./BoardMember");
const Invitation = require("./Invitation");

// ========================================
// RELACIONES MANY-TO-MANY (Usuario ↔ Tablero)
// ========================================
// Un usuario puede ser miembro de muchos tableros
// Un tablero puede tener muchos miembros (usuarios)
// Tabla intermedia: board_members
Usuario.belongsToMany(Tablero, {
  through: BoardMember,
  foreignKey: "usuarioId",
  otherKey: "tableroId",
  as: "miembro_tableros", // Acceso: usuario.getMiembro_tableros()
});

Tablero.belongsToMany(Usuario, {
  through: BoardMember,
  foreignKey: "tableroId",
  otherKey: "usuarioId",
  as: "miembros", // Acceso: tablero.getMiembros()
});

// Relaciones directas con tabla intermedia BoardMember
// Permite acceder a los "memberships" directamente si se necesita revisar roles/permisos
Usuario.hasMany(BoardMember, {
  foreignKey: "usuarioId",
  onDelete: "CASCADE",
  as: "memberships", // Acceso: usuario.getMemberships()
});
BoardMember.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

Tablero.hasMany(BoardMember, {
  foreignKey: "tableroId",
  onDelete: "CASCADE",
  as: "board_members", // Acceso: tablero.getBoard_members()
});
BoardMember.belongsTo(Tablero, { foreignKey: "tableroId", as: "tablero" });

// ========================================
// RELACIÓN PROPIETARIO (Usuario → Tablero via owner_id)
// ========================================
// Un usuario puede crear/poseer muchos tableros
// Cada tablero tiene exactamente un propietario (quien lo creó)
Usuario.hasMany(Tablero, {
  foreignKey: "owner_id",
  as: "tableros_creados", // Acceso: usuario.getTableros_creados()
  onDelete: "CASCADE",
});

Tablero.belongsTo(Usuario, {
  foreignKey: "owner_id",
  as: "propietario", // Acceso: tablero.getPropietario()
});

// ========================================
// RELACIONES EXISTENTES (uno a muchos)
// ========================================
// Un tablero puede tener muchas listas
Tablero.hasMany(Lista, {
  foreignKey: "tableroId",
  onDelete: "CASCADE",
  as: "listas",
});
Lista.belongsTo(Tablero, { foreignKey: "tableroId", as: "tablero" });

// Una lista puede tener muchas tarjetas
Lista.hasMany(Tarjeta, {
  foreignKey: "listaId",
  onDelete: "CASCADE",
  as: "tarjetas",
});
Tarjeta.belongsTo(Lista, { foreignKey: "listaId", as: "lista" });

// ========================================
// RELACIONES INVITATIONS
// ========================================
// Una invitación pertenece a un tablero y un invitador
Invitation.belongsTo(Tablero, {
  foreignKey: "boardId",
  as: "board",
  onDelete: "CASCADE",
});
Invitation.belongsTo(Usuario, {
  foreignKey: "inviterId",
  as: "inviter",
  onDelete: "CASCADE",
});

// Un tablero puede tener muchas invitaciones
Tablero.hasMany(Invitation, {
  foreignKey: "boardId",
  as: "invitations",
  onDelete: "CASCADE",
});

// Un usuario puede enviar muchas invitaciones
Usuario.hasMany(Invitation, {
  foreignKey: "inviterId",
  as: "sentInvitations",
  onDelete: "CASCADE",
});

module.exports = { Usuario, Tablero, Lista, Tarjeta, BoardMember, Invitation };
