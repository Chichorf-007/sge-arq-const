const express = require('express');
const { supabase } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de pagos son exclusivas del Administrador (Silvia González):
// manejan dinero real y el detalle de liquidación de los proyectistas.
router.use(authenticateToken, requireAdmin);

// POST /api/payments - Generate a payment (settlement) for a user's week and lock the underlying records
router.post('/', async (req, res) => {
  try {
    const { user_id, week_start, week_end } = req.body;

    if (!user_id || !week_start || !week_end) {
      return res.status(400).json({ error: 'user_id, week_start y week_end son obligatorios' });
    }

    // Traer el rate_per_hour vigente del usuario directamente desde la base (nunca confiar en el cliente)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, rate_per_hour')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Proyectista no encontrado' });
    }

    const rate = parseFloat(user.rate_per_hour) || 0;

    // Timesheets de esa semana que todavía no fueron pagados
    const { data: timesheets, error: timesheetsError } = await supabase
      .from('timesheets')
      .select('*')
      .eq('user_id', user_id)
      .gte('work_date', week_start)
      .lte('work_date', week_end)
      .is('payment_id', null);

    if (timesheetsError) throw timesheetsError;

    // Gastos reembolsados de esa semana que todavía no fueron pagados
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'REIMBURSED')
      .gte('expense_date', week_start)
      .lte('expense_date', week_end)
      .is('payment_id', null);

    if (expensesError) throw expensesError;

    const total_hours = (timesheets || []).reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
    const total_hours_cost = Math.round(total_hours * rate * 100) / 100;
    const total_expenses_amount = (expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const grand_total = Math.round((total_hours_cost + total_expenses_amount) * 100) / 100;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id,
        week_start,
        week_end,
        total_hours,
        total_hours_cost,
        total_expenses_amount,
        grand_total,
        paid_by: req.user.id
      })
      .select('*')
      .single();

    if (paymentError) {
      if (paymentError.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un pago registrado para este proyectista en esta semana.' });
      }
      throw paymentError;
    }

    const timesheetIds = (timesheets || []).map((t) => t.id);
    const expenseIds = (expenses || []).map((e) => e.id);

    if (timesheetIds.length > 0) {
      const { error: updateTimesheetsError } = await supabase
        .from('timesheets')
        .update({ payment_id: payment.id })
        .in('id', timesheetIds);
      if (updateTimesheetsError) throw updateTimesheetsError;
    }

    if (expenseIds.length > 0) {
      const { error: updateExpensesError } = await supabase
        .from('expenses')
        .update({ payment_id: payment.id })
        .in('id', expenseIds);
      if (updateExpensesError) throw updateExpensesError;
    }

    res.status(201).json({
      message: 'Pago registrado exitosamente',
      payment,
      timesheets: (timesheets || []).map((t) => ({ ...t, payment_id: payment.id })),
      expenses: (expenses || []).map((e) => ({ ...e, payment_id: payment.id }))
    });
  } catch (err) {
    console.error('Error en POST /payments:', err);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
});

// GET /api/payments?user_id= - Payment history, optionally filtered by user
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = supabase
      .from('payments')
      .select(`
        *,
        users:user_id ( id, name )
      `)
      .order('week_start', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: payments, error } = await query;
    if (error) throw error;

    res.json(payments || []);
  } catch (err) {
    console.error('Error en GET /payments:', err);
    res.status(500).json({ error: 'Error al obtener el historial de pagos' });
  }
});

// GET /api/payments/:id - Full detail of a payment (to reprint the receipt exactly as it was)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        users:user_id ( id, name )
      `)
      .eq('id', id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const { data: timesheets, error: timesheetsError } = await supabase
      .from('timesheets')
      .select('*')
      .eq('payment_id', id)
      .order('work_date', { ascending: true });

    if (timesheetsError) throw timesheetsError;

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('payment_id', id)
      .order('expense_date', { ascending: true });

    if (expensesError) throw expensesError;

    res.json({ payment, timesheets: timesheets || [], expenses: expenses || [] });
  } catch (err) {
    console.error('Error en GET /payments/:id:', err);
    res.status(500).json({ error: 'Error al obtener el detalle del pago' });
  }
});

module.exports = router;
