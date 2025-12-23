-- ============================================================================
-- Migración 032: Sistema Financiero Avanzado
-- ============================================================================
-- Funciones y vistas para análisis financiero completo:
-- - Análisis de rentabilidad por servicio
-- - Análisis de rentabilidad por cliente
-- - Proyecciones de flujo de caja avanzadas
-- - Comparativas mensuales/anuales con porcentajes
-- - Métricas de rendimiento financiero
-- ============================================================================

-- ============================================================================
-- 1. Vista: Rentabilidad por Servicio
-- ============================================================================
DROP VIEW IF EXISTS public.service_profitability CASCADE;
CREATE VIEW public.service_profitability
WITH (security_invoker = true)
AS
SELECT 
  s.id AS service_id,
  s.name AS service_name,
  s.base_price,
  s.cost_price,
  COALESCE(s.base_price - s.cost_price, 0) AS unit_profit,
  CASE 
    WHEN s.base_price > 0 THEN 
      ((s.base_price - COALESCE(s.cost_price, 0)) / s.base_price) * 100
    ELSE 0
  END AS margin_percent,
  COUNT(DISTINCT qs.quote_id) AS times_sold,
  SUM(qs.quantity) AS total_quantity_sold,
  SUM(qs.final_price * qs.quantity) AS total_revenue,
  SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity) AS total_profit,
  AVG(qs.final_price) AS average_sale_price,
  MIN(qs.final_price) AS min_sale_price,
  MAX(qs.final_price) AS max_sale_price
FROM services s
LEFT JOIN quote_services qs ON qs.service_id = s.id
LEFT JOIN quotes q ON q.id = qs.quote_id AND q.status = 'APPROVED'
GROUP BY s.id, s.name, s.base_price, s.cost_price;

-- ============================================================================
-- 2. Vista: Rentabilidad por Cliente
-- ============================================================================
DROP VIEW IF EXISTS public.client_profitability CASCADE;
CREATE VIEW public.client_profitability
WITH (security_invoker = true)
AS
SELECT 
  c.id AS client_id,
  c.name AS client_name,
  c.email,
  COUNT(DISTINCT q.id) AS total_quotes,
  COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'APPROVED') AS confirmed_quotes,
  SUM(q.total_amount) FILTER (WHERE q.status = 'APPROVED') AS total_sales,
  SUM(
    COALESCE((
      SELECT SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity)
      FROM quote_services qs
      JOIN services s ON s.id = qs.service_id
      WHERE qs.quote_id = q.id
    ), 0)
  ) FILTER (WHERE q.status = 'APPROVED') AS total_profit,
  AVG(q.total_amount) FILTER (WHERE q.status = 'APPROVED') AS average_quote_value,
  SUM(COALESCE(pp.amount, 0)) FILTER (WHERE q.status = 'APPROVED') AS total_paid,
  SUM(q.total_amount - COALESCE((
    SELECT SUM(pp2.amount) FROM partial_payments pp2 WHERE pp2.quote_id = q.id
  ), 0)) FILTER (WHERE q.status = 'APPROVED') AS total_pending,
  MAX(q.created_at) AS last_quote_date
FROM clients c
LEFT JOIN quotes q ON q.client_id = c.id
LEFT JOIN partial_payments pp ON pp.quote_id = q.id
GROUP BY c.id, c.name, c.email;

