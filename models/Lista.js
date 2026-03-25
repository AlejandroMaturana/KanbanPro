const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Definición del modelo "Lista"
// Cada lista pertenece a un tablero (relación 1:N con Tablero)
const Lista = sequelize.define(
  "Lista",
  {
    titulo: {
      type: DataTypes.STRING,
      allowNull: false, // Toda lista necesita un título (Por Hacer/En Progreso/Terminado)
    },
  },
  {
    tableName: "listas",
    timestamps: true,
  },
);

module.exports = Lista;
