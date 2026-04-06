const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Definición del modelo "Tarjeta"
// Cada tarjeta pertenece a una lista (relación 1:N con Lista)
const Tarjeta = sequelize.define(
  "Tarjeta",
  {
    titulo: {
      type: DataTypes.STRING,
      allowNull: false, // El título es obligatorio para identificar la tarea
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true, // La descripción es opcional, puede quedar vacía
    },
    prioridad: {
      type: DataTypes.ENUM("Baja", "Media", "Alta", "Urgente"),
      defaultValue: "Media",
      allowNull: false,
    },
    fechaVencimiento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tarjetas",
    timestamps: true,
  },
);

module.exports = Tarjeta;
