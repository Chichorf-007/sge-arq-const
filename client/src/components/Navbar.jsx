import React from 'react';
import { LogOut, User, Building2, Crown } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/img/CUADRADO ESTE.png" 
            alt="SGE Logo" 
            style={{ height: '40px', width: '40px', objectFit: 'contain', borderRadius: '6px' }} 
          />
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#F8FAFC' }}>SGE ARQ-CONST</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 400 }}>
              Silvia González & Asociados
            </span>
          </div>
          <span className="brand-tag" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>v1.0</span>
        </div>

        <div className="user-badge">
          <div className={`role-pill ${isAdmin ? 'admin' : 'proyectista'}`}>
            {isAdmin ? <Crown size={14} /> : <User size={14} />}
            <span>{isAdmin ? 'Dirección (Silvia González)' : 'Proyectista'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user?.username}</span>
          </div>

          <button onClick={onLogout} className="btn btn-secondary btn-sm" title="Cerrar Sesión">
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
