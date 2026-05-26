//==================================
// Archivo principal de la aplicación
//==================================
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/dbConfig.mjs';
import paisRoutes from './routes/paisRoutes.mjs';
import flashMiddleware from './middlewares/flashMiddleware.mjs';

// __dirname equivalente para ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Servidor
const app  = express();
const PORT = process.env.PORT || 3002;

// ── Parsear body de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Motor de vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // Archivo base del layout

// ── Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ── Sesiones (necesario para los flash messages)
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecreto123',
  resave: false,    // No guarda la sesión si no se ha modificado 
  saveUninitialized: true,   // Guarda la sesión aunque no se modifique (necesario para flash messages) 
}));

// ── Middleware global de log
const loggerMiddleware = (req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  next();
};
app.use(loggerMiddleware);

// ── Flash messages (mensajes entre redirecciones)
app.use(flashMiddleware);

// ── Method-override (PUT y DELETE desde formularios HTML)
app.use(methodOverride('_method'));

// ── Conexión a MongoDB
connectDB();

// ── Rutas
app.use('/paises', paisRoutes);

// ── Rutas adicionales
app.get('/', (req, res) => res.redirect('/paises'));
app.get('/about', (req, res) => res.render('pages/about', { title: 'Acerca de' }));

// ── 404
app.use((req, res) => {
  res.status(404).render('pages/404', {
    title: 'Página No Encontrada',
    url: req.originalUrl,
  });
});

// ── Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
