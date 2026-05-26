// Capa de acceso a datos: todas las operaciones directas con Mongoose/MongoDB.
// Los servicios llaman a este repositorio; nunca usan el modelo directamente.

import Pais from '../models/paisModel.mjs';

// CRUD básico para Países, con opciones de paginación y filtros. También un método de upsert para el seed desde API.
/**
 * Busca todos los países con filtros y paginación opcionales.
 * @param {Object} query  - Filtro de Mongoose
 * @param {number} skip   - Documentos a saltar
 * @param {number} limite - Máximo de resultados
 */

// El método lean() devuelve objetos JavaScript simples en lugar de documentos Mongoose, lo que mejora el rendimiento cuando no se necesitan métodos de instancia.
export const findAll = async (query = {}, skip, limite) => { 
  // Combinamos la query que viene por parámetro con el filtro de tipoDoc
  // para asegurarnos de traer SOLO países de la colección 'Grupo-12'
  const filtroSeguro = { 
    ...query, 
    tipoDoc: 'Pais' 
  };
  
  // Ejecutamos la consulta con el filtro seguro, paginación y ordenados por nombreOficial.
  return await Pais.find(filtroSeguro)
  .sort({ nombreOficial: 1 })  // Ordena por nombreOficial ascendente para consistencia
  .skip(skip)  // skip y limit para paginación. skip se calcula en el servicio según la página actual y el límite por página.
  .limit(limite)  // limite para limitar la cantidad de resultados devueltos, también calculado en el servicio.
  .lean(); // lean() mejora el rendimiento si solo necesitamos datos sin métodos de instancia  
};

/**
 * Cuenta documentos según un filtro.
 */
export const countAll = async (query = {}) => {
  // Combinamos la query con el identificador del tipo de documento
  const filtroSeguro = { 
    ...query, 
    tipoDoc: 'Pais' 
  };
  return await Pais.countDocuments(filtroSeguro);
};

/**
 * Obtiene todos sin paginación (para CSV, totales, etc.)
 */
export const findAllNoPaginate = async (query = {}) => {
  const filtroSeguro = { 
    ...query, 
    tipoDoc: 'Pais' 
  };
  return await Pais.find(filtroSeguro).sort({ nombreOficial: 1 }).lean();
};


/**
 * Busca un país por su _id de MongoDB y asegura su tipo.
 */
export const findById = async (id) => {
  return await Pais.findOne({ 
    _id: id, 
    tipoDoc: 'Pais' 
  }).lean(); // lean() mejora el rendimiento al retornar un objeto plano de JS
};

/**
 * Crea un nuevo documento País.
 */
export const create = async (datos) => {

  // Unimos los datos que vienen del formulario con el tipo de documento. Esto asegura que cada documento creado a través de este método tenga el tipo correcto, manteniendo la integridad de la colección compartida.
  const pais = new Pais(
    { 
    ...datos, 
    tipoDoc: 'Pais' 
  });

  // .save() ejecuta las validaciones del esquema por defecto antes de guardar.  
  return pais.save();

};

/**
 * Actualiza un país por _id con runValidators activo y asegura su tipo.
 */
export const updateById = async (id, datos) => {
  return await Pais.findOneAndUpdate(
    { 
      _id: id, 
      tipoDoc: 'Pais' // Filtro de seguridad: solo actualiza si es un país
    }, 
    { 
      ...datos, 
      tipoDoc: 'Pais' // Nos aseguramos de que no puedan borrar o cambiar el tipoDoc en el body
    }, 
    { 
      returnDocument: 'after', // Alternativa moderna a new: true para obtener el documento actualizado
      runValidators: true, // Obligatorio para mantener la integridad de los datos al actualizar
      context: 'query'    // Necesario para que algunas validaciones funcionen correctamente en findOneAndUpdate
    }
  ).lean(); // Opcional: sumamos lean() si solo vas a enviar los datos de respuesta al cliente
};

/**
 * Elimina un país por _id.
 */
export const deleteById = async (id) => {
  return await Pais.findOneAndDelete({ 
    _id: id, 
    tipoDoc: 'Pais' 
  });
};

/**
 * Upsert por nombreOficial (para el seed desde API).
 * Mantiene la integridad dentro de la colección compartida.
 */
export const upsertByNombre = async (nombreOficial, datos) => {
  return await Pais.findOneAndUpdate(
    { 
      nombreOficial,
      tipoDoc: 'Pais' // Filtro: Evita pisar un superhéroe si coincide el nombre
    },
    { 
      ...datos, 
      tipoDoc: 'Pais' // Inyección obligatoria: Si se crea (upsert), nace como 'Pais'
    },
    { 
      upsert: true, // Si no encuentra un documento con ese nombreOficial, crea uno nuevo con esos datos. Si lo encuentra, lo actualiza.
      //new: true, 
      returnDocument: 'after', // Alternativa moderna a new: true para obtener el documento actualizado o creado
      runValidators: true  // 👈 CRUCIAL: Si viene un dato corrupto de la API, frena el proceso acá
    }
  );
};

/**
 * Devuelve los valores únicos de subregion filtrados por creador y tipo de documento.
 */
export const findSubregiones = async (creador) => {
  // Inicializamos el filtro asegurando que SOLO busque en documentos de tipo 'Pais'
  const filtro = { tipoDoc: 'Pais' };

  // Si se proporciona un creador específico, lo sumamos al filtro
  if (creador) {
    filtro.creador = creador;
  }

  // Ejecuta la consulta distina sobre el campo 'subregion' con el filtro seguro
  return await Pais.distinct('subregion', filtro);
};