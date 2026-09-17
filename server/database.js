const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
  throw new Error('Falta la variable de entorno SUPABASE_URL. Configúrala antes de iniciar el servidor.');
}

if (!SUPABASE_KEY) {
  throw new Error('Falta la variable de entorno SUPABASE_KEY. Configúrala antes de iniciar el servidor.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initDatabase() {
  console.log('🔄 Verificando tablas y usuario administrador en Supabase...');

  try {
    let adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      adminPassword = crypto.randomBytes(24).toString('base64');
      console.warn('⚠️ ADMIN_PASSWORD no está configurada. Se generó una contraseña aleatoria temporal para este arranque:');
      console.warn(`⚠️ ${adminPassword}`);
      console.warn('⚠️ Esta contraseña se pierde al reiniciar el proceso. Configura ADMIN_PASSWORD como variable de entorno permanente.');
    }
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
