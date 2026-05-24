// utils/seed.mjs
// Script independiente para poblar la base de datos desde la API externa.
// Ejecutar con: npm run seed

import 'dotenv/config';
import mongoose from 'mongoose';
import { obtenerPaisesHispanohablantes } from '../services/apiService.mjs';
import Pais from '../models/paisModel.mjs';

const seed = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a:', mongoose.connection.host);

    console.log('🌐 Obteniendo datos de la API...');
    const paises = await obtenerPaisesHispanohablantes();
    console.log(`📋 ${paises.length} países hispanohablantes encontrados`);

    let ok = 0, errores = 0;

    for (const p of paises) {
      if (!p.nombreOficial) { errores++; continue; }
      try {
        await Pais.findOneAndUpdate(
          { nombreOficial: p.nombreOficial },
          p,
          { upsert: true, new: true, runValidators: false }
        );
        console.log(`  ✓ ${p.nombreOficial}`);
        ok++;
      } catch (err) {
        console.warn(`  ✗ Error con "${p.nombreOficial}": ${err.message}`);
        errores++;
      }
    }

    console.log('\n──────────────────────────────');
    console.log(`✅ Importados: ${ok}  ❌ Errores: ${errores}`);
    console.log('──────────────────────────────');

  } catch (err) {
    console.error('❌ Error fatal:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

seed();
