const express = require("express");
const router = express.Router();
const { verificarContexto } = require("../middlewares/authMiddleware");
const { buscarUsuarios } = require("../controllers/invitationController");

router.use(verificarContexto);

router.get("/buscar", buscarUsuarios);

module.exports = router;
