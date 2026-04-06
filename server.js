const app = require('./app');
const sequelize = require('./config/db');

/**
 * server.js: Punto de entrada para desarrollo LOCAL.
 * Este archivo NO se usa en Vercel, pero permite que 'pnpm run dev' siga funcionando
 * para un desarrollador novato de forma sencilla.
 */

const PORT = process.env.PORT || 3000;

// Sincronizamos la base de datos (usando alter para actualizar esquema sin borrar datos)
// E inciamos el servidor
sequelize.sync({ alter: true })
  .then(() => {
    console.log('\n🗄️ --- Sistema Conectado (Local/Desarrollo) ---');
    app.listen(PORT, () => {
      console.log(`🚀 KanbanPro iniciado localmente en: http://localhost:${PORT}`);
      console.log('💡 Recuerda que en Vercel el arranque es automático.\n');
    });
  })
  .catch(err => {
    console.error('❌ Error al iniciar el servidor local:', err);
    process.exit(1);
  });
