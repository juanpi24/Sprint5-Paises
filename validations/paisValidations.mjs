// validations/paisValidations.mjs
// Reglas de validación con express-validator.
// Separadas en su propia carpeta, igual que en el proyecto de referencia.

import { body, validationResult } from 'express-validator';

/**
 * Reglas de validación para crear/editar un país.
 * Corresponden exactamente a las reglas del enunciado Sprint 5.
 */
export const reglasValidacionPais = [
  body('nombreOficial')
    .trim()   //  Elimina espacios al inicio y al final
    .notEmpty().withMessage('El nombre oficial es obligatorio')   // No puede estar vacío
    .isLength({ min: 3, max: 90 }).withMessage('El nombre oficial debe tener entre 3 y 90 caracteres'),  // Longitud entre 3 y 90 caracteres

  body('capital')
    .optional()  // Es opcional, pero si se proporciona debe cumplir las reglas
    .custom((value) => {    // Puede ser una cadena con comas o un array. En ambos casos, cada capital debe tener entre 3 y 90 caracteres.
      if (!value) return true;  // Si no se proporciona, no hay error
      const arr = Array.isArray(value)    // Si es un array, lo usamos tal cual; si es una cadena, la dividimos por comas
        ? value     //  Si es un array, lo usamos tal cual
        : (value || '').split(',').map((v) => v.trim()).filter(Boolean);    // Si es una cadena, la dividimos por comas, eliminamos espacios y filtramos vacíos 
      for (const c of arr) {   // Validamos cada capital individualmente
        if (c.length < 3 || c.length > 90)   // Si alguna capital no cumple la longitud, lanzamos un error
          throw new Error(`"${c}" Cada capital debe tener entre 3 y 90 caracteres`);
      }
      return true;
    }),

  body('fronteras')
    .optional()   // Es opcional, pero si se proporciona debe cumplir las reglas
    .custom((value) => {   // Puede ser una cadena con comas o un array. En ambos casos, cada frontera debe tener exactamente 3 letras mayúsculas.  
      if (!value) return true;  // Si no se proporciona, no hay error
      const arr = Array.isArray(value)   // Si es un array, lo usamos tal cual; si es una cadena, la dividimos por comas  
        ? value  // Si es un array, lo usamos tal cual
        : value.split(',').map((v) => v.trim()).filter(Boolean);   // Si es una cadena, la dividimos por comas, eliminamos espacios y filtramos vacíos
      for (const b of arr) {    // Validamos cada frontera individualmente
        if (!/^[A-Z]{3}$/.test(b))   // Si alguna frontera no tiene exactamente 3 letras mayúsculas, lanzamos un error
          throw new Error(`"${b}" inválido. Cada frontera debe tener exactamente 3 letras mayúsculas (ej: BRA)`);
      }
      return true;
    }),

  body('area')
    .notEmpty().withMessage('El área es obligatoria')   // No puede estar vacío
    .isFloat({ min: 0 }).withMessage('El área debe ser un número positivo'),  // Debe ser un número positivo

  body('poblacion')
    .notEmpty().withMessage('La población es obligatoria')   // No puede estar vacío
    .isInt({ min: 0 }).withMessage('La población debe ser un entero positivo'),   // Debe ser un entero positivo

  body('gini')
    .optional({ nullable: true, checkFalsy: true })   // Es opcional, pero si se proporciona debe cumplir las reglas. Permite null o valores falsy (como cadena vacía) para indicar que no se proporciona.
    .isFloat({ min: 0, max: 100 }).withMessage('El índice Gini debe estar entre 0 y 100'),   // Si se proporciona, debe ser un número entre 0 y 100
];

/**
 * Extrae errores de validación y los devuelve como objeto { campo: mensaje }.
 * Retorna null si no hay errores.
 */
export const extraerErrores = (req) => {  // Extrae los errores de validación del request usando validationResult de express-validator
  const resultado = validationResult(req);   
  if (resultado.isEmpty()) return null;   // Si no hay errores, devuelve null
  const errores = {};   //  Si hay errores, los formatea como un objeto { campo: mensaje }
  resultado.array().forEach((e) => { errores[e.path] = e.msg; });  // Recorre cada error y lo agrega al objeto errores con la estructura { campo: mensaje }
  return errores;  // Devuelve el objeto de errores
};
