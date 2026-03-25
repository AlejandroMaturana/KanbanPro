const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Definición del modelo "Usuario"
const Usuario = sequelize.define(
  "Usuario",
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false, // El nombre es obligatorio
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // No puede haber dos usuarios con el mismo correo
    },
    contrasena: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "usuarios", // Nombre de la tabla en la base de datos
    timestamps: true, // Sequelize agrega createdAt y updatedAt automáticamente
  },
);

module.exports = Usuario;
