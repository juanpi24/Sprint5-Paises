// services/paisService.mjs
import * as repo from '../repositories/paisRepository.mjs';

//  Construye la consulta de MongoDB a partir de los filtros aplicados, asegurando que solo se traigan documentos del creador específico para mantener la integridad de la colección compartida.
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

//  Método para obtener todos los países con paginación y filtros aplicados, asegurando que solo se traigan documentos del creador específico para mantener la integridad de la colección compartida. El servicio se encarga de validar y limpiar los filtros y la paginación para proteger la base de datos. 
export const obtenerTodosPaginados = async (query) => {
  // El servicio se encarga de definir los valores por defecto de la búsqueda
  const creador = process.env.CREADOR;   
  const filtros = {
    nombre:    query.nombre    || '',
    capital:   query.capital   || '',
    subregion: query.subregion || '',
    pobMin:    query.pobMin    || '',
    pobMax:    query.pobMax    || '',
  };

  // El servicio valida los rangos de la paginación para proteger la base de datos
  const pagina = Math.max(1, parseInt(query.pagina, 10) || 1);
  const limite = Math.min(10, Math.max(5, parseInt(query.limite, 10) || 5));

  // Construimos la consulta con los filtros aplicados y el creador para asegurar que solo traemos los documentos relevantes para este servicio, protegiendo así la integridad de la colección compartida.
  const queryMongo   = buildQuery(filtros, creador);  

  // Calculamos el número de documentos a saltar para la paginación
  const skip    = (pagina - 1) * limite;     
  
  // Contamos el total de documentos que coinciden con el filtro para paginación 
  const total   = await repo.countAll(queryMongo);   

  // Obtenemos solo los países de la página actual con el filtro aplicado
  const paises  = await repo.findAll(queryMongo, skip, limite); 

  // Retornamos los países junto con la información de paginación y los filtros aplicados para que el controlador pueda renderizar la vista correctamente.
  return {
    paises, 
    total,   
    paginas: Math.ceil(total / limite), 
    filtrosAplicados: filtros,
    pagina,
    limite
  };
};

//  Método para obtener todos los países sin paginar, utilizado para cálculos de totales, exportación a CSV y obtención de subregiones únicas, asegurando que solo se traigan documentos del creador específico para mantener la integridad de la colección compartida. El servicio se encarga de validar y limpiar los filtros para proteger la base de datos.
export const obtenerTodosSinPaginar = async (query) => {
  // El servicio se encarga de definir los valores por defecto de la búsqueda
  const creador = process.env.CREADOR;   
  const filtros = {
    nombre:    query.nombre    || '',
    capital:   query.capital   || '',
    subregion: query.subregion || '',
    pobMin:    query.pobMin    || '',
    pobMax:    query.pobMax    || '',
  };
  // --- Aquí ejecuta tu query de Mongoose actual sin paginar --- 
  return repo.findAllNoPaginate(buildQuery(filtros, creador));
};

// Método para obtener un país por su ID, utilizado en la edición y detalle, asegurando que solo se accede a documentos del creador actual.
export const obtenerPorId = async (id) => repo.findById(id);

//  Métodos de creación, actualización y eliminación, asegurando que todas las operaciones de escritura se realicen con el creador correcto para mantener la integridad de la colección compartida.
export const crear = async (datos) => repo.create(datos);

// Método de actualización que recibe el ID del país a actualizar y los nuevos datos, asegurando que solo se actualicen documentos del creador actual.
export const actualizar = async (id, datos) => repo.updateById(id, datos);

// Método de eliminación que recibe el ID del país a eliminar, asegurando que solo se eliminen documentos del creador actual.
export const eliminar = async (id) => repo.deleteById(id);

// Método de upsert que recibe el nombre oficial del país a actualizar o crear y los datos, asegurando que solo se afecten documentos del creador actual.
export const upsertByNombre = async (nombreOficial, datos) => {
  return await repo.upsertByNombre(nombreOficial, datos);
};

// Método para calcular totales agregados como población total, área total y promedio de Gini, utilizando el método optimizado para obtener todos los países sin paginar con los filtros aplicados.
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


// Método para obtener la lista de subregiones únicas, utilizando el método optimizado para obtener todos los países sin paginar con los filtros aplicados.
export const obtenerSubregiones = async () => {
  const creador = process.env.CREADOR;
  return repo.findSubregiones(creador);
};