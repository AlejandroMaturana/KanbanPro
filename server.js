require("dotenv").config();
const app = require('./app');
const sequelize = require('./config/db');

/**
 * server.js: Punto de entrada para desarrollo LOCAL.
 * Este archivo NO se usa en Vercel, pero permite que 'pnpm run dev' siga funcionando.
 */

const PORT = process.env.PORT || 3000;

// Sincronización de Base de Datos y Arranque Local
sequelize.sync({ alter: true })
  .then(() => {
    console.log('\n🗄️ --- Sistema Conectado (Local/Desarrollo) ---');
    app.listen(PORT, () => {
      console.log(`🚀 KanbanPro iniciado localmente en: http://localhost:${PORT}`);
      console.log('💡 Recuerda que en Vercel el arranque es automático.\n');
      console.log('- Cuentas Seed: c.vega@email.cl / r.fuentes@email.cl\n');
    });
  })
  .catch(err => {
    console.error('❌ Error al iniciar el servidor local:', err);
    process.exit(1);
  });
