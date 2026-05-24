// routes/paisRoutes.mjs
// Define todas las rutas del recurso "paises".
// Aplica las validaciones antes de llegar al controlador.

import { Router } from 'express';
import * as ctrl from '../controllers/paisController.mjs';
import { reglasValidacionPais } from '../validations/paisValidations.mjs';

const router = Router();

// ── Rutas especiales (deben ir ANTES de /:id) ─────────────────────────────────
router.get('/exportar/csv', ctrl.exportarCSV);
router.post('/seed',        ctrl.seed);
router.get('/nuevo',        ctrl.nuevo);

// ── Rutas CRUD estándar ───────────────────────────────────────────────────────
router.get('/',                            ctrl.index);
router.post('/', reglasValidacionPais,     ctrl.crear);
router.get('/:id/editar',                  ctrl.editar);
router.put('/:id', reglasValidacionPais,   ctrl.actualizar);
router.delete('/:id',                      ctrl.eliminar);

export default router;
