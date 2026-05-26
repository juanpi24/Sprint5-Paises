// utils/seed.mjs
import 'dotenv/config';
import mongoose from 'mongoose';
import * as apiService from '../services/apiService.mjs';
import * as paisService from '../services/paisService.mjs';

const adaptarDatosAPI = (p) => ({
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

const seed = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado con éxito a la base de datos');

    console.log('🌐 Obteniendo y procesando países desde la API...');
    const paises = await apiService.obtenerPaisesHispanohablantes();
    console.log(`📋 Se procesarán ${paises.length} países hispanohablantes`);

    let ok = 0, errores = 0;

    for (const p of paises) {
      if (!p.nombreOficial) { errores++; continue; }
      try {
        const datosLimpios = adaptarDatosAPI(p);

        // CORREGIDO: Llamamos a la capa de servicios para que ejecute el validador estructural
        // y asigne correctamente el discriminador de colección.
        await paisService.upsertByNombre(datosLimpios.nombreOficial, datosLimpios);
        console.log(`  ✓ ${datosLimpios.nombreOficial}`);
        ok++;
      } catch (err) {
        console.warn(`  ✗ Error con "${p.nombreOficial}": ${err.message}`);
        errores++;
      }
    }

    console.log('\n──────────────────────────────');
    console.log(`✅ Proceso finalizado. Importados/Actualizados: ${ok} | Errores: ${errores}`);
    console.log('──────────────────────────────');

  } catch (err) {
    console.error('❌ Error fatal en el script:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB de forma segura');
    process.exit(0);
  }
};

seed();