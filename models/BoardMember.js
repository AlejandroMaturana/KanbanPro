const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Definición del modelo "BoardMember" (tabla intermedia para relación many-to-many)
// Representa la membresía de un usuario en un tablero
const BoardMember = sequelize.define(
  "BoardMember",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role: {
      type: DataTypes.ENUM("owner", "editor", "viewer"),
      defaultValue: "editor",
      allowNull: false,
    },
  },
  {
    tableName: "board_members",
    timestamps: true,
    comment: "Tabla intermedia: mapea usuarios a tableros con roles de acceso",
    indexes: [
      {
        unique: true,
        fields: ["usuarioId", "tableroId"],
        name: "unique_user_board",
        comment: "Previene que un usuario sea miembro dos veces del mismo tablero",
      },
    ],
  },
);

module.exports = BoardMember;
