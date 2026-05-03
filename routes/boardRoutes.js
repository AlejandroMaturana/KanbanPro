const express = require("express");
const router = express.Router();
const { verificarContexto, verificarPermisosTablero } = require("../middlewares/authMiddleware");
const {
  createTablero,
  getTableros,
  getTableroById,
  updateTablero,
  deleteTablero
} = require("../controllers/boardController");

// Todas las rutas de tablero requieren autenticación
router.use(verificarContexto);

router.post("/", createTablero);
router.get("/", getTableros);
router.get("/:id", getTableroById);
router.patch("/:id", verificarPermisosTablero(["owner"]), updateTablero);
router.delete("/:id", verificarPermisosTablero(["owner"]), deleteTablero);

module.exports = router;
