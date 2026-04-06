# 📋 KanbanPro - Gestión de Proyectos de Alto Rendimiento

> Una solución Full Stack robusta y avanzada para la gestión de flujos de trabajo mediante tableros Kanban interactivos. Diseñada para centralizar la productividad con seguridad de grado empresarial y una arquitectura RESTful moderna.

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

- 🖱️ **Interactividad Drag & Drop**: Movimiento fluido de tareas entre columnas mediante **SortableJS**, sincronizando el estado con la base de datos en tiempo real sin recargar la página.
- 🚦 **Gestión de Prioridades**: Sistema de etiquetas dinámicas (**Urgente, Alta, Media, Baja**) con códigos de colores para una jerarquización visual inmediata del trabajo.
- 🗑️ **Control Total de Tareas**: Capacidad para crear, editar y eliminar tareas directamente desde el dashboard.
- 🛡️ **Seguridad Blindada**: Autenticación persistente con **JWT (JSON Web Tokens)** en cookies y haseho de contraseñas con **bcryptjs**.
- 🏗️ **Arquitectura RESTful & SSR**: API robusta combinada con renderizado dinámico (Server Side Rendering) mediante **Handlebars** para un rendimiento óptimo.
- 📊 **Modelado Relacional de Datos**: Estructura íntegra de Usuarios ➔ Tableros ➔ Listas ➔ Tarjetas utilizando **Sequelize ORM**.

---

## 🛠️ Stack Tecnológico

La infraestructura técnica garantiza escalabilidad, seguridad y una UX moderna:

- **Backend**: **Node.js** & **Express** con una arquitectura de rutas modular.
- **Base de Datos**: **PostgreSQL** para persistencia de datos crítica.
- **ORM**: **Sequelize** con migraciones automáticas mediante sincronización por alteración de esquema (`alter: true`).
- **Seguridad**: Gestión de identidad con JWT y protección ante XSS mediante cookies `httpOnly`.
- **Frontend**: **HBS (Handlebars)**, **Vanilla CSS** y **SortableJS** para la lógica de arrastre.
- **Entorno**: Configuración centralizada mediante `dotenv`.

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

---

## 📂 Estructura del Proyecto

```text
KanbanPro/
│
├── app.js              # Servidor Express, Middlewares y Endpoints API/Vistas
├── models/             # Definición de Esquemas (Usuario, Tablero, Lista, Tarjeta)
├── config/             # Configuración de base de datos (Sequelize instance)
├── views/              # Plantillas Handlebars para renderizado SSR
├── public/
│   ├── js/             # Lógica cliente (Interacción Drag & Drop, API Fetch)
│   └── scripts/        # Otros scripts de utilidad
├── seed.js             # Generador de datos industriales (Mock data)
└── README.md           # Documentación técnica
```

---

## 👤 Autor

**Alejandro Maturana (ManuGL)** – _Industrial Engineer & Full Stack Developer_

- **GitHub**: [Perfil Desarrollador](https://github.com/AlejandroMaturana)
- **LinkedIn**: [Perfil Profesional](https://www.linkedin.com/in/manuel-a-gonzalez-lozano-bb23a5242)
- **Focus**: Desarrollo de soluciones industriales y optimización de flujos con tecnología Full Stack.

---

> 📡 **Estado del Tablero**: Operacional. Si encuentras útil este proyecto o mejora tu flujo de trabajo, ¡dale una estrella ⭐ al repositorio!