-- ============================================================================
-- 3. Función: Proyección de Flujo de Efectivo Avanzada
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_advanced_cash_flow_projection(
  p_days_ahead INTEGER DEFAULT 90
)
RETURNS TABLE(
  date DATE,
  day_type TEXT,
  deposits_received NUMERIC,
  payments_received NUMERIC,
  total_inflow NUMERIC,
  payments_due NUMERIC,
  deposits_due NUMERIC,
  total_outflow NUMERIC,
  net_flow NUMERIC,
  cumulative_balance NUMERIC
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start_date DATE := CURRENT_DATE;
  v_end_date DATE := CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL;
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(v_start_date, v_end_date, '1 day'::INTERVAL)::DATE AS date
  ),
  daily_flows AS (
    SELECT 
      ds.date,
      CASE 
        WHEN EXTRACT(DOW FROM ds.date) IN (0, 6) THEN 'weekend'
        ELSE 'weekday'
      END AS day_type,
      -- Depósitos recibidos (ya pagados)
      COALESCE(SUM(pp.amount) FILTER (
        WHERE pp.is_deposit = TRUE 
        AND DATE(pp.payment_date) = ds.date
      ), 0) AS deposits_received,
      -- Pagos recibidos (ya pagados)
      COALESCE(SUM(pp.amount) FILTER (
        WHERE pp.is_deposit = FALSE 
        AND DATE(pp.payment_date) = ds.date
      ), 0) AS payments_received,
      -- Pagos por vencer
      COALESCE(SUM(pp.amount) FILTER (
        WHERE pp.is_deposit = FALSE 
        AND pp.due_date = ds.date
        AND (pp.payment_date IS NULL OR DATE(pp.payment_date) > ds.date)
      ), 0) AS payments_due,
      -- Depósitos por vencer
      COALESCE(SUM(pp.amount) FILTER (
        WHERE pp.is_deposit = TRUE 
        AND pp.due_date = ds.date
        AND (pp.payment_date IS NULL OR DATE(pp.payment_date) > ds.date)
      ), 0) AS deposits_due
    FROM date_series ds
    LEFT JOIN partial_payments pp ON (
      DATE(pp.payment_date) = ds.date 
      OR (pp.due_date IS NOT NULL AND DATE(pp.due_date) = ds.date)
    )
    LEFT JOIN quotes q ON q.id = pp.quote_id AND q.status = 'APPROVED'
    GROUP BY ds.date
  )
  SELECT 
    df.date,
    df.day_type,
    df.deposits_received,
    df.payments_received,
    df.deposits_received + df.payments_received AS total_inflow,
    df.payments_due,
    df.deposits_due,
    df.payments_due + df.deposits_due AS total_outflow,
    (df.deposits_received + df.payments_received) - (df.payments_due + df.deposits_due) AS net_flow,
    SUM((df.deposits_received + df.payments_received) - (df.payments_due + df.deposits_due)) 
      OVER (ORDER BY df.date ROWS UNBOUNDED PRECEDING) AS cumulative_balance
  FROM daily_flows df
  ORDER BY df.date;
END;
$$;

-- ============================================================================
-- 4. Función: Comparativa Mensual con Porcentajes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_monthly_comparison_with_percentages(
  p_months_back INTEGER DEFAULT 12
)
RETURNS TABLE(
  month DATE,
  month_name TEXT,
  confirmed_quotes INTEGER,
  total_sales NUMERIC,
  total_profit NUMERIC,
  unique_clients INTEGER,
  sales_change_percent NUMERIC,
  profit_change_percent NUMERIC,
  quotes_change_percent NUMERIC,
  margin_percent NUMERIC
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      date_trunc('month', q.created_at)::DATE AS month,
      COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'APPROVED') AS confirmed_quotes,
      COALESCE(SUM(q.total_amount) FILTER (WHERE q.status = 'APPROVED'), 0) AS total_sales,
      COALESCE(SUM(
        (SELECT SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity)
         FROM quote_services qs
         JOIN services s ON s.id = qs.service_id
         WHERE qs.quote_id = q.id)
      ) FILTER (WHERE q.status = 'APPROVED'), 0) AS total_profit,
      COUNT(DISTINCT q.client_id) FILTER (WHERE q.status = 'APPROVED') AS unique_clients
    FROM quotes q
    WHERE q.created_at >= (CURRENT_DATE - (p_months_back || ' months')::INTERVAL)
    GROUP BY date_trunc('month', q.created_at)
  ),
  with_previous AS (
    SELECT 
      md.*,
      LAG(md.total_sales) OVER (ORDER BY md.month) AS prev_sales,
      LAG(md.total_profit) OVER (ORDER BY md.month) AS prev_profit,
      LAG(md.confirmed_quotes) OVER (ORDER BY md.month) AS prev_quotes
    FROM monthly_data md
  )
  SELECT 
    wp.month,
    TO_CHAR(wp.month, 'Mon YYYY') AS month_name,
    wp.confirmed_quotes::INTEGER,
    wp.total_sales,
    wp.total_profit,
    wp.unique_clients::INTEGER,
    CASE 
      WHEN wp.prev_sales > 0 THEN 
        ((wp.total_sales - wp.prev_sales) / wp.prev_sales) * 100
      ELSE 0
    END AS sales_change_percent,
    CASE 
      WHEN wp.prev_profit > 0 THEN 
        ((wp.total_profit - wp.prev_profit) / wp.prev_profit) * 100
      ELSE 0
    END AS profit_change_percent,
    CASE 
      WHEN wp.prev_quotes > 0 THEN 
        ((wp.confirmed_quotes - wp.prev_quotes)::NUMERIC / wp.prev_quotes) * 100
      ELSE 0
    END AS quotes_change_percent,
    CASE 
      WHEN wp.total_sales > 0 THEN 
        (wp.total_profit / wp.total_sales) * 100
      ELSE 0
    END AS margin_percent
  FROM with_previous wp
  ORDER BY wp.month DESC;
