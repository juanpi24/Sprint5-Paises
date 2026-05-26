// Controladores para manejar las rutas relacionadas con países.
import * as paisService        from '../services/paisService.mjs';
import * as apiService         from '../services/apiService.mjs';
import { transformarAPaisesCSV } from '../services/csvService.mjs';
import { extraerErrores, formatearErrorDB } from '../validations/paisValidations.mjs';
import { buildDatos, adaptarDatosAPI } from '../utils/formatters.mjs';


export const mostrarLandingAgregar = async (req, res) => {
  res.render('pages/home', {
    title: 'Administrar Catálogo'
  });
};

// Controlador para mostrar el dashboard con la lista de países, filtros y paginación. Delegamos toda la lógica de negocio al servicio para mantener el controlador limpio y enfocado en manejar la petición y respuesta.
export const index = async (req, res) => {
  try {
    // Delegamos por completo la limpieza de filtros y paginación al servicio
    const { paises, total, paginas, filtrosAplicados, pagina, limite } = 
      await paisService.obtenerTodosPaginados(req.query);

    const totales     = await paisService.calcularTotales(filtrosAplicados);
    const subregiones = await paisService.obtenerSubregiones();

    res.render('pages/dashboard', {
      title: 'Dashboard — Países Hispanohablantes',
      paises,
      totales,
      subregiones,
      filtros: filtrosAplicados,
      pagina,
      limite,
      total,
      paginas,
      cache: apiService.estadoCache(),
    });
  } catch (err) {
    req.flash('error', 'Error al cargar el dashboard');
    res.redirect('/paises/');
  }
};

// Mostrar el formulario de creación 
export const mostrarFormularioCrear = async (req, res) => {
  res.render('pages/form', {
    title:   'Agregar País',
    accion:  'crear',
    pais:    {},
    errores: {},
  });
};

//  Controlador para manejar la creación de un nuevo país. Valida los datos, delega la creación al servicio y maneja los errores tanto de validación como de base de datos para proporcionar feedback al usuario.
export const crear = async (req, res) => {
  const erroresValidacion = extraerErrores(req);
  if (erroresValidacion) {
    return res.status(422).render('pages/form', {
      title:  'Agregar País',
      accion: 'crear',
      pais:   req.body,
      errores: erroresValidacion,
    });
  }

  const datos = buildDatos(req.body);
  try {
    await paisService.crear(datos);
    req.flash('success', `País "${datos.nombreOficial}" creado con éxito`);
    res.redirect('/paises/dashboard');
  } catch (err) {
    const erroresDB = formatearErrorDB(err);
    res.status(422).render('pages/form', {
      title:  'Agregar País',
      accion: 'crear',
      pais:   req.body,
      errores: erroresDB,
    });
  }
};

//  Controlador para mostrar el formulario de edición de un país existente. Delega la obtención del país al servicio y maneja los errores para proporcionar feedback al usuario.
export const mostrarFormularioEditar = async (req, res) => {
  try {
    const pais = await paisService.obtenerPorId(req.params.id);
    if (!pais) {
      req.flash('error', 'País no encontrado');
      return res.redirect('/paises/dashboard');
    }
    res.render('pages/form', {
      title:   `Editar País: ${pais.nombreComun}`,
      accion:  `editar`,
      pais,
      errores: {},
    });
  } catch (err) {
    req.flash('error', 'Error al cargar el formulario de edición');
    res.redirect('/paises/dashboard');
  }
};

// Controlador para manejar la actualización de un país existente. Valida los datos, delega la actualización al servicio y maneja los errores tanto de validación como de base de datos para proporcionar feedback al usuario. Asegura que solo se actualicen países del creador actual. 
export const actualizar = async (req, res) => {
  const erroresValidacion = extraerErrores(req);
  if (erroresValidacion) {
    return res.status(422).render('pages/form', {
      title:  'Editar País',
      accion: 'editar',
      pais: { ...req.body, _id: req.params.id }, // Aseguramos que el ID se mantenga en el objeto país para que el formulario pueda usarlo correctamente
      errores: erroresValidacion,
    });
  }

  const datos = buildDatos(req.body);
  try {
    const paisActualizado = await paisService.actualizar(req.params.id, datos);
    if (!paisActualizado) {
      req.flash('error', 'País no encontrado para actualizar');
      return res.redirect('/paises/dashboard');
    }
    req.flash('success', `País "${datos.nombreOficial}" actualizado con éxito`);
    res.redirect('/paises/dashboard');
  } catch (err) {
    const erroresDB = formatearErrorDB(err);
    res.status(422).render('pages/form', {
      title:  'Editar País',
      accion: 'editar',
      pais: { ...req.body, _id: req.params.id }, // Aseguramos que el ID se mantenga en el objeto país para que el formulario pueda usarlo correctamente
      errores: erroresDB,
    });
  }
};

//  Controlador para manejar la eliminación de un país existente. Delegamos la eliminación al servicio y manejamos los errores para proporcionar feedback al usuario. Asegura que solo se eliminen países del creador actual.
export const eliminar = async (req, res) => {
  try {
    const eliminado = await paisService.eliminar(req.params.id);
    if (!eliminado) req.flash('error', 'País no encontrado');
    else req.flash('success', 'País eliminado correctamente');
  } catch (err) {
    req.flash('error', `Error al eliminar el país: ${err.message}`);
  }
  res.redirect('/paises/dashboard');
};

// Controlador para manejar la importación de países desde la API externa. Delegamos la obtención y el upsert al servicio, y manejamos los errores para proporcionar feedback al usuario. Asegura que solo se afecten países del creador actual.
export const seed = async (req, res) => {
  try {
    const datosRaw = await apiService.obtenerPaisesHispanohablantes();
    let insertados = 0;

    for (const p of datosRaw) {
      const datosAdaptados = adaptarDatosAPI(p);
      const guardado = await paisService.upsertByNombre(datosAdaptados.nombreOficial, datosAdaptados);
      if (guardado) insertados++;
    }
    req.flash('success', `Seed completado: ${insertados} países importados/actualizados`);
  } catch (err) {
    req.flash('error', `Error al importar datos: ${err.message}`);
  }
  res.redirect('/paises/dashboard');
};

//  Controlador para manejar la exportación de países a un archivo CSV. Delegamos la obtención de los países al servicio y la transformación al servicio de CSV, y manejamos los errores para proporcionar feedback al usuario. Asegura que solo se exporten países del creador actual.
export const exportarCSV = async (req, res) => {
  try {
    const paises = await paisService.obtenerTodosSinPaginar(req.query);
    const csv = transformarAPaisesCSV(paises);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="paises-hispanohablantes.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) {
    req.flash('error', 'Error al exportar CSV');
    res.redirect('/paises/dashboard');
  }
};