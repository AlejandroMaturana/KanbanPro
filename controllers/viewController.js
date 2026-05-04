const { Usuario, Tablero, Lista, Tarjeta, BoardMember } = require("../models");

const renderHome = (req, res) => res.render("home", { layout: "layouts/layout-auth", title: "Inicio" });
const renderRegister = (req, res) => res.render("register", { layout: "layouts/layout-auth", title: "Registro" });
const renderLogin = (req, res) => res.render("login", { layout: "layouts/layout-auth", title: "Iniciar Sesión" });

const renderInvitations = async (req, res) => {
  try {
    res.render("invitations", { title: "Invitaciones" });
  } catch (error) {
    console.error("Error cargando invitaciones:", error);
    res.status(500).send("Error cargando invitaciones.");
  }
};

const renderCookiePolicy = (req, res) =>
  res.render("cookie-policy", { title: "Política de Cookies" });

const renderPrivacyPolicy = (req, res) =>
  res.render("privacy-policy", { title: "Política de Privacidad" });

const renderTableros = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (!usuario) {
      return res.redirect("/login");
    }

    const tableros = await usuario.getMiembro_tableros({
      attributes: ["id", "titulo", "descripcion", "owner_id", "createdAt"],
    });

    res.render("tableros", { 
      title: "Administrar Tableros",
      data: {
        tableros: tableros.map(t => ({
          id: t.id,
          titulo: t.titulo,
          descripcion: t.descripcion,
          esOwner: t.owner_id === req.usuarioId,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    console.error("Error cargando tableros:", error);
    res.status(500).send("Error cargando administración de tableros.");
  }
};

const renderDashboard = async (req, res) => {
  try {
    if (!req.usuarioId) {
      // Fallback a modo local / demo
      const tableros = [
        {
          id: "demo-board",
          titulo: "Tablero Demo (Modo Local)",
          listas: [
            {
              id: "todo",
              titulo: "Por Hacer",
              tarjetas: [
                {
                  id: "demo-1",
                  titulo: "Descubrir un buen desarrollador",
                  descripcion:
                    "Apoyar al talento emergente con una estrella en Github",
                  prioridad: "Media",
                },
              ],
            },
            { id: "in-progress", titulo: "En Progreso", tarjetas: [] },
            { id: "done", titulo: "Terminado", tarjetas: [] },
          ],
        },
      ];
      return res.render("dashboard", { data: { tableros }, isDemo: true });
    }

    // Obtener usuario autenticado
    const usuario = await Usuario.findByPk(req.usuarioId);
    if (!usuario) {
      return res.status(401).send("Usuario no autenticado");
    }

    // Obtener tableros donde el usuario es miembro (vía many-to-many)
    let tableros = await usuario.getMiembro_tableros({
      include: [
        {
          model: Lista,
          as: "listas",
          include: [{ model: Tarjeta, as: "tarjetas" }],
        },
      ],
    });

    // Fallback: si no tiene tableros, crear uno nuevo
    if (tableros.length === 0) {
      const tablero = await Tablero.create({
        titulo: "Mi Primer Tablero",
        owner_id: req.usuarioId,
      });
      
      // Agregar usuario como miembro owner
      await BoardMember.create({
        usuarioId: req.usuarioId,
        tableroId: tablero.id,
        role: "owner",
      });
      
      // Crear listas por defecto
      const listas = ["Por Hacer", "En Progreso", "Terminado"];
      for (const l of listas) {
        await Lista.create({ titulo: l, tableroId: tablero.id });
      }
      
      // Recargar tableros
      tableros = await usuario.getMiembro_tableros({
        include: [
          {
            model: Lista,
            as: "listas",
            include: [{ model: Tarjeta, as: "tarjetas" }],
          },
        ],
      });
    }

    // --- REORDENAMIENTO DE LISTAS (Prioridad UI) ---
    const orderMap = {
      "por hacer": 1,
      hacer: 1,
      todo: 1,
      "en progreso": 2,
      "en proceso": 2,
      "in-progress": 2,
      terminado: 3,
      completado: 3,
      done: 3,
    };
    tableros.forEach((t) => {
      if (t.listas) {
        t.listas.sort((a, b) => {
          const titA = a.titulo.toLowerCase().trim();
          const titB = b.titulo.toLowerCase().trim();
          return (orderMap[titA] || 99) - (orderMap[titB] || 99);
        });
      }
    });

    res.render("dashboard", { data: { tableros } });
  } catch (error) {
    console.error("Error dashboard:", error);
    res.status(500).send("Error cargando el dashboard.");
  }
};

module.exports = {
  renderHome,
  renderRegister,
  renderLogin,
  renderInvitations,
  renderCookiePolicy,
  renderPrivacyPolicy,
  renderTableros,
  renderDashboard
};
