# 🌎 Países Hispanohablantes — TP Final Sprint 5

Aplicación web MVC con **Node.js (ESModules)**, **Express 5** y **MongoDB** que consume la API de REST Countries, filtra países hispanohablantes y permite gestionarlos con CRUD completo.

---

## 🏗️ Estructura del proyecto

```
├── app.mjs                      ← Entry point principal
├── config/
│   └── dbConfig.mjs             ← Conexión MongoDB
├── controllers/
│   └── paisController.mjs       ← Maneja peticiones HTTP
├── middlewares/
│   └── flashMiddleware.mjs      ← Flash messages via sesión
├── models/
│   └── paisModel.mjs            ← Schema Mongoose + validaciones
├── repositories/
│   └── paisRepository.mjs       ← Acceso directo a MongoDB
├── routes/
│   └── paisRoutes.mjs           ← Definición de rutas
├── services/
│   ├── apiService.mjs           ← Consume API externa + caché
│   └── paisService.mjs          ← Lógica de negocio
├── validations/
│   └── paisValidations.mjs      ← Reglas express-validator
├── utils/
│   └── seed.mjs                 ← Script de carga inicial
├── views/
│   ├── layouts/
│   │   └── main.ejs             ← Layout base (express-ejs-layouts)
│   ├── pages/
│   │   ├── index.ejs            ← Dashboard
│   │   ├── form.ejs             ← Formulario crear/editar
│   │   ├── about.ejs            ← Acerca de
│   │   └── 404.ejs              ← Página no encontrada
│   └── partials/
│       ├── navbar.ejs
│       └── footer.ejs
├── public/
│   ├── css/styles.css
│   └── js/main.js
├── .env.example
└── package.json
```

---

## ⚙️ Instalación

### 1. Clonar e instalar

```bash
git clone <url-del-repo>
cd paises-v2
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editá `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/paises_hispanohablantes
CREADOR=Tu Nombre Real
CACHE_HOURS=24
SESSION_SECRET=cualquier_string_largo
```

### 3. Cargar datos desde la API

```bash
# Opción A — script de terminal
npm run seed

# Opción B — desde el dashboard
# Iniciá el servidor y hacé click en "🔄 Importar desde API"
```

### 4. Iniciar el servidor

```bash
npm run dev   # con nodemon (desarrollo)
npm start     # producción
```

Abrí: **http://localhost:3000**

---

## 🌐 Rutas

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/` | Redirige a `/paises` |
| GET | `/paises` | Dashboard con filtros y paginación |
| GET | `/paises/nuevo` | Formulario agregar país |
| POST | `/paises` | Crear país |
| GET | `/paises/:id/editar` | Formulario editar país |
| PUT | `/paises/:id` | Actualizar país |
| DELETE | `/paises/:id` | Eliminar país |
| POST | `/paises/seed` | Importar desde API |
| GET | `/paises/exportar/csv` | Exportar CSV |
| GET | `/about` | Acerca del proyecto |

---

## ✅ Validaciones

| Campo | Regla |
|-------|-------|
| `nombreOficial` | Requerido, 3–90 caracteres |
| `capital` | Cada elemento 3–90 caracteres |
| `fronteras` | Códigos de 3 letras mayúsculas (ej: `BRA`) |
| `area` | Número positivo |
| `poblacion` | Entero positivo |
| `gini` | Entre 0 y 100 (opcional) |

---

## ⭐ Funcionalidades avanzadas

1. **Búsqueda y filtrado** por nombre, capital, subregión y rango de población
2. **Paginación** del listado (configurable)
3. **Caché en memoria** del consumo de API (`CACHE_HOURS`)
4. **Fila de totales**: suma de población, área y promedio Gini
5. **Exportación CSV** del listado filtrado
6. **Flash messages** vía `express-session`

---

## 👤 Autor

**<%= CREADOR %>** — Trabajo Práctico Final Sprint 5 · Cursada Node.js + MongoDB
