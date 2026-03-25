require("dotenv").config();
const { Sequelize } = require("sequelize");

// Creamos la instancia de Sequelize con los datos del .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres", // Indicamos que usaremos PostgreSQL
    logging: false, // false para no ver los queries SQL en consola y mantenerla limpia
  },
);

module.exports = sequelize;
