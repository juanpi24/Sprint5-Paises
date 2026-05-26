// services/apiService.mjs
import axios from 'axios';

let cache = { data: null, timestamp: null }; 
const CACHE_MS = (parseInt(process.env.CACHE_HOURS) || 24) * 3600 * 1000; 

const isCacheValid = () => cache.data && cache.timestamp && (Date.now() - cache.timestamp < CACHE_MS);

const normalizarGini = (giniObj) => {
  if (!giniObj || typeof giniObj !== 'object') return null; 
  const años = Object.keys(giniObj).sort((a, b) => b - a); 
  if (!años.length) return null;   
  const val = parseFloat(giniObj[años[0]]); 
  return isNaN(val) ? null : val; 
};

const mapearPais = (p, creador) => {
  // Validamos activamente que las capitales cumplan con la longitud (3 a 90)
  const capitalesFiltradas = (Array.isArray(p.capital) ? p.capital : [])
    .map(c => String(c).trim())
    .filter(c => c.length >= 3 && c.length <= 90);

  // Forzamos mayúsculas en fronteras y verificamos el formato de 3 letras (ej: ARG)
  const fronterasFiltradas = (Array.isArray(p.borders) ? p.borders : [])
    .map(b => String(b).trim().toUpperCase())
    .filter(b => /^[A-Z]{3}$/.test(b));

  return {   
    nombreOficial: (p.name?.official || '').trim(),  
    nombreComun:   (p.name?.nativeName?.spa?.official || p.name?.common || '').trim(),   
    capital:       capitalesFiltradas,   
    fronteras:     fronterasFiltradas,  
    usos:          Array.isArray(p.timezones) ? p.timezones : [], 
    area:          parseFloat(p.area) || 0,    
    poblacion:     parseInt(p.population) || 0,  
    gini:          normalizarGini(p.gini),  
    region:        (p.region || 'Americas').trim(),  
    subregion:     (p.subregion || '').trim(),  
    banderas: {
      svg: p.flags?.svg || '',
      png: p.flags?.png || '',
      alt: p.flags?.alt || '',
    },
    creador,
  };
};

export const obtenerPaisesHispanohablantes = async () => {   
  if (isCacheValid()) {     
    console.log('📦 Datos desde caché');
    return cache.data;   
  }

  console.log('🌐 Consultando API externa...');
  const url     = process.env.API_URL || 'https://restcountries.com/v3.1/region/america';
  const creador = process.env.CREADOR || 'Estudiante';

  const { data } = await axios.get(url, { timeout: 10000 });    
  const hispanohablantes = data.filter((p) => p.languages?.spa);    
  
  const mapeados = hispanohablantes.map((p) => mapearPais(p, creador));   
  cache.data      = mapeados;   
  cache.timestamp = Date.now();   

  return mapeados;     
};

export const invalidarCache = () => {     
  cache.data = null;  
  cache.timestamp = null;   
};

export const estadoCache = () => {     
  if (!cache.timestamp) return { activo: false };   
  const minutos = Math.round((CACHE_MS - (Date.now() - cache.timestamp)) / 60000);    
  return { activo: isCacheValid(), expiraEn: `${minutos} minutos`, registros: cache.data?.length || 0 };
};