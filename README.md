# 📋 KanbanPro - Gestión de Proyectos de Alto Rendimiento

> Una solución Full Stack robusta y escalable para la gestión de flujos de trabajo mediante tableros Kanban, diseñada para centralizar la productividad con seguridad de grado empresarial y una arquitectura RESTful impecable.

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-Framework-000000?logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?logo=sequelize&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Security-000000?logo=json-web-tokens&logoColor=white)
![Handlebars](https://img.shields.io/badge/Handlebars-Templates-F0AD4E?logo=handlebars.js&logoColor=white)

</div>

---

## 🌟 Características de la Misión

KanbanPro no es solo un tablero de tareas; es un ecosistema de **gestión de datos relacionales** diseñado para ofrecer una experiencia fluida y segura:

- 🛡️ **Seguridad Blindada**: Implementación de **JWT (JSON Web Tokens)** para sesiones seguras y **bcryptjs** para el hasheo de credenciales, asegurando que los datos de los usuarios permanezcan privados.
- 🏗️ **Arquitectura RESTful**: API diseñada bajo los estándares de la industria para una comunicación limpia y desacoplada entre el cliente y el servidor.
- 📊 **Gestión de Datos Relacionales**: Modelado avanzado con **Sequelize**, permitiendo una estructura lógica de Tableros ➔ Listas ➔ Tarjetas con integridad referencial completa.
- 🎨 **Interfaz Dinámica**: Renderizado del lado del servidor (SSR) mediante **Handlebars**, optimizado para mostrar datos reales en tiempo de ejecución.
- 🧪 **Lógica de Negocio Centralizada**: Controladores robustos que gestionan toda la lógica CRUD, validando cada petición antes de interactuar con la base de datos PostgreSQL.

---

## 🛠️ Stack Tecnológico

La infraestructura técnica ha sido seleccionada para garantizar escalabilidad y rendimiento:

- **Backend**: **Node.js** & **Express** para un servidor ágil y modular.
- **Base de Datos**: **PostgreSQL** gestionada a través de **Sequelize ORM**.
- **Seguridad**: Autenticación asíncrona con **JWT** y almacenamiento de contraseñas seguro.
- **Frontend**: **HBS (Handlebars)** para plantillas dinámicas y **CSS3** para una UI profesional.
- **Entorno**: Gestión de variables de entorno mediante **dotenv**.

---

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL (Instalado y en ejecución)

### Pasos

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/AlejandroMaturana/KanbanPro.git
   ```
2. **Instala las dependencias**:
   ```bash
   pnpm install  # O npm install
   ```
3. **Configura el entorno**:
   Crea un archivo `.env` basado en `.env.example` con tus credenciales de base de datos y un secreto para JWT.
4. **Prepara la Base de Datos**:
   Ejecuta el script de "seeding" para llenar la base de datos con datos de prueba:
   ```bash
   pnpm run seed
   ```
5. **Inicia el Servidor**:
   ```bash
   pnpm run dev
   ```

---

## 📂 Estructura del Proyecto

```text
KanbanPro/
│
├── app.js              # Punto de entrada / Configuración de Express y Rutas
├── models/             # Definición de modelos Sequelize (User, Board, List, Card)
├── config/             # Configuración de la conexión a la Base de Datos
├── views/              # Plantillas Handlebars (.hbs) para la UI
├── public/             # Assets estáticos (Estilos, Imágenes, Scripts Cliente)
├── seed.js             # Script de inicialización de datos (Mock data)
└── .env.example        # Plantilla de variables de entorno
```

---

## 👤 Autor

**Alejandro Maturana (ManuGL)** – *Industrial Engineer & Full Stack Developer*

- **GitHub**: [Perfil Desarrollador](https://github.com/AlejandroMaturana)
- **LinkedIn**: [Perfil Profesional](https://www.linkedin.com/in/manuel-a-gonzalez-lozano-bb23a5242)
- **Status**: Disponible - Santiago / Biobío / Remoto 🇨🇱

---

> 📡 **Estado del Tablero**: En línea. Si este proyecto te inspira o ayuda en tu flujo de trabajo, ¡no olvides darle una estrella ⭐ al repositorio!
