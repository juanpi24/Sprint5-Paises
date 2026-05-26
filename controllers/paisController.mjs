// controllers/paisController.mjs
import * as paisService        from '../services/paisService.mjs';
import * as apiService         from '../services/apiService.mjs';
import { extraerErrores }      from '../validations/paisValidations.mjs';

//  Controladores para manejar las rutas relacionadas con países. Se encargan de recibir las solicitudes HTTP, validar los datos, llamar a los servicios correspondientes y renderizar las vistas o redirigir según corresponda. También manejan los mensajes flash para informar al usuario sobre el resultado de sus acciones (éxito o error).
const toArray = (valor) => {
  if (Array.isArray(valor)) return valor.filter(Boolean);
  if (!valor || String(valor).trim() === '') return [];
  return String(valor).split(',').map((v) => v.trim()).filter(Boolean);
};

// Construye un objeto con los datos limpios y formateados para crear o actualizar un país. Este método centraliza la lógica de transformación de los datos del formulario, asegurando que se apliquen las mismas reglas de validación y formato tanto en la creación como en la actualización, y que el campo "creador" se asigne correctamente desde las variables de entorno.
const buildDatos = (body) => ({
  nombreOficial: (body.nombreOficial || '').trim(),
  nombreComun:   (body.nombreComun   || '').trim(),
  capital:    toArray(body.capital),
  fronteras:  toArray(body.fronteras),
  usos:      toArray(body.usos),
  area:       parseFloat(body.area)    || 0,
  poblacion:  parseInt(body.poblacion) || 0,
  gini:       (body.gini !== '' && body.gini != null) ? parseFloat(body.gini) : null,
  region:     (body.region    || 'Americas').trim(),
  subregion:  (body.subregion || '').trim(),
  creador:    process.env.CREADOR || 'Estudiante',
});

// Helper interno para limpiar la respuesta que proviene de la API en el seed
const adaptarDatosAPI = (p) => ({
  nombreOficial: (p.nombreOficial || '').trim(),
  nombreComun:   (p.nombreComun   || '').trim(),
  capital:       p.capital,
  fronteras:     p.fronteras,
  usos:          p.usos,
  area:          p.area,
  poblacion:     p.poblacion,
  gini:          p.gini,
  region:        p.region,
  subregion:     p.subregion,
  banderas:      p.banderas,
  creador:       process.env.CREADOR || 'Estudiante'
});

export const index = async (req, res) => {
  try {

    // Construimos un objeto de filtros a partir de los parámetros de consulta (query) que vienen en la URL. Si no se especifica un filtro, se asigna una cadena vacía para evitar problemas en la construcción de la consulta a la base de datos y para que los campos del formulario de filtros se mantengan visibles y editables con su valor actual.
    const filtros = {  
      // El valor del filtro de nombre se mantiene en el campo después de enviar el formulario para mejorar la experiencia del usuario, permitiéndole ver y modificar su criterio de búsqueda fácilmente sin tener que reescribirlo desde cero cada vez.
      nombre:    req.query.nombre    || '',   
      capital:   req.query.capital   || '',
      subregion: req.query.subregion || '',
      pobMin:    req.query.pobMin    || '',
      pobMax:    req.query.pobMax    || '',
    };

    // Si no se especifica página, se muestra la primera página por defecto. Si el valor de página no es un número válido, también se muestra la primera página para evitar errores en la consulta a la base de datos.
    //const pagina = parseInt(req.query.pagina) || 1; 
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1); // CORREGIDO: Aseguramos que la página mínima sea 1 para evitar valores negativos o cero, lo que podría causar problemas en la paginación y en la consulta a la base de datos.

    // Si no se especifica límite, se muestran 5 países por página por defecto. Si el valor de límite no es un número válido, también se muestra el límite por defecto para evitar errores en la consulta a la base de datos.
    //const limite = parseInt(req.query.limite) || 5; 
   const limite = Math.min(10, Math.max(5, parseInt(req.query.limite, 10) || 5)); // CORREGIDO: Aseguramos que el límite esté entre 1 y 20 para evitar valores negativos, cero o excesivamente altos que podrían afectar el rendimiento de la aplicación y la experiencia del usuario.)



    // CORREGIDO: Llamamos a la capa de servicios para que ejecute el validador estructural
    // y asigne correctamente el discriminador de colección, además de aplicar los filtros de forma segura.
    const { paises, total, paginas } = await paisService.obtenerTodos(filtros, pagina, limite);  
    const totales     = await paisService.calcularTotales(filtros);
    const subregiones = await paisService.obtenerSubregiones();

    res.render('pages/index', {
      title: 'Dashboard — Países Hispanohablantes',
      paises, totales, subregiones, filtros, pagina, limite, total, paginas,
      cache: apiService.estadoCache(),
    });
  } catch (err) {
    req.flash('error', 'Error al cargar el dashboard');
    res.redirect('/paises');
  }
};

