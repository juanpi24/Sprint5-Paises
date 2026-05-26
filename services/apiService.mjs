// services/apiService.mjs
import axios from 'axios';

let cache = { data: null, timestamp: null }; 
// Convierte las horas en segundos y luego en milisegundos para facilitar el cálculo de expiración de la caché. Si no se define la variable de entorno, se usará un valor por defecto de 24 horas. (1hs = 3600 segundos, 24hs = 86400 segundos, 86400s * 1000ms/s = 86,400,000 ms) Unidad de tiempo estandar en js para manejar la expiración de la caché.
const CACHE_MS = (parseInt(process.env.CACHE_HOURS) || 24) * 3600 * 1000; //

// Función para verificar si la caché es válida. Retorna true si la caché tiene datos y no ha expirado, o false en caso contrario.  
const isCacheValid = () => cache.data && cache.timestamp && (Date.now() - cache.timestamp < CACHE_MS);


// normalizarGini es una función auxiliar para convertir el objeto gini de la API en un valor numérico único, tomando el año más reciente disponible. Si el formato no es el esperado o no hay datos, retorna null para evitar problemas en la base de datos.
const normalizarGini = (giniObj) => {

  // Validamos que giniObj sea un objeto antes de intentar acceder a sus propiedades. Si no es un objeto, retornamos null para evitar errores.
  if (!giniObj || typeof giniObj !== 'object') return null; 

  // Obtenemos los años disponibles en el objeto gini, los ordenamos de mayor a menor para tomar el más reciente, y luego intentamos convertir su valor a un número. Si no hay años o el valor no es un número válido, retornamos null.
  const años = Object.keys(giniObj).sort((a, b) => b - a); 

  // Si no hay años disponibles, retornamos null. Luego intentamos convertir el valor del año más reciente a un número. Si el valor no es un número válido, retornamos null para evitar problemas en la base de datos.
  if (!años.length) return null;   

  // Intentamos convertir el valor del año más reciente a un número. Si el valor no es un número válido, retornamos null para evitar problemas en la base de datos.
  const val = parseFloat(giniObj[años[0]]); 
  return isNaN(val) ? null : val; 
};


//  mapearPais es una función auxiliar para transformar los datos de la API externa al formato esperado por nuestra aplicación, aplicando validaciones activas para capitales y fronteras, y asegurando que cada país tenga un creador asignado para mantener la integridad de la colección compartida. Esto nos permite centralizar la lógica de transformación y validación de los datos externos en un solo lugar, facilitando el mantenimiento y la escalabilidad del código.
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


//  Método para obtener los países hispanohablantes desde la API externa, aplicando un filtro específico para la región de América y el idioma español, y utilizando una caché en memoria para optimizar el rendimiento y reducir las llamadas a la API externa. El servicio se encarga de mapear los datos al formato esperado por nuestra aplicación, aplicando validaciones activas para capitales y fronteras, y asegurando que cada país tenga un creador asignado para mantener la integridad de la colección compartida. Esto nos permite centralizar la lógica de obtención y transformación de los datos externos en un solo lugar, facilitando el mantenimiento y la escalabilidad del código. Si la caché es válida, se retornan los datos desde la caché; de lo contrario, se realiza la consulta a la API externa, se mapean los datos, se actualiza la caché y se retornan los datos mapeados. 
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

// Método para invalidar la caché manualmente, por ejemplo, después de una operación de actualización o eliminación que afecte a los países del creador actual. Esto asegura que la próxima vez que se soliciten los países desde la API externa, se obtendrán datos frescos y consistentes con las operaciones realizadas en la base de datos.
export const invalidarCache = () => {     
  cache.data = null;  
  cache.timestamp = null;   
};

// Método para obtener el estado actual de la caché, incluyendo si está activa, cuánto tiempo le queda antes de expirar y cuántos registros tiene. Esto puede ser útil para mostrar información de depuración o para monitorear el rendimiento de la aplicación.
export const estadoCache = () => {     
  if (!cache.timestamp) return { activo: false };   
  const minutos = Math.round((CACHE_MS - (Date.now() - cache.timestamp)) / 60000);    
  return { activo: isCacheValid(), expiraEn: `${minutos} minutos`, registros: cache.data?.length || 0 };
};