// Controlador de países: recibe las peticiones HTTP, delega lógica
// al servicio y renderiza las vistas correspondientes.

import * as paisService        from '../services/paisService.mjs';
import * as apiService         from '../services/apiService.mjs';
import * as repo               from '../repositories/paisRepository.mjs';
import { extraerErrores }      from '../validations/paisValidations.mjs';

// ── Helper: parsea un campo string separado por comas → array ────────────────
//  Ejemplo: "Madrid, Barcelona" → ["Madrid", "Barcelona"]
const toArray = (valor) => {   // Si ya es un array (ej: capitales múltiples), lo devuelve filtrado
  if (Array.isArray(valor)) return valor.filter(Boolean);   // Si es string, lo parsea; si es vacío o nulo, devuelve array vacío
  if (!valor || String(valor).trim() === '') return [];   // Si es un string vacío o solo espacios, devuelve array vacío
  return String(valor).split(',').map((v) => v.trim()).filter(Boolean);  //   Si es un string con comas, lo divide, lo limpia y devuelve el array resultante
};

// ── Helper: arma el objeto de datos desde el body del formulario ─────────────
//  Aplica limpieza básica (trim) y conversión de tipos (números, arrays).
const buildDatos = (body) => ({
  nombreOficial: (body.nombreOficial || '').trim(),     // El nombre oficial es obligatorio, pero si no viene, se asigna string vacío para evitar errores de validación
  nombreComun:   (body.nombreComun   || '').trim(),   // El nombre común es opcional, pero si no viene, se asigna string vacío para evitar errores de validación  
  capital:    toArray(body.capital),   // El campo capital puede ser un string con comas o un array (en caso de múltiples capitales), se procesa con el helper toArray para obtener un array limpio
  fronteras:  toArray(body.fronteras),  // El campo fronteras puede ser un string con comas o un array (en caso de múltiples fronteras), se procesa con el helper toArray para obtener un array limpio
  usos:      toArray(body.usos),   // El campo usos puede ser un string con comas o un array (en caso de múltiples usos horarios), se procesa con el helper toArray para obtener un array limpio
  area:       parseFloat(body.area)    || 0,   // El área se convierte a número con parseFloat, si no es un número válido o no viene, se asigna 0 para evitar errores de validación
  poblacion:  parseInt(body.poblacion) || 0,   // La población se convierte a número entero con parseInt, si no es un número válido o no viene, se asigna 0 para evitar errores de validación
  gini:       (body.gini !== '' && body.gini != null) ? parseFloat(body.gini) : null,   //  El índice de Gini se convierte a número con parseFloat, pero si el campo viene vacío o nulo, se asigna null para diferenciarlo de un valor numérico válido (como 0)
  region:     (body.region    || 'Americas').trim(),   // La región se asigna con un valor por defecto de "Americas" si no viene en el formulario, y se limpia con trim para eliminar espacios al inicio o al final
  subregion:  (body.subregion || '').trim(),   // La subregión es opcional, pero si no viene, se asigna string vacío para evitar errores de validación, y se limpia con trim para eliminar espacios al inicio o al final  
  creador:    process.env.CREADOR || 'Estudiante',   // El campo creador se asigna con el valor de la variable de entorno CREADOR si está definida, o con "Estudiante" como valor por defecto si no lo está. Esto permite identificar quién creó o modificó el registro, y es útil para auditoría y seguimiento de cambios.
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /paises
 * Dashboard principal con listado, filtros, paginación y totales.
 */
export const index = async (req, res) => {
  try {
    const filtros = {    // Extrae los filtros de la query string, asignando valores por defecto si no vienen
      nombre:    req.query.nombre    || '',
      capital:   req.query.capital   || '',
      subregion: req.query.subregion || '',
      pobMin:    req.query.pobMin    || '',
      pobMax:    req.query.pobMax    || '',
    };
    const pagina = parseInt(req.query.pagina) || 1;   // La página actual se obtiene de la query string, se convierte a número entero con parseInt, y si no es un número válido o no viene, se asigna 1 como valor por defecto para mostrar la primera página
    const limite = parseInt(req.query.limite) || 5;   // El límite de resultados por página se obtiene de la query string, se convierte a número entero con parseInt, y si no es un número válido o no viene, se asigna 5 como valor por defecto para mostrar 5 países por página

    const { paises, total, paginas } = await paisService.obtenerTodos(filtros, pagina, limite); // El servicio devuelve el listado de países filtrado y paginado, junto con el total de resultados y el número total de páginas para la paginación
    const totales     = await paisService.calcularTotales(filtros); // El servicio calcula los totales (población, área, etc.) para los países que cumplen con los filtros aplicados, y devuelve un objeto con esos totales
    const subregiones = await paisService.obtenerSubregiones(); // El servicio obtiene la lista de subregiones disponibles en la base de datos, para mostrarla como opciones en el filtro de subregión del dashboard

    res.render('pages/index', {
      title: 'Dashboard — Países Hispanohablantes',
      paises,
      totales,
      subregiones,
      filtros,
      pagina,
      limite,
      total,
      paginas,
      cache: apiService.estadoCache(),
    });
  } catch (err) {
    console.error('Error en index:', err);
    req.flash('error', 'Error al cargar el dashboard');
    res.redirect('/paises');
  }
};

/**
 * GET /paises/nuevo
 * Muestra el formulario para agregar un nuevo país.
 */
export const nuevo = (req, res) => {
  res.render('pages/form', {   // Renderiza la vista del formulario, pasando un objeto vacío para el país y sin errores, ya que es un nuevo registro
    title: 'Agregar País',
    accion: 'crear', // La acción se utiliza en la vista para determinar si el formulario es para crear o editar, y ajustar el título y el endpoint al que se enviará el formulario
    pais:   {},   // El objeto país se inicializa como vacío, ya que no hay datos previos para mostrar en el formulario de creación
    errores: {}, // El objeto errores se inicializa como vacío, ya que no hay validaciones previas que mostrar en el formulario de creación
  });
};

/**
 * POST /paises
 * Procesa el formulario de creación.
 */
export const crear = async (req, res) => {
  const errores = extraerErrores(req); // Extrae los errores de validación del request utilizando la función extraerErrores, que procesa los resultados de las validaciones definidas en paisValidations.mjs y devuelve un objeto con los mensajes de error para cada campo que no cumple con las reglas de validación. Si no hay errores, devuelve un objeto vacío.
  if (errores) {    // Si hay errores de validación, se vuelve a renderizar el formulario con los datos ingresados por el usuario (req.body) y los mensajes de error correspondientes, para que el usuario pueda corregirlos. Se utiliza el status 422 Unprocessable Entity para indicar que la solicitud no pudo ser procesada debido a errores de validación.
    return res.status(422).render('pages/form', {
      title:  'Agregar País',
      accion: 'crear',    // La acción se mantiene como "crear" para que el formulario sepa que sigue siendo un nuevo registro, aunque haya errores de validación
      pais:   req.body,   // Se pasan los datos ingresados por el usuario (req.body) para que se muestren en el formulario y el usuario no tenga que volver a ingresarlos, facilitando la corrección de errores
      errores,  // Se pasan los mensajes de error extraídos para que se muestren junto a los campos correspondientes en el formulario, indicando al usuario qué debe corregir
    });
  }

  try {
    const datos = buildDatos(req.body);
    await paisService.crear(datos);
    req.flash('success', `País "${datos.nombreOficial}" agregado correctamente`);
    res.redirect('/paises');
  } catch (err) {
    const errores = {};
    if (err.code === 11000) {
      errores.nombreOficial = 'Ya existe un país con ese nombre oficial';
    } else {
      errores._general = err.message;
    }
    res.status(422).render('pages/form', {
      title:  'Agregar País',
      accion: 'crear',
      pais:   req.body,
      errores,
    });
  }
};

/**
 * GET /paises/:id/editar
 * Muestra el formulario de edición con datos actuales.
 */
export const editar = async (req, res) => {
  try {
    const pais = await paisService.obtenerPorId(req.params.id);
    if (!pais) {
      req.flash('error', 'País no encontrado');
      return res.redirect('/paises');
    }
    res.render('pages/form', {
      title:  `Editar: ${pais.nombreComun || pais.nombreOficial}`,
      accion: 'editar',
      pais,
      errores: {},
    });
  } catch (err) {
    req.flash('error', 'Error al cargar el formulario');
    res.redirect('/paises');
  }
};

/**
 * PUT /paises/:id
 * Procesa el formulario de edición.
 */
export const actualizar = async (req, res) => {
  const errores = extraerErrores(req);
  if (errores) {
    const pais = { ...req.body, _id: req.params.id };
    return res.status(422).render('pages/form', {
      title:  'Editar País',
      accion: 'editar',
      pais,
      errores,
    });
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

    res.status(422).render('pages/form', {
      title:  'Editar País',
      accion: 'editar',
      pais:   { ...req.body, _id: req.params.id },
      errores,
    });
  }
};

/**
 * DELETE /paises/:id
 * Elimina un país.
 */
export const eliminar = async (req, res) => {
  try {
    const eliminado = await paisService.eliminar(req.params.id);
    if (!eliminado) {
      req.flash('error', 'País no encontrado');
    } else {
      req.flash('success', `País "${eliminado.nombreOficial}" eliminado correctamente`);
    }
  } catch (err) {
    req.flash('error', 'Error al eliminar el país');
  }
  res.redirect('/paises');
};

/**
 * POST /paises/seed
 * Importa datos desde la API externa hacia MongoDB (upsert).
 */
export const seed = async (req, res) => {
  try {
    apiService.invalidarCache();
    const paises = await apiService.obtenerPaisesHispanohablantes();

    let insertados = 0;
    for (const p of paises) {
      if (!p.nombreOficial) continue;
      await repo.upsertByNombre(p.nombreOficial, p);
      insertados++;
    }

    req.flash('success', `Seed completado: ${insertados} países importados/actualizados`);
  } catch (err) {
    console.error('Error en seed:', err);
    req.flash('error', `Error al importar datos: ${err.message}`);
  }
  res.redirect('/paises');
};

/**
 * GET /paises/exportar/csv
 * Exporta el listado filtrado como archivo CSV (Desafío Avanzado #6).
 */
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
    res.send('\uFEFF' + csv); // BOM para que Excel lo abra bien
  } catch (err) {
    req.flash('error', 'Error al exportar CSV');
    res.redirect('/paises');
  }
};
