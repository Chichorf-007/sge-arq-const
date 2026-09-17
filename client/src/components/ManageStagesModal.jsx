import React, { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

export default function ManageStagesModal({ project, token, onClose }) {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [newSequence, setNewSequence] = useState(1);
  const [saving, setSaving] = useState(false);

  const fetchStages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${project.id}/stages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar las etapas de la obra');
      const data = await res.json();
      setStages(data);
      setNewSequence(data.length + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [project.id, token]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const handleSetCurrent = async (stageId) => {
    setError('');
    try {
      const res = await fetch(`/api/projects/${project.id}/stages/${stageId}/set-current`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al marcar la etapa como actual');
      await fetchStages();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (stage) => {
    if (!window.confirm(`¿Desea eliminar la etapa "${stage.name}"?`)) return;
    setError('');
    try {
      const res = await fetch(`/api/projects/${project.id}/stages/${stage.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar la etapa');
      await fetchStages();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddStage = async (e) => {
    e.preventDefault();
    setError('');
    if (!newName.trim()) return setError('El nombre de la etapa es obligatorio');

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName.trim(), sequence: newSequence })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la etapa');

      setNewName('');
      await fetchStages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <h3>🏗️ Gestionar Etapas — {project.name}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando etapas...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {stages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Esta obra todavía no tiene etapas cargadas.</p>
            ) : (
              stages.map((stage) => (
                <div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem 0.9rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--text-secondary)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      #{stage.sequence}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{stage.name}</strong>
                    {stage.is_current && (
                      <span style={{
                        background: 'rgba(37,99,235,0.15)',
                        color: '#2563EB',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        Etapa Actual
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {!stage.is_current && (
                      <button
                        onClick={() => handleSetCurrent(stage.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        Marcar como Actual
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(stage)}
                      className="btn btn-danger btn-sm"
                      title="Eliminar etapa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <form onSubmit={handleAddStage} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Nombre de la Nueva Etapa</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Fundaciones, Estructura, Terminaciones..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Orden / Secuencia</label>
            <input
              type="number"
              className="form-input"
              min="1"
              value={newSequence}
              onChange={(e) => setNewSequence(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Agregando...' : 'Agregar Etapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
