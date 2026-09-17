const express = require('express');
const { supabase } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// mergeParams permite leer :projectId cuando este router se monta anidado bajo /api/projects/:projectId/stages
const router = express.Router({ mergeParams: true });

// GET /api/projects/:projectId/stages - List stages of a project (any authenticated user, read-only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: stages, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence', { ascending: true });

    if (error) throw error;

    res.json(stages || []);
  } catch (err) {
    console.error('Error en GET /projects/:projectId/stages:', err);
    res.status(500).json({ error: 'Error al obtener las etapas de la obra' });
  }
});

// POST /api/projects/:projectId/stages - Create a stage (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, sequence } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre de la etapa es obligatorio' });
    }

    const { data: inserted, error } = await supabase
      .from('project_stages')
      .insert({
        project_id: projectId,
        name: name.trim(),
        sequence: sequence !== undefined && sequence !== null ? parseInt(sequence) : 1
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Etapa creada exitosamente', stage: inserted });
  } catch (err) {
    console.error('Error en POST /projects/:projectId/stages:', err);
    res.status(500).json({ error: 'Error al crear la etapa' });
  }
});

// DELETE /api/projects/:projectId/stages/:stageId - Delete a stage (Admin only)
router.delete('/:stageId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { projectId, stageId } = req.params;

    const { error } = await supabase
      .from('project_stages')
      .delete()
      .eq('id', stageId)
      .eq('project_id', projectId);

    if (error) throw error;

    res.json({ message: 'Etapa eliminada correctamente' });
  } catch (err) {
    console.error('Error en DELETE /projects/:projectId/stages/:stageId:', err);
    res.status(500).json({ error: 'Error al eliminar la etapa' });
  }
});

// PUT /api/projects/:projectId/stages/:stageId/set-current - Mark a stage as the current one (Admin only)
router.put('/:stageId/set-current', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { projectId, stageId } = req.params;

    // Verificar que la etapa pertenezca al proyecto indicado
    const { data: targetStage, error: fetchError } = await supabase
      .from('project_stages')
      .select('id')
      .eq('id', stageId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !targetStage) {
      return res.status(404).json({ error: 'Etapa no encontrada para esta obra' });
    }

    // 1) Desmarcar todas las etapas actuales de la obra
    const { error: clearError } = await supabase
      .from('project_stages')
      .update({ is_current: false })
      .eq('project_id', projectId);

    if (clearError) throw clearError;

    // 2) Marcar la etapa indicada como actual
    const { data: updatedStage, error: setError } = await supabase
      .from('project_stages')
      .update({ is_current: true })
      .eq('id', stageId)
      .select('*')
      .single();

    if (setError) throw setError;

    res.json({ message: 'Etapa actual actualizada correctamente', stage: updatedStage });
  } catch (err) {
    console.error('Error en PUT /projects/:projectId/stages/:stageId/set-current:', err);
    res.status(500).json({ error: 'Error al actualizar la etapa actual' });
  }
});

module.exports = router;
