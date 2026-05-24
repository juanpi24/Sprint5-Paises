// services/apiService.mjs
// Servicio de API externa: obtiene, filtra y limpia países hispanohablantes.
// Incluye caché en memoria configurable.

import axios from 'axios';

// ── Caché en memoria ──────────────────────────────────────────────────────────
let cache = { data: null, timestamp: null };
const CACHE_MS = (parseInt(process.env.CACHE_HOURS) || 24) * 3600 * 1000;

const isCacheValid = () => cache.data && cache.timestamp && (Date.now() - cache.timestamp < CACHE_MS);

// ── Campos a eliminar de cada país según consigna ─────────────────────────────
const CAMPOS_ELIMINAR = [
  'translations', 'tld', 'cca2', 'ccn3', 'cca3', 'cioc',
  'idd', 'altSpellings', 'car', 'coatOfArms', 'postalCode',
  'demonyms', 'independent', 'status', 'unMember', 'landlocked',
  'latlng', 'maps', 'fifa', 'startOfWeek', 'continents',
];

/**
 * Normaliza el objeto gini { "2019": 42.4 } → número del año más reciente.
 */
const normalizarGini = (giniObj) => {
  if (!giniObj || typeof giniObj !== 'object') return null;
  const años = Object.keys(giniObj).sort((a, b) => b - a);
  if (!años.length) return null;
  const val = parseFloat(giniObj[años[0]]);
  return isNaN(val) ? null : val;
};

/**
 * Convierte un país crudo de la API al esquema limpio del modelo.
 */
const mapearPais = (p, creador) => ({
  nombreOficial: p.name?.official || '',
  nombreComun:   p.name?.nativeName?.spa?.official || p.name?.common || '',
  capital:   Array.isArray(p.capital)   ? p.capital   : [],
  fronteras: Array.isArray(p.borders)   ? p.borders   : [],
  usos:     Array.isArray(p.timezones) ? p.timezones : [],
  area:      p.area      || 0,
  poblacion: p.population|| 0,
  gini:      normalizarGini(p.gini),
  region:    p.region    || 'Americas',
  subregion: p.subregion || '',
  banderas: {
    svg: p.flags?.svg || '',
    png: p.flags?.png || '',
    alt: p.flags?.alt || '',
  },
  creador,
});

/**
 * Obtiene y procesa los países hispanohablantes de América.
 * Flujo: fetch → filtrar por spa → limpiar campos → mapear al schema.
 */
export const obtenerPaisesHispanohablantes = async () => {
  if (isCacheValid()) {
    console.log('📦 Datos desde caché');
    return cache.data;
  }

  console.log('🌐 Consultando API externa...');
  const url     = process.env.API_URL || 'https://restcountries.com/v3.1/region/america';
  const creador = process.env.CREADOR || 'Estudiante';

  const { data } = await axios.get(url, { timeout: 10000 });

  // Filtrar solo países con español como idioma (clave "spa" en languages)
  const hispanohablantes = data.filter((p) => p.languages?.spa);
  console.log(`✅ ${hispanohablantes.length} países hispanohablantes encontrados`);

  const mapeados = hispanohablantes.map((p) => mapearPais(p, creador));

  cache.data      = mapeados;
  cache.timestamp = Date.now();

  return mapeados;
};

/** Invalida el caché para forzar recarga desde la API. */
export const invalidarCache = () => {
  cache.data = null;
  cache.timestamp = null;
};

/** Retorna el estado actual del caché. */
export const estadoCache = () => {
  if (!cache.timestamp) return { activo: false };
  const minutos = Math.round((CACHE_MS - (Date.now() - cache.timestamp)) / 60000);
  return { activo: isCacheValid(), expiraEn: `${minutos} minutos`, registros: cache.data?.length || 0 };
};
