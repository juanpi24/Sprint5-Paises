//=================================
//Configuración de la base de datos
//=================================

//Importar mongoose
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar las variables de entorno del archivo .env
dotenv.config();

//Conexión a la base de datos MongoDB
export async function connectDB() {
    try {
        // Usamos la variable definida en el .env
        const dbUri = process.env.MONGODB_URI;

        if (!dbUri) {
            throw new Error("La variable MONGODB_URI no está definida en el archivo .env");
        }

        await mongoose.connect(dbUri);
        console.log('✅ Conexión éxitosa a MongoDB');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error);
        process.exit(1);
    }
}