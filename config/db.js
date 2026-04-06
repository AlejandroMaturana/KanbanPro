require("dotenv").config();
const { Sequelize } = require("sequelize");

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

module.exports = sequelize;
