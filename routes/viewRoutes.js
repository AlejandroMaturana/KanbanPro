const express = require("express");
const router = express.Router();
const { verificarContexto } = require("../middlewares/authMiddleware");
const { logout } = require("../controllers/authController");
const {
  renderHome,
  renderRegister,
  renderLogin,
  renderInvitations,
  renderCookiePolicy,
  renderPrivacyPolicy,
  renderTableros,
  renderDashboard
} = require("../controllers/viewController");

router.get("/", renderHome);
router.get("/register", renderRegister);
router.get("/login", renderLogin);
router.get("/logout", logout);
router.get("/invitations", verificarContexto, renderInvitations);
router.get("/cookie-policy", renderCookiePolicy);
router.get("/privacy-policy", renderPrivacyPolicy);
router.get("/tableros", verificarContexto, renderTableros);
router.get("/dashboard", renderDashboard);

module.exports = router;
