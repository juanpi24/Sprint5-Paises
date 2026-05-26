import { toArray } from '../validations/paisValidations.mjs';

/**
 * Mapea y limpia los datos provenientes de un formulario web (req.body)
 */
export const buildDatos = (body) => ({
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

/**
 * Adapta y filtra los datos estructurados provenientes de la API externa
 *  para que sean compatibles con nuestro modelo de datos y cumplan con las validaciones necesarias antes de ser almacenados en la base de datos.
 */
export const adaptarDatosAPI = (p) => ({
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