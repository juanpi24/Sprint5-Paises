// Expone mensajes flash (éxito/error) a todas las vistas.
// Los mensajes se guardan en sesión y se borran después de ser leídos una vez.

const flashMiddleware = (req, res, next) => {
  // Método para guardar un flash message en sesión
  req.flash = (tipo, mensaje) => {
    if (!req.session.flash) req.session.flash = {};
    req.session.flash[tipo] = mensaje;
  };

  // Pasar mensajes flash a las vistas y limpiarlos de sesión
  res.locals.flash = req.session.flash || {};
  req.session.flash = {};

  // currentPath para marcar el ítem activo en el navbar
  res.locals.currentPath = req.path;

  next();
};

export default flashMiddleware;
