// models/paisModel.mjs
// Schema de Mongoose para países hispanohablantes.
// Solo persiste las propiedades necesarias + "creador".

import mongoose from 'mongoose';

const paisSchema = new mongoose.Schema(
  {
    // Nombre oficial (ej: "República Argentina")
    nombreOficial: {
      type: String,
      required: [true, 'El nombre oficial es obligatorio'],
      minlength: [3, 'El nombre oficial debe tener al menos 3 caracteres'],
      maxlength: [90, 'El nombre oficial no puede superar 90 caracteres'],
      unique: true, // No puede haber dos países con el mismo nombre
      trim: true,   // Elimina espacios al principio y al final
    },
    // Nombre común en español (ej: "Argentina")
    nombreComun: {
      type: String,
      trim: true,
      default: '',
    },
    // Capitales (array, ej: ["Buenos Aires"])
    capital: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((c) => c.length >= 3 && c.length <= 90),
        message: 'Cada capital debe tener entre 3 y 90 caracteres',
      },
    },
    // Códigos de países fronterizos (ej: ["BRA", "CHL"])
    fronteras: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((b) => /^[A-Z]{3}$/.test(b)),
        message: 'Cada código de frontera debe tener exactamente 3 letras mayúsculas',
      },
    },
    // Superficie en km²
    area: {
      type: Number,
      required: [true, 'El área es obligatoria'],
      min: [0, 'El área debe ser un número positivo'],
    },
    // Población
    poblacion: {
      type: Number,
      required: [true, 'La población es obligatoria'],
      min: [0, 'La población debe ser un entero positivo'],
    },
    // Índice Gini (0–100, opcional)
    gini: {
      type: Number,
      min: [0, 'El índice Gini debe estar entre 0 y 100'],
      max: [100, 'El índice Gini debe estar entre 0 y 100'],
      default: null,    // Opcional: puede no tener valor
    },
    // Usos horarios
    usos: {
      type: [String],
      default: [],
    },
    // Región geográfica
    region: {
      type: String,
      default: 'Americas',
      trim: true,
    },
    // Subregión
    subregion: {
      type: String,
      default: '',
      trim: true,
    },
    // Banderas
    banderas: {
      svg: { type: String, default: '' },
      png: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    // Campo creador (obligatorio, valor desde variable de entorno)
    creador: {
      type: String,
      required: [true, 'El campo creador es obligatorio'],
      trim: true,
    },
  },
  { timestamps: true }  // Agrega createdAt y updatedAt automáticamente
);

const Pais = mongoose.model('Pais', paisSchema,'Grupo-12'); 

export default Pais;
