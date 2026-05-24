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
export const findAll = async (query = {}, skip = 0, limite = 20) => {
  return Pais.find(query).sort({ nombreOficial: 1 }).skip(skip).limit(limite).lean();
};

/**
 * Cuenta documentos según un filtro.
 */
export const countAll = async (query = {}) => {
  return Pais.countDocuments(query);
};

/**
 * Obtiene todos sin paginación (para CSV, totales, etc.)
 */
export const findAllNoPaginate = async (query = {}) => {
  return Pais.find(query).sort({ nombreOficial: 1 }).lean();
};

/**
 * Busca un país por su _id de MongoDB.
 */
export const findById = async (id) => {
  return Pais.findById(id).lean();
};

/**
 * Crea un nuevo documento País.
 */
export const create = async (datos) => {
  const pais = new Pais(datos);
  return pais.save();
};

/**
 * Actualiza un país por _id con runValidators activo.
 */
export const updateById = async (id, datos) => {
  return Pais.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
};

/**
 * Elimina un país por _id.
 */
export const deleteById = async (id) => {
  return Pais.findByIdAndDelete(id);
};

/**
 * Upsert por nombreOficial (para el seed desde API).
 */
export const upsertByNombre = async (nombreOficial, datos) => {
  return Pais.findOneAndUpdate(
    { nombreOficial },
    datos,
    { upsert: true, new: true, runValidators: false }
  );
};

/**
 * Devuelve los valores únicos de subregion.
 */
export const findSubregiones = async (creador) => {
  // Filtra por creador para no mezclar subregiones de otros usuarios
  const filtro = creador ? { creador } : {};
  return Pais.distinct('subregion', filtro);
};
