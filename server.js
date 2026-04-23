require("dotenv").config();
const app = require('./app');
const sequelize = require('./config/db');

/**
 * server.js: Punto de entrada para desarrollo LOCAL.
 * Este archivo NO se usa en Vercel, pero permite que 'pnpm run dev' siga funcionando.
 */

const PORT = process.env.PORT || 3000;

// Arranque Local
app.listen(PORT, () => {
  console.log(`🚀 KanbanPro iniciado localmente en: http://localhost:${PORT}`);
  console.log('💡 Recuerda ejecutar "pnpm migrate" si hay cambios en el esquema.');
  console.log('- Cuentas Seed: c.vega@email.cl / r.fuentes@email.cl\n');
});
