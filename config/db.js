require("dotenv").config();
const { Sequelize } = require("sequelize");
const pg = require("pg"); // Importación explícita para asegurar que Vercel incluya el paquete

// URL de conexión completa (Prioridad 1: Vercel / Supabase / Render)
const rawDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_URI;

/**
 * Limpia los parámetros SSL de la URL para que pg-connection-string
 * no sobreescriba la configuración SSL de dialectOptions.
 * Esto resuelve el error SELF_SIGNED_CERT_IN_CHAIN en Vercel.
 */
function stripSslParams(url) {
  try {
    const parsed = new URL(url);
    // Eliminar parámetros que conflictúan con dialectOptions.ssl
    ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat"].forEach((p) =>
      parsed.searchParams.delete(p)
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

const dbUrl = rawDbUrl ? stripSslParams(rawDbUrl) : null;

let sequelize;

if (dbUrl) {
  sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    dialectModule: pg, // Inyección directa del módulo para evitar carga dinámica fallida
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Acepta certificados autofirmados (Supabase, Neon, Render)
      },
      keepAlive: true,
    },
    pool: {
      max: 1, // En serverless, 1 conexión por función suele ser mejor para evitar agotar el pool del DB
      min: 0,
      acquire: 60000, // Aumentamos el tiempo de adquisición para evitar timeouts en el handshake
      idle: 10000,
    },
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
      dialectModule: pg, // Inyección directa del módulo
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
