const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Definición del modelo "Tablero"
// Un usuario puede tener muchos tableros (relación 1:N con Usuario)
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
  },
  {
    tableName: "tableros",
    timestamps: true,
  },
);

module.exports = Tablero;