END;
$$;

-- ============================================================================
-- 5. Función: Análisis de Rentabilidad por Período
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_profitability_analysis(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_revenue NUMERIC,
  total_cost NUMERIC,
  total_profit NUMERIC,
  margin_percent NUMERIC,
  total_quotes INTEGER,
  average_quote_value NUMERIC,
  average_profit_per_quote NUMERIC,
  top_service_id UUID,
  top_service_name TEXT,
  top_service_profit NUMERIC,
  top_client_id UUID,
  top_client_name TEXT,
  top_client_revenue NUMERIC
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '1 year');
  v_end DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  WITH quote_stats AS (
    SELECT 
      q.id,
      q.total_amount,
      COALESCE((
        SELECT SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity)
        FROM quote_services qs
        JOIN services s ON s.id = qs.service_id
        WHERE qs.quote_id = q.id
      ), 0) AS profit
    FROM quotes q
    WHERE q.status = 'APPROVED'
      AND q.created_at >= v_start
      AND q.created_at <= v_end
  ),
  service_profits AS (
    SELECT 
      qs.service_id,
      s.name AS service_name,
      SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity) AS service_profit
    FROM quote_services qs
    JOIN services s ON s.id = qs.service_id
    JOIN quotes q ON q.id = qs.quote_id
    WHERE q.status = 'APPROVED'
      AND q.created_at >= v_start
      AND q.created_at <= v_end
    GROUP BY qs.service_id, s.name
    ORDER BY service_profit DESC
    LIMIT 1
  ),
  client_revenues AS (
    SELECT 
      q.client_id,
      c.name AS client_name,
      SUM(q.total_amount) AS client_revenue
    FROM quotes q
    JOIN clients c ON c.id = q.client_id
    WHERE q.status = 'APPROVED'
      AND q.created_at >= v_start
      AND q.created_at <= v_end
    GROUP BY q.client_id, c.name
    ORDER BY client_revenue DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(SUM(qs.total_amount), 0) AS total_revenue,
    COALESCE(SUM(qs.total_amount - qs.profit), 0) AS total_cost,
    COALESCE(SUM(qs.profit), 0) AS total_profit,
    CASE 
      WHEN SUM(qs.total_amount) > 0 THEN 
        (SUM(qs.profit) / SUM(qs.total_amount)) * 100
      ELSE 0
    END AS margin_percent,
    COUNT(*)::INTEGER AS total_quotes,
    COALESCE(AVG(qs.total_amount), 0) AS average_quote_value,
    COALESCE(AVG(qs.profit), 0) AS average_profit_per_quote,
    (SELECT service_id FROM service_profits LIMIT 1) AS top_service_id,
    (SELECT service_name FROM service_profits LIMIT 1) AS top_service_name,
    COALESCE((SELECT service_profit FROM service_profits LIMIT 1), 0) AS top_service_profit,
    (SELECT client_id FROM client_revenues LIMIT 1) AS top_client_id,
    (SELECT client_name FROM client_revenues LIMIT 1) AS top_client_name,
    COALESCE((SELECT client_revenue FROM client_revenues LIMIT 1), 0) AS top_client_revenue
  FROM quote_stats qs;
END;
$$;

-- ============================================================================
-- 6. Función: Alertas Financieras
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_financial_alerts()
RETURNS TABLE(
  alert_type TEXT,
  alert_level TEXT,
  alert_message TEXT,
  alert_value NUMERIC,
  alert_date DATE
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  -- Alerta 1: Margen muy bajo
  SELECT 
    'LOW_MARGIN'::TEXT,
    'WARNING'::TEXT,
    'El margen de ganancia promedio es menor al 15%'::TEXT,
    (
      SELECT CASE 
        WHEN SUM(q.total_amount) > 0 THEN 
          (SUM(COALESCE((
            SELECT SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity)
            FROM quote_services qs
            JOIN services s ON s.id = qs.service_id
            WHERE qs.quote_id = q.id
          ), 0)) / SUM(q.total_amount)) * 100
        ELSE 0
      END
      FROM quotes q
      WHERE q.status = 'APPROVED'
        AND q.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) AS alert_value,
    CURRENT_DATE AS alert_date
  WHERE (
    SELECT CASE 
      WHEN SUM(q.total_amount) > 0 THEN 
        (SUM(COALESCE((
          SELECT SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity)
          FROM quote_services qs
          JOIN services s ON s.id = qs.service_id
          WHERE qs.quote_id = q.id
        ), 0)) / SUM(q.total_amount)) * 100
      ELSE 0
    END
    FROM quotes q
    WHERE q.status = 'APPROVED'
      AND q.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) < 15

  UNION ALL

  -- Alerta 2: Pagos vencidos críticos
  SELECT 
    'OVERDUE_PAYMENTS'::TEXT,
    CASE 
      WHEN COUNT(*) > 10 THEN 'CRITICAL'::TEXT
      WHEN COUNT(*) > 5 THEN 'HIGH'::TEXT
      ELSE 'MEDIUM'::TEXT
    END,
    (COUNT(*) || ' pagos vencidos')::TEXT,
    SUM(pp.amount) AS alert_value,
    CURRENT_DATE AS alert_date
  FROM partial_payments pp
  JOIN quotes q ON q.id = pp.quote_id
  WHERE pp.due_date < CURRENT_DATE
    AND (pp.payment_date IS NULL OR pp.payment_date > pp.due_date)
    AND q.status = 'APPROVED'
  HAVING COUNT(*) > 0

  UNION ALL

  -- Alerta 3: Flujo de caja negativo proyectado
  SELECT 
    'NEGATIVE_CASH_FLOW'::TEXT,
    'HIGH'::TEXT,
    'Flujo de caja negativo proyectado en los próximos 30 días'::TEXT,
    (
      SELECT COALESCE(SUM(net_flow), 0)
      FROM get_advanced_cash_flow_projection(30)
      WHERE date <= CURRENT_DATE + INTERVAL '30 days'
    ) AS alert_value,
    CURRENT_DATE AS alert_date
  WHERE (
    SELECT COALESCE(SUM(net_flow), 0)
    FROM get_advanced_cash_flow_projection(30)
    WHERE date <= CURRENT_DATE + INTERVAL '30 days'
  ) < 0

  UNION ALL

  -- Alerta 4: Disminución de ventas
  SELECT 
    'SALES_DECLINE'::TEXT,
    'WARNING'::TEXT,
    'Las ventas del mes actual son menores al mes anterior'::TEXT,
    (
      SELECT 
        CASE 
          WHEN prev_month_sales > 0 THEN 
            ((current_month_sales - prev_month_sales) / prev_month_sales) * 100
          ELSE 0
        END
      FROM (
        SELECT 
          SUM(total_amount) FILTER (
            WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
          ) AS current_month_sales,
          SUM(total_amount) FILTER (
            WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
          ) AS prev_month_sales
        FROM quotes
        WHERE status = 'APPROVED'
      ) sales_comparison
    ) AS alert_value,
    CURRENT_DATE AS alert_date
  WHERE (
    SELECT 
      CASE 
        WHEN prev_month_sales > 0 THEN 
          ((current_month_sales - prev_month_sales) / prev_month_sales) * 100
        ELSE 0
      END
    FROM (
      SELECT 
        SUM(total_amount) FILTER (
          WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
        ) AS current_month_sales,
        SUM(total_amount) FILTER (
          WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
        ) AS prev_month_sales
      FROM quotes
      WHERE status = 'APPROVED'
    ) sales_comparison
  ) < -10;
