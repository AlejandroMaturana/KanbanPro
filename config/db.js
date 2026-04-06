require("dotenv").config();
const { Sequelize } = require("sequelize");

// URL de conexión completa (Prioridad 1: Vercel / Supabase / Render)
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_URI;

let sequelize;

if (dbUrl) {
  sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false 
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Configuración por parámetros individuales (Local / Desarrollo)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'KanbanProyect',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;
