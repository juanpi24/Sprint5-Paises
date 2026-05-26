// services/paisService.mjs
import * as repo from '../repositories/paisRepository.mjs';

const buildQuery = (filtros = {}, creador) => {
  const query = {};
  if (creador) query.creador = creador;  // Aseguramos que solo traemos documentos del creador específico (importante para el seed y seguridad general)

  if (filtros.nombre) {
    const regex = new RegExp(filtros.nombre, 'i');  // Búsqueda insensible a mayúsculas en nombreOficial o nombreComun
    query.$or = [{ nombreOficial: regex }, { nombreComun: regex }];
  }
  if (filtros.capital) {
    query.capital = { $regex: filtros.capital, $options: 'i' };     // Búsqueda insensible a mayúsculas en el array de capitales
  }
  if (filtros.subregion) {   
    query.subregion = { $regex: filtros.subregion, $options: 'i' };  // Búsqueda insensible a mayúsculas en subregión
  }
  if (filtros.pobMin || filtros.pobMax) {
    query.poblacion = {};
    if (filtros.pobMin) query.poblacion.$gte = parseInt(filtros.pobMin);  // Población mayor o igual al mínimo
    if (filtros.pobMax) query.poblacion.$lte = parseInt(filtros.pobMax);  // Población menor o igual al máximo
  }
  return query;    
};

export const obtenerTodos = async (filtros = {}, pagina, limite) => {    
  const creador = process.env.CREADOR;   

  // Construimos la consulta con los filtros aplicados y el creador para asegurar que solo traemos los documentos relevantes para este servicio, manteniendo la integridad de la colección compartida.
  const query   = buildQuery(filtros, creador);  

  // Calculamos el número de documentos a saltar para la paginación
  const skip    = (pagina - 1) * limite;     
  
  // Contamos el total de documentos que coinciden con el filtro para paginación 
  const total   = await repo.countAll(query);   

  // Obtenemos solo los países de la página actual con el filtro aplicado
  const paises  = await repo.findAll(query, skip, limite); 

  return { paises, total, pagina, limite, paginas: Math.ceil(total / limite) };     // Retornamos también la página actual, el límite por página y el total de páginas para facilitar la navegación en el frontend
};

export const obtenerTodosSinPaginar = async (filtros = {}) => {
  const creador = process.env.CREADOR;
  return repo.findAllNoPaginate(buildQuery(filtros, creador)); // 👈 Uso correcto de tu método optimizado
};

export const obtenerPorId = async (id) => repo.findById(id);
export const crear = async (datos) => repo.create(datos);
export const actualizar = async (id, datos) => repo.updateById(id, datos);
export const eliminar = async (id) => repo.deleteById(id);

// Nuevo método puente para el Seed
export const upsertByNombre = async (nombreOficial, datos) => {
  return await repo.upsertByNombre(nombreOficial, datos);
};

export const calcularTotales = async (filtros = {}) => {
  const paises = await obtenerTodosSinPaginar(filtros);
  const totalPoblacion = paises.reduce((acc, p) => acc + (p.poblacion || 0), 0);
  const totalArea      = paises.reduce((acc, p) => acc + (p.area      || 0), 0);
  const conGini        = paises.filter((p) => p.gini !== null && p.gini !== undefined);
  const promedioGini   = conGini.length
    ? parseFloat((conGini.reduce((acc, p) => acc + p.gini, 0) / conGini.length).toFixed(2))
    : null;

  return { totalPoblacion, totalArea, promedioGini, cantidadPaises: paises.length, cantidadConGini: conGini.length };
};

export const obtenerSubregiones = async () => {
  const creador = process.env.CREADOR;
  return repo.findSubregiones(creador);
};