END;
$$;

-- ============================================================================
-- 7. Vista: Resumen Financiero Ejecutivo
-- ============================================================================
DROP VIEW IF EXISTS public.executive_financial_summary CASCADE;
CREATE VIEW public.executive_financial_summary
WITH (security_invoker = true)
AS
SELECT 
  CURRENT_DATE AS report_date,
  -- Ventas
  (SELECT COALESCE(SUM(total_amount), 0) FROM quotes WHERE status = 'APPROVED' AND created_at >= date_trunc('month', CURRENT_DATE)) AS monthly_sales,
  (SELECT COALESCE(SUM(total_amount), 0) FROM quotes WHERE status = 'APPROVED' AND created_at >= date_trunc('year', CURRENT_DATE)) AS yearly_sales,
  -- Utilidad
  (SELECT COALESCE(SUM(
    (SELECT SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity)
     FROM quote_services qs
     JOIN services s ON s.id = qs.service_id
     WHERE qs.quote_id = q.id)
  ), 0) FROM quotes q WHERE q.status = 'APPROVED' AND q.created_at >= date_trunc('month', CURRENT_DATE)) AS monthly_profit,
  (SELECT COALESCE(SUM(
    (SELECT SUM((qs.final_price - COALESCE(s.cost_price, 0)) * qs.quantity)
     FROM quote_services qs
     JOIN services s ON s.id = qs.service_id
     WHERE qs.quote_id = q.id)
  ), 0) FROM quotes q WHERE q.status = 'APPROVED' AND q.created_at >= date_trunc('year', CURRENT_DATE)) AS yearly_profit,
  -- Pagos
  (SELECT COALESCE(SUM(amount), 0) FROM partial_payments pp JOIN quotes q ON q.id = pp.quote_id WHERE q.status = 'APPROVED' AND DATE(pp.payment_date) >= date_trunc('month', CURRENT_DATE)) AS monthly_payments,
  (SELECT COALESCE(SUM(amount), 0) FROM partial_payments pp JOIN quotes q ON q.id = pp.quote_id WHERE q.status = 'APPROVED' AND DATE(pp.payment_date) >= date_trunc('year', CURRENT_DATE)) AS yearly_payments,
  -- Pendientes
  (SELECT COALESCE(SUM(total_amount - COALESCE((
    SELECT SUM(pp2.amount) FROM partial_payments pp2 WHERE pp2.quote_id = q.id
  ), 0)), 0) FROM quotes q WHERE q.status = 'APPROVED') AS total_pending,
  -- Vencidos
  (SELECT COALESCE(SUM(pp.amount), 0) FROM partial_payments pp JOIN quotes q ON q.id = pp.quote_id WHERE pp.due_date < CURRENT_DATE AND (pp.payment_date IS NULL OR pp.payment_date > pp.due_date) AND q.status = 'APPROVED') AS total_overdue,
  -- Métricas
  (SELECT COUNT(*) FROM quotes WHERE status = 'APPROVED' AND created_at >= date_trunc('month', CURRENT_DATE)) AS monthly_quotes,
  (SELECT COUNT(DISTINCT client_id) FROM quotes WHERE status = 'APPROVED' AND created_at >= date_trunc('month', CURRENT_DATE)) AS monthly_clients,
  (SELECT AVG(total_amount) FROM quotes WHERE status = 'APPROVED' AND created_at >= date_trunc('month', CURRENT_DATE)) AS average_quote_value;

-- Comentarios
COMMENT ON VIEW public.service_profitability IS 'Análisis de rentabilidad por servicio: ventas, utilidad y márgenes';
COMMENT ON VIEW public.client_profitability IS 'Análisis de rentabilidad por cliente: historial de compras y pagos';
COMMENT ON FUNCTION public.get_advanced_cash_flow_projection IS 'Proyección avanzada de flujo de efectivo con balances acumulados';
COMMENT ON FUNCTION public.get_monthly_comparison_with_percentages IS 'Comparativa mensual con porcentajes de cambio y márgenes';
COMMENT ON FUNCTION public.get_profitability_analysis IS 'Análisis completo de rentabilidad con top servicios y clientes';
COMMENT ON FUNCTION public.get_financial_alerts IS 'Sistema de alertas financieras: márgenes bajos, pagos vencidos, etc';
COMMENT ON VIEW public.executive_financial_summary IS 'Resumen ejecutivo financiero con todas las métricas clave';

