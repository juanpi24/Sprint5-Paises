// src/services/csvService.mjs

/**
 * Transforma una lista de documentos de países en un formato de texto CSV válido
 */
export const transformarAPaisesCSV = (paises) => {
  const cabecera = ['Nombre Oficial','Nombre Común','Capital','Región','Subregión','Área (km²)','Población','Gini','Usos Horarios','Creador'];
  
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

  return [cabecera, ...filas]
    .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
};