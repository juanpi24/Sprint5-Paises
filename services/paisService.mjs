// services/paisService.mjs
// Capa de lógica de negocio: orquesta operaciones entre el controlador
// y el repositorio. Aplica filtros, paginación y cálculo de totales.

import * as repo from '../repositories/paisRepository.mjs';

/**
 * Construye el objeto query de Mongoose a partir de los filtros del formulario.
 * SIEMPRE incluye el creador para aislar los datos de cada usuario.
 * @param {Object} filtros  - Filtros de búsqueda del dashboard
 * @param {string} creador  - Valor de process.env.CREADOR
 */
const buildQuery = (filtros = {}, creador) => {
  const query = {};

  // ── Filtro obligatorio por creador ──────────────────────────────────────
  // Garantiza que cada usuario solo vea SUS países, aunque compartan
  // la misma base de datos y colección con otros compañeros.
  if (creador) {
    query.creador = creador;
  }

  if (filtros.nombre) {
    const regex = new RegExp(filtros.nombre, 'i');
    query.$or = [
      { nombreOficial: regex },
      { nombreComun: regex },
    ];
  }
  if (filtros.capital) {
    query.capital = { $regex: filtros.capital, $options: 'i' };
  }
  if (filtros.subregion) {
    query.subregion = { $regex: filtros.subregion, $options: 'i' };
  }
  if (filtros.pobMin || filtros.pobMax) {
    query.poblacion = {};
    if (filtros.pobMin) query.poblacion.$gte = parseInt(filtros.pobMin);
    if (filtros.pobMax) query.poblacion.$lte = parseInt(filtros.pobMax);
  }

  return query;
};

/**
 * Obtiene países paginados con filtros opcionales, aislados por creador.
 */
export const obtenerTodos = async (filtros = {}, pagina = 1, limite = 20) => {
  const creador = process.env.CREADOR;
  const query   = buildQuery(filtros, creador);
  const skip    = (pagina - 1) * limite;
  const total   = await repo.countAll(query);
  const paises  = await repo.findAll(query, skip, limite);
  return { paises, total, pagina, limite, paginas: Math.ceil(total / limite) };
};

/**
 * Obtiene todos los países sin paginar (para CSV y totales), aislados por creador.
 */
export const obtenerTodosSinPaginar = async (filtros = {}) => {
  const creador = process.env.CREADOR;
  return repo.findAllNoPaginate(buildQuery(filtros, creador));
};

/**
 * Obtiene un país por ID.
 * No filtra por creador porque el ID ya es único; el controlador
 * puede verificar si el país pertenece al creador si fuera necesario.
 */
export const obtenerPorId = async (id) => repo.findById(id);

/**
 * Crea un nuevo país.
 */
export const crear = async (datos) => repo.create(datos);

/**
 * Actualiza un país existente.
 */
export const actualizar = async (id, datos) => repo.updateById(id, datos);

/**
 * Elimina un país.
 */
export const eliminar = async (id) => repo.deleteById(id);

/**
 * Calcula totales: suma de población, área y promedio Gini.
 * Usa los mismos filtros + creador para que los totales sean coherentes
 * con lo que se muestra en el dashboard.
 */
export const calcularTotales = async (filtros = {}) => {
  const paises = await obtenerTodosSinPaginar(filtros);

  const totalPoblacion = paises.reduce((acc, p) => acc + (p.poblacion || 0), 0);
  const totalArea      = paises.reduce((acc, p) => acc + (p.area      || 0), 0);
  const conGini        = paises.filter((p) => p.gini !== null && p.gini !== undefined);
  const promedioGini   = conGini.length
    ? parseFloat((conGini.reduce((acc, p) => acc + p.gini, 0) / conGini.length).toFixed(2))
    : null;

  return {
    totalPoblacion,
    totalArea,
    promedioGini,
    cantidadPaises: paises.length,
    cantidadConGini: conGini.length,
  };
};

/**
 * Devuelve las subregiones únicas para el filtro del dashboard,
 * filtradas por creador para no mostrar subregiones ajenas.
 */
export const obtenerSubregiones = async () => {
  const creador = process.env.CREADOR;
  return repo.findSubregiones(creador);
};
