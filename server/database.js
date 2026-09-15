const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ ADVERTENCIA: SUPABASE_URL o SUPABASE_KEY no están configuradas en las variables de entorno.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initDatabase() {
  console.log('🔄 Verificando tablas y usuario administrador en Supabase...');

  try {
    const adminPassword = process.env.ADMIN_PASSWORD || 'SGveinte26@';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    // Upsert admin silvia.gonzalez and silvia
    await supabase.from('users').upsert([
      { username: 'silvia.gonzalez', password_hash: adminHash, name: 'Silvia González', role: 'ADMIN', rate_per_hour: 0 },
      { username: 'silvia', password_hash: adminHash, name: 'Silvia González', role: 'ADMIN', rate_per_hour: 0 }
    ], { onConflict: 'username' });

    console.log('✅ Usuario Administrador Silvia González verificado');
  } catch (err) {
    console.error('⚠️ Nota al verificar base de datos en Supabase:', err.message);
  }
}

module.exports = {
  supabase,
  initDatabase
};
