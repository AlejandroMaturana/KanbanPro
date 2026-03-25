## 💼 EF-M8 Proyecto integrador Sprint 3

### **Proyecto: "KanbanPro" - Kick-off del Sprint 3 (Fase Final)**

**Asunto:** 📧 ¡Fase 3 iniciada! Es hora de darle vida a KanbanPro con la API

**De:** David, Product Manager de KanbanPro **Para:** El Equipo de Desarrollo (Tú)

¡Hola equipo!

El trabajo realizado en la arquitectura de la base de datos durante el Sprint 2 ha sido impecable. Tenemos un modelo de datos sólido y bien probado, listo para ser el cerebro de nuestra aplicación.

Llegamos a la fase final y más visible: la construcción de la **API RESTful** y la conexión de todas las piezas. En este sprint, transformaremos KanbanPro de un conjunto de componentes desacoplados a un **Producto Mínimo Viable (MVP)** completamente funcional. Implementaremos la seguridad para que nuestros usuarios puedan registrarse e iniciar sesión, construiremos los endpoints para que la aplicación sea interactiva y, finalmente, conectaremos nuestra interfaz visual para que muestre datos reales.

Este es el sprint donde todo cobra sentido. Al finalizar, tendremos una aplicación funcional de la que estar orgullosos.

¡Vamos a por el lanzamiento!

Saludos, David

---

---

### **Resumen del Sprint 3: API RESTful, Seguridad y Funcionalidad Completa**

**Objetivo del Sprint:** Desarrollar la API RESTful completa para gestionar todos los recursos de la aplicación, implementar un sistema de autenticación seguro con JWT y, finalmente, conectar las vistas de Handlebars a la base de datos a través de esta nueva capa de API para lograr una aplicación totalmente funcional.

---

#### **Historias de Usuario y Técnicas a Implementar**

##### **HU-04: Gestión de Cuentas de Usuario**

- **Como** un nuevo usuario,
- **Quiero** poder registrarme en la aplicación con un email y contraseña,
- **Para** crear una cuenta personal y segura.
- **Como** un usuario ya registrado,
- **Quiero** poder iniciar sesión con mis credenciales,
- **Para** acceder a mis tableros de proyectos.

**Criterios de Aceptación:**

- ✅ Se deben instalar las dependencias `jsonwebtoken` y `bcryptjs`.
- ✅ Debe existir un endpoint `POST /api/auth/register` que cree un nuevo usuario y guarde su contraseña de forma segura (hasheada con `bcryptjs`).
- ✅ Debe existir un endpoint `POST /api/auth/login` que verifique las credenciales del usuario y, si son correctas, genere y devuelva un JSON Web Token (JWT).

---

##### **HT-05: Seguridad de la API**

- **Como** desarrollador,
- **Necesito** proteger los endpoints de la aplicación,
- **Para** asegurar que solo los usuarios autenticados puedan acceder y modificar sus propios datos.

**Criterios de Aceptación:**

- ✅ Se debe crear un **middleware** de autenticación que intercepte las peticiones.
- ✅ El middleware debe verificar la existencia y validez de un JWT en el header `Authorization: Bearer [token]`.
- ✅ Si el token es inválido o no existe, la API debe devolver un error `401` o `403`.
- ✅ Todas las rutas de gestión de datos (tableros, listas, tarjetas) deben estar protegidas por este middleware.

---

##### **HT-06: API RESTful para la Gestión de Proyectos**

- **Como** desarrollador de frontend (simulado),
- **Necesito** un conjunto de endpoints RESTful para gestionar los recursos de la aplicación,
- **Para** poder construir una interfaz de usuario interactiva y desacoplada.

**Criterios de Aceptación:**

- ✅ Se debe crear un router de Express para agrupar todas las rutas de la API (ej: `/api`).
- ✅ Se deben implementar todos los endpoints CRUD para los recursos principales:
  - **Tableros:** `GET`, `POST`, `PUT`, `DELETE` en `/api/tableros`.
  - **Listas:** `POST`, `PUT`, `DELETE` en `/api/tableros/:tableroId/listas`.
  - **Tarjetas:** `POST`, `PUT`, `DELETE` en `/api/listas/:listaId/tarjetas`.

- ✅ Todos estos endpoints deben usar los métodos de Sequelize para interactuar con la base de datos.
- ✅ La API debe ser probada exhaustivamente con un cliente como **Postman** o **Insomnia**.

---

##### **HU-07: Conexión de la Interfaz con Datos Reales**

- **Como** usuario con sesión iniciada,
- **Quiero** que el dashboard me muestre mis tableros, listas y tarjetas reales guardados en la base de datos,
- **Para** poder gestionar mi trabajo de forma efectiva.

**Criterios de Aceptación:**

- ✅ Las rutas de las vistas (ej: `GET /dashboard`) deben ser **modificadas**.
- ✅ Dentro de estas rutas, se debe llamar a la nueva lógica de los controladores de la API para obtener los datos desde la base de datos usando Sequelize.
- ✅ Los datos **reales** (ya no los simulados) deben ser pasados a las plantillas de Handlebars para su renderizado.

---

#### **Requisitos Técnicos**

- **Arquitectura:** API RESTful.
- **Seguridad:** Autenticación basada en JWT, hasheo de contraseñas con `bcryptjs`.
- **Herramientas:** Se requiere el uso de Postman, Insomnia o una herramienta similar para las pruebas de la API.

---

#### **Entregable**

- Un **repositorio público en GitHub** con el proyecto KanbanPro completamente funcional.
- La aplicación debe renderizar datos reales desde la base de datos y tener una API RESTful documentada (en un `README.md`) y protegida.
