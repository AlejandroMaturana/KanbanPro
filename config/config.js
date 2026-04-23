require('dotenv').config();

const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
};

// Si hay una URL disponible, la usamos (Prioridad Vercel/Supabase)
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_URI;
if (dbUrl) {
  config.url = dbUrl;
}

module.exports = {
  development: { ...config, dialectOptions: { ssl: false } }, // SSL off for local dev usually
  production: config
};