export const nuevo = (req, res) => {
  res.render('pages/form', { title: 'Agregar País', accion: 'crear', pais: {}, errores: {} });
};

export const crear = async (req, res) => {
  const errores = extraerErrores(req);
  if (errores) {
    return res.status(422).render('pages/form', { title: 'Agregar País', accion: 'crear', pais: req.body, errores });
  }
  try {
    const datos = buildDatos(req.body);
    await paisService.crear(datos);
    req.flash('success', `País "${datos.nombreOficial}" agregado correctamente`);
    res.redirect('/paises');
  } catch (err) {
    const errores = {};
    if (err.code === 11000) errores.nombreOficial = 'Ya existe un país con ese nombre oficial';
    else errores._general = err.message;
    res.status(422).render('pages/form', { title: 'Agregar País', accion: 'crear', pais: req.body, errores });
  }
};

export const editar = async (req, res) => {
  try {
    const pais = await paisService.obtenerPorId(req.params.id);
    if (!pais) {
      req.flash('error', 'País no encontrado');
      return res.redirect('/paises');
    }
    res.render('pages/form', { title: `Editar: ${pais.nombreComun || pais.nombreOficial}`, accion: 'editar', pais, errores: {} });
  } catch (err) {
    res.redirect('/paises');
  }
};

export const actualizar = async (req, res) => {
  const errores = extraerErrores(req);
  if (errores) {
    return res.status(422).render('pages/form', { title: 'Editar País', accion: 'editar', pais: { ...req.body, _id: req.params.id }, errores });
  }
  try {
    const datos = buildDatos(req.body);
    const actualizado = await paisService.actualizar(req.params.id, datos);
    if (!actualizado) {
      req.flash('error', 'País no encontrado');
      return res.redirect('/paises');
    }
    req.flash('success', `País "${datos.nombreOficial}" actualizado correctamente`);
    res.redirect('/paises');
  } catch (err) {
    const errores = {};
    if (err.code === 11000) errores.nombreOficial = 'Ya existe un país con ese nombre oficial';
    else errores._general = err.message;
    res.status(422).render('pages/form', { title: 'Editar País', accion: 'editar', pais: { ...req.body, _id: req.params.id }, errores });
  }
};

export const eliminar = async (req, res) => {
  try {
    const eliminado = await paisService.eliminar(req.params.id);
    if (!eliminado) req.flash('error', 'País no encontrado');
    else req.flash('success', `País "${eliminado.nombreOficial}" eliminado correctamente`);
  } catch (err) {
    req.flash('error', 'Error al eliminar el país');
  }
  res.redirect('/paises');
};

export const seed = async (req, res) => {
  try {
    apiService.invalidarCache();
    const paises = await apiService.obtenerPaisesHispanohablantes();

    let insertados = 0;
    for (const p of paises) {
      if (!p.nombreOficial) continue;
      const datosLimpios = adaptarDatosAPI(p);
      
      // CORREGIDO: Delegamos en el servicio en lugar de llamar al repositorio directamente
      await paisService.upsertByNombre(datosLimpios.nombreOficial, datosLimpios);
      insertados++;
    }
    req.flash('success', `Seed completado: ${insertados} países importados/actualizados`);
  } catch (err) {
    req.flash('error', `Error al importar datos: ${err.message}`);
  }
  res.redirect('/paises');
};

export const exportarCSV = async (req, res) => {
  try {
    const filtros = {
      nombre:    req.query.nombre    || '',
      capital:   req.query.capital   || '',
      subregion: req.query.subregion || '',
      pobMin:    req.query.pobMin    || '',
      pobMax:    req.query.pobMax    || '',
    };

    const paises = await paisService.obtenerTodosSinPaginar(filtros);
    const cabecera = ['Nombre Oficial','Nombre Común','Capital','Región','Subregión','Área (km²)','Población','Gini','usos Horarios','Creador'];
    const filas = paises.map((p) => [
      p.nombreOficial,
      p.nombreComun || '',
      (p.capital  || []).join(' / '),
      p.region    || '',
      p.subregion || '',
      p.area      || 0,
      p.poblacion || 0,
      p.gini != null ? p.gini : '',
      (p.usos || []).join(' / '),
      p.creador   || '',
    ]);

    const csv = [cabecera, ...filas]
      .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="paises-hispanohablantes.csv"');
    res.send('\uFEFF' + csv); 
  } catch (err) {
    req.flash('error', 'Error al exportar CSV');
    res.redirect('/paises');
  }
};