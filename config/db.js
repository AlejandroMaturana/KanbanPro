require("dotenv").config();
const { Sequelize } = require("sequelize");

<<<<<<< HEAD
const sequelize = process.env.DB_URI 
  ? new Sequelize(process.env.DB_URI, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false,
      }
    );
=======
// Configuración para mayor resiliencia en Vercel (Serverless)
// Si existe una URL de conexión completa, la usamos (Prioridad 1)
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let sequelize;

if (dbUrl) {
  sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Común en DBs autogestionadas
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
  // Configuración por parámetros individuales (Local / Prioridad 2)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
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
>>>>>>> de121cd4c74e1e7399d7a516cd7661f43f5529ec

module.exports = sequelize;
