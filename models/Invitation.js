const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Definición del modelo "Invitation"
// Representa una invitación pendiente para unirse a un tablero
const Invitation = sequelize.define(
  "Invitation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    boardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tableros",
        key: "id",
      },
    },
    inviterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    inviteeEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    role: {
      type: DataTypes.ENUM("owner", "editor", "viewer"),
      defaultValue: "viewer",
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected", "expired"),
      defaultValue: "pending",
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    },
  },
  {
    tableName: "invitations",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["boardId", "inviteeEmail", "status"],
        where: {
          status: "pending",
        },
        name: "unique_pending_invitation",
        comment: "Previene invitaciones duplicadas pendientes para el mismo email en un tablero",
      },
    ],
  },
);

module.exports = Invitation;