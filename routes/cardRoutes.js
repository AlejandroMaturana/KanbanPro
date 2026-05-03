const express = require("express");
const router = express.Router();
const { verificarContexto } = require("../middlewares/authMiddleware");
const {
  crearTarjeta,
  editarTarjeta,
  eliminarTarjeta
} = require("../controllers/cardController");

router.use(verificarContexto);

// Nota: /nueva-tarjeta (POST) originalmente estaba en la raíz en app.js
// Se mapeará en app.js tanto aquí bajo /api/tarjetas como en / para mantener compatibilidad
router.post("/nueva-tarjeta", crearTarjeta); // Mantenido para quien llame desde /api/tarjetas/nueva-tarjeta
router.post("/", crearTarjeta); // Endpoint REST normal
router.patch("/:id", editarTarjeta);
router.delete("/:id", eliminarTarjeta);

module.exports = router;
