require("dotenv").config();
const { Sequelize } = require("sequelize");

const dbUrl = process.env.DATABASE_URL;

let sequelize;

if (dbUrl) {
  sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: false // Desactivamos SSL forzado ya que el servidor indica no soportarlo
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'KanbanProyect',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      logging: false,
    }
  );
}

module.exports = sequelize;
