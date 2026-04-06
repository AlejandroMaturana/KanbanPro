require("dotenv").config();
const app = require("./server");
const sequelize = require("./config/db");

const PORT = process.env.PORT || 3000;

// Sincronización de Base de Datos y Arranque
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("\n🗄️ --- Sistema Conectado a PostgreSQL ---");
    app.listen(PORT, () => {
      console.log(`🚀 KanbanPro 3.0 iniciado en: http://localhost:${PORT}`);
      console.log(`- Cuentas Seed: c.vega@email.cl / r.fuentes@email.cl\n`);
    });
  })
  .catch((err) => {
    console.error("❌ Error crítico al sincronizar con DB:", err);
  });
