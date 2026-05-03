const express = require("express");
const router = express.Router();
const { verificarContexto } = require("../middlewares/authMiddleware");
const {
  buscarUsuarios,
  enviarInvitacion,
  obtenerInvitaciones,
  aceptarInvitacion,
  rechazarInvitacion,
  cancelarInvitacion
} = require("../controllers/invitationController");

router.use(verificarContexto);

// Nota: /api/usuarios/buscar se debe montar desde el index para que no tenga prefijo /invitations
// o montarlo en un route de usuarios. Lo montaré en /api/invitations/usuarios/buscar o /api/usuarios 
// Para mantener la API intacta, crearé dos routers: uno exportado por default y otro para usuarios.
// O se pueden exportar ambos. Lo mejor es definir router.get("/buscar") si lo montamos en /api/usuarios
// y definir las de invitaciones. 

// Este router asumirá que se monta en `/api/invitations`
router.post("/", enviarInvitacion);
router.get("/", obtenerInvitaciones);
router.patch("/:id/accept", aceptarInvitacion);
router.patch("/:id/reject", rechazarInvitacion);
router.delete("/:id", cancelarInvitacion);

module.exports = router;
