# 📋 KanbanPro - Gestión de Proyectos de Alto Rendimento

> Una solución Full Stack robusta y avanzada para la gestión de flujos de trabajo mediante tableros Kanban interactivos. Diseñada para centralizar la productividad con seguridad de grado empresarial, colaboración en equipo y una arquitectura RESTful moderna.

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-Framework-000000?logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?logo=sequelize&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Security-000000?logo=json-web-tokens&logoColor=white)
![Handlebars](https://img.shields.io/badge/Handlebars-Templates-F0AD4E?logo=handlebars.js&logoColor=white)
![SortableJS](https://img.shields.io/badge/SortableJS-Interactivity-indigo?logo=javascript&logoColor=white)

</div>

---

## 🌟 Características Principales

KanbanPro ha evolucionado para ofrecer una experiencia fluida y profesional de gestión de tareas:

### 🖥️ Gestión de Tareas y Tableros

- 🖱️ **Interactividad Drag & Drop**: Movimiento fluido de tareas entre columnas mediante **SortableJS**, sincronizando el estado con la base de datos en tiempo real sin recargar la página.
- 🚦 **Gestión de Prioridades**: Sistema de etiquetas dinámicas (**Urgente, Alta, Media, Baja**) con códigos de colores para una jerarquización visual inmediata del trabajo.
- ✏️ **CRUD Completo de Tareas**: Crear, editar y eliminar tareas directamente desde el dashboard con modales interactivos y actualizaciones AJAX.
- 📋 **Multi-Tablero**: Crea y gestiona múltiples tableros por usuario, con navegación rápida entre ellos desde el dashboard.
- 📱 **Diseño Responsivo**: Interfaz adaptativa con scroll-snap 15/70/15 en móvil, menú hamburguesa y navegación optimizada para pantallas pequeñas.

### 👥 Colaboración y Seguridad

- 🛡️ **Seguridad Blindada**: Autenticación persistente con **JWT (JSON Web Tokens)** en cookies `httpOnly` y hasheo de contraseñas con **bcryptjs**.
- 📩 **Sistema de Invitaciones**: Invita usuarios a tus tableros por email con roles diferenciados (**Owner, Editor, Viewer**) y gestión de invitaciones enviadas/recibidas.
- 🔐 **Control de Permisos**: Sistema de membresías con roles granulares: el dueño controla el tablero, los editores modifican tareas, los viewers solo consultan.
- 🔍 **Búsqueda de Usuarios**: Busca usuarios por nombre o email en tiempo real (con debounce) al enviar invitaciones.

### 🎨 Experiencia de Usuario

- 🌓 **Tema Claro/Oscuro**: Toggle de tema con preferencia persistente en `localStorage`, transiciones suaves y variables CSS dinámicas.
- 🔔 **Notificaciones Toast**: Feedback visual inmediato con animaciones de entrada/salida, iconos por tipo (✅ éxito, ❌ error, ℹ️ info) y auto-dismiss.
- ✅ **Modales de Confirmación**: Diálogos personalizados con backdrop-blur, animaciones y retorno de promesas para acciones destructivas.
- 🚀 **Modo Demo**: Explora la app sin registrarte con un tablero precargado que persiste en `localStorage`.

### 🏗️ Arquitectura

- 🏗️ **Arquitectura RESTful & SSR**: API robusta combinada con renderizado dinámico (Server Side Rendering) mediante **Handlebars** para un rendimiento óptimo.
- 📊 **Modelado Relacional de Datos**: Estructura íntegra de Usuarios ➔ Tableros ➔ Listas ➔ Tarjetas + tablas intermedias para membresías e invitaciones usando **Sequelize ORM**.
- 🔄 **Migraciones y Seeds**: Base de datos versionada con migraciones automáticas y generador de datos de prueba con tableros industriales simulados.

---

## 🛠️ Stack Tecnológico

La infraestructura técnica garantiza escalabilidad, seguridad y una UX moderna:

- **Backend**: **Node.js** & **Express 5** con arquitectura de rutas modular (`authRoutes`, `boardRoutes`, `cardRoutes`, `invitationRoutes`, `userRoutes`, `viewRoutes`).
- **Base de Datos**: **PostgreSQL** para persistencia de datos crítica con **Sequelize ORM**.
- **Seguridad**: JWT con cookies `httpOnly` (expiración 2h), bcryptjs (salt rounds: 10), middleware de autenticación y verificación de permisos por tablero.
- **Frontend**: **HBS (Handlebars)** para SSR, **Vanilla CSS** con variables CSS y Flexbox/Grid, **SortableJS** para drag & drop, fuente **Inter** (Google Fonts).
- **Testing**: **Playwright** para pruebas E2E con modo UI.
- **Dev Tools**: **Nodemon** para hot-reload, **sequelize-cli** para migraciones, **dotenv** para configuración de entorno.

---

## 📂 Estructura del Proyecto

```text
KanbanPro/
│
├── server.js             # Punto de entrada del servidor
├── app.js                # Configuración Express, Middlewares y Rutas
├── models/               # Definición de Esquemas Sequelize
│   ├── Usuario.js        # Modelo de usuarios con bcrypt
│   ├── Tablero.js        # Modelo de tableros Kanban
│   ├── Lista.js          # Modelo de listas/columnas
│   ├── Tarjeta.js        # Modelo de tarjetas/tareas
│   ├── BoardMember.js    # Tabla intermedia membresías (roles)
│   ├── Invitation.js     # Modelo de invitaciones
│   └── index.js          # Relaciones entre modelos
├── routes/               # Controladores de rutas modulares
│   ├── authRoutes.js     # Registro y login
│   ├── boardRoutes.js    # CRUD de tableros
│   ├── cardRoutes.js     # CRUD de tarjetas
│   ├── invitationRoutes.js # Gestión de invitaciones
│   ├── userRoutes.js     # Búsqueda de usuarios
│   └── viewRoutes.js     # Renderizado de vistas
├── middlewares/          # Middleware de autenticación y contexto
│   ├── authMiddleware.js # verificarContexto, verificarPermisosTablero
│   └── contextMiddleware.js # Carga de contexto de usuario global
├── views/                # Plantillas Handlebars (SSR)
│   ├── layouts/
│   │   └── layout.hbs    # Layout principal (nav, footer, theme toggle)
│   ├── home.hbs          # Página de inicio / landing
│   ├── login.hbs         # Formulario de inicio de sesión
│   ├── register.hbs      # Formulario de registro
│   ├── dashboard.hbs     # Tablero Kanban principal
│   ├── tableros.hbs      # Gestión de tableros
│   ├── invitations.hbs   # Gestión de invitaciones
│   ├── cookie-policy.hbs # Política de cookies
│   └── privacy-policy.hbs # Política de privacidad
├── public/
│   ├── css/
│   │   ├── main.css      # Variables de tema, componentes globales, toasts
│   │   └── dashboard.css # Estilos del Kanban, modales, animaciones
│   └── js/
│       ├── kanban.js     # Drag & Drop, modales, CRUD AJAX, demo mode
│       └── auth.js       # Login/registro AJAX, password toggle
├── seed.js               # Generador de datos de prueba (4 usuarios, 10 tableros)
├── config/               # Configuración de Sequelize
├── migrations/           # Migraciones de base de datos
└── tests/                # Pruebas E2E con Playwright
```

---

## 📄 Páginas y Vistas

| Página             | Ruta              | Descripción                                       | Auth    |
| ------------------ | ----------------- | ------------------------------------------------- | ------- |
| **Home**           | `/`               | Landing con descripción y CTAs                    | No      |
| **Registro**       | `/register`       | Formulario de creación de cuenta                  | No      |
| **Login**          | `/login`          | Inicio de sesión con email/contraseña             | No      |
| **Dashboard**      | `/dashboard`      | Tablero Kanban con drag & drop, modales de tareas | Demo/Sí |
| **Tableros**       | `/tableros`       | Lista de tableros, crear/eliminar tableros        | Sí      |
| **Invitaciones**   | `/invitations`    | Invitaciones enviadas y recibidas con tabs        | Sí      |
| **Cookie Policy**  | `/cookie-policy`  | Política de uso de cookies                        | No      |
| **Privacy Policy** | `/privacy-policy` | Política de privacidad y derechos                 | No      |
| **Logout**         | `/logout`         | Cierra sesión y limpia cookies                    | Sí      |

---

## 🔌 Endpoints de la API

### Autenticación (`/api/auth`)

| Método | Endpoint    | Descripción                                               |
| ------ | ----------- | --------------------------------------------------------- |
| `POST` | `/register` | Registra nuevo usuario, crea tablero y listas por defecto |
| `POST` | `/login`    | Autentica usuario, devuelve JWT en cookie httpOnly        |

### Tableros (`/api/tableros`)

| Método   | Endpoint | Descripción                              | Permiso     |
| -------- | -------- | ---------------------------------------- | ----------- |
| `POST`   | `/`      | Crea un nuevo tablero                    | Autenticado |
| `GET`    | `/`      | Obtiene todos los tableros del usuario   | Autenticado |
| `GET`    | `/:id`   | Obtiene un tablero específico            | Miembro     |
| `PATCH`  | `/:id`   | Actualiza título/descripción del tablero | Owner       |
| `DELETE` | `/:id`   | Elimina un tablero y sus datos           | Owner       |

### Tarjetas (`/api/tarjetas` y `/nueva-tarjeta`)

| Método   | Endpoint         | Descripción                          | Permiso      |
| -------- | ---------------- | ------------------------------------ | ------------ |
| `POST`   | `/`              | Crea una nueva tarjeta               | Autenticado  |
| `POST`   | `/nueva-tarjeta` | Crea tarjeta desde formulario SSR    | Autenticado  |
| `PATCH`  | `/:id`           | Edita título, descripción, prioridad | Owner/Editor |
| `DELETE` | `/:id`           | Elimina una tarjeta                  | Owner/Editor |

### Invitaciones (`/api/invitations`)

| Método   | Endpoint      | Descripción                                 |
| -------- | ------------- | ------------------------------------------- |
| `POST`   | `/`           | Envía invitación a un email para un tablero |
| `GET`    | `/`           | Obtiene invitaciones enviadas y recibidas   |
| `PATCH`  | `/:id/accept` | Acepta una invitación recibida              |
| `PATCH`  | `/:id/reject` | Rechaza una invitación recibida             |
| `DELETE` | `/:id`        | Cancela una invitación enviada              |

### Usuarios (`/api/usuarios`)

| Método | Endpoint          | Descripción                       |
| ------ | ----------------- | --------------------------------- |
| `GET`  | `/buscar?q=query` | Busca usuarios por nombre o email |

---

## 🗃️ Modelos de Datos

```
Usuario (UUID)
  ├── nombre, email, contrasena (hashed)
  ├── hasMany → Tablero (como owner_id)
  └── belongsToMany → Tablero (como miembro, via BoardMember)

Tablero (Integer)
  ├── titulo, descripcion, owner_id
  ├── hasMany → Lista
  ├── hasMany → Invitation
  └── belongsToMany → Usuario (miembros)

Lista (Integer)
  ├── titulo, tableroId
  └── hasMany → Tarjeta

Tarjeta (Integer)
  ├── titulo, descripcion, prioridad (ENUM), fechaVencimiento, listaId
  └── belongsTo → Lista

BoardMember (Integer)
  ├── usuarioId, tableroId, role (owner/editor/viewer)
  └── Unique: (usuarioId, tableroId)

Invitation (Integer)
  ├── boardId, inviterId, inviteeEmail, role, status, expiresAt (7 días)
  └── Unique: (boardId, inviteeEmail, status='pending')
```

---

## 🚀 Instalación y Uso

### Prerrequisitos

- **Node.js** (v18 o superior)
- **PostgreSQL** (Instalado y en ejecución)
- **pnpm** (recomendado) o **npm** igual sirve

### Pasos para el Despliegue Local

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/AlejandroMaturana/KanbanPro.git
   ```
2. **Instala las dependencias**:
   ```bash
   pnpm install
   ```
3. **Configura el entorno**:
   Crea un archivo `.env` en la raíz del proyecto. **Importante**: Define `DB_URL` o los parámetros de conexión individuales, y tu `JWT_SECRET`.
4. **Inicializa la Base de Datos**:
   Pobla el sistema con usuarios y tableros industriales de prueba:
   ```bash
   pnpm run seed
   ```
5. **Inicia el Modo Desarrollo**:
   ```bash
   pnpm run dev
   ```

### Scripts Disponibles

| Comando                 | Descripción                                      |
| ----------------------- | ------------------------------------------------ |
| `pnpm run dev`          | Servidor de desarrollo con nodemon (auto-reload) |
| `pnpm start`            | Servidor de producción                           |
| `pnpm run migrate`      | Ejecuta migraciones de base de datos             |
| `pnpm run migrate:undo` | Revierte la última migración                     |
| `pnpm run seed`         | Pobla la BD con datos de prueba                  |
| `pnpm run test-crud`    | Ejecuta pruebas de CRUD                          |
| `pnpm run test-e2e`     | Ejecuta pruebas E2E con Playwright               |
| `pnpm run test-e2e-ui`  | Ejecuta pruebas E2E con interfaz visual          |

---

## 👤 Autor

**Alejandro Maturana (ManuGL)** – _Industrial Engineer & Full Stack Developer_

- **GitHub**: [Perfil Desarrollador](https://github.com/AlejandroMaturana)
- **LinkedIn**: [Perfil Profesional](https://www.linkedin.com/in/manugl86)
- **Focus**: Desarrollo de soluciones industriales y optimización de flujos con tecnología Full Stack.

---

> 📡 **Estado del Tablero**: Operacional. Si encuentras útil este proyecto o mejora tu flujo de trabajo, ¡dale una estrella ⭐ al repositorio!
