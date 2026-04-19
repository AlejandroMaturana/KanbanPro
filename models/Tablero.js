const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Definición del modelo "Tablero"
// Cada usuario puede crear muchos tableros (relación many-to-many con Usuario a través de BoardMember)
const Tablero = sequelize.define(
  "Tablero",
  {
    titulo: {
      type: DataTypes.STRING,
      allowNull: false, // Todo tablero debe tener un título
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true, // La descripción es opcional
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "tableros",
    timestamps: true,
  },
);

module.exports = Tablero;
