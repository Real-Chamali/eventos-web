-- ============================================================================
-- Migración: Optimizar Políticas RLS para Mejor Rendimiento
-- ============================================================================
-- Problema: Las políticas RLS re-evalúan auth.uid(), auth.jwt(), e is_admin()
--           para cada fila, causando problemas de rendimiento.
-- Solución: Envolver todas las llamadas en (select ...) para que se evalúen
--           una sola vez por consulta.
-- ============================================================================
-- También consolida políticas duplicadas donde sea posible.
-- ============================================================================

-- ============================================================================
-- 1. OPTIMIZAR POLÍTICAS DE CLIENTS
-- ============================================================================
-- NOTA: Requiere que la columna created_by exista en clients
-- Si no existe, aplicar primero la migración 009_add_created_by_to_clients.sql
-- ============================================================================

-- Eliminar políticas existentes de clients
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
DROP POLICY IF EXISTS "clients_vendor_select" ON public.clients;
DROP POLICY IF EXISTS "clients_vendor_update" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_delete" ON public.clients;
DROP POLICY IF EXISTS "clients_vendor_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_admin" ON public.clients;

-- Crear políticas optimizadas y consolidadas
CREATE POLICY "clients_admin_all" ON public.clients
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- Política para SELECT: Vendors ven sus propios clientes o clientes sin created_by (legacy)
CREATE POLICY "clients_vendor_select" ON public.clients
  FOR SELECT
  USING (
    (select public.is_admin())
    OR (select auth.uid()) = created_by
    OR (created_by IS NULL AND (select auth.uid()) IS NOT NULL) -- Legacy: clientes sin created_by visibles para todos autenticados
  );

-- Política para INSERT: Vendors pueden crear clientes (se asigna created_by automáticamente)
CREATE POLICY "clients_vendor_insert" ON public.clients
  FOR INSERT
  WITH CHECK (
    (select public.is_admin())
    OR (
      (select auth.uid()) IS NOT NULL
      AND (created_by IS NULL OR (select auth.uid()) = created_by)
    )
  );

-- Política para UPDATE: Vendors pueden actualizar sus propios clientes
CREATE POLICY "clients_vendor_update" ON public.clients
  FOR UPDATE
  USING (
    (select public.is_admin())
    OR (select auth.uid()) = created_by
    OR (created_by IS NULL AND (select auth.uid()) IS NOT NULL) -- Legacy
  )
  WITH CHECK (
    (select public.is_admin())
    OR (select auth.uid()) = created_by
    OR (created_by IS NULL AND (select auth.uid()) IS NOT NULL) -- Legacy
  );

-- Política para DELETE: Solo admin puede eliminar
CREATE POLICY "clients_admin_delete" ON public.clients
  FOR DELETE
  USING ((select public.is_admin()));

-- ============================================================================
-- 2. OPTIMIZAR POLÍTICAS DE SERVICES
-- ============================================================================

DROP POLICY IF EXISTS "services_admin_all" ON public.services;
DROP POLICY IF EXISTS "services_no_public_select" ON public.services;
DROP POLICY IF EXISTS "services_select" ON public.services;
DROP POLICY IF EXISTS "services_insert" ON public.services;
DROP POLICY IF EXISTS "services_update" ON public.services;
DROP POLICY IF EXISTS "services_delete_admin" ON public.services;

CREATE POLICY "services_admin_all" ON public.services
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "services_authenticated_select" ON public.services
  FOR SELECT
  USING (
    (select auth.uid()) IS NOT NULL
    OR (select public.is_admin())
  );

-- ============================================================================
-- 3. OPTIMIZAR POLÍTICAS DE QUOTES
-- ============================================================================

DROP POLICY IF EXISTS "quotes_admin_all" ON public.quotes;
DROP POLICY IF EXISTS "quotes_vendor_select" ON public.quotes;
DROP POLICY IF EXISTS "quotes_vendor_insert" ON public.quotes;
DROP POLICY IF EXISTS "quotes_vendor_update" ON public.quotes;
DROP POLICY IF EXISTS "quotes_vendor_delete_admin_only" ON public.quotes;
DROP POLICY IF EXISTS "quotes_select_owner" ON public.quotes;
DROP POLICY IF EXISTS "quotes_insert" ON public.quotes;
DROP POLICY IF EXISTS "quotes_update_owner" ON public.quotes;
DROP POLICY IF EXISTS "quotes_delete_owner" ON public.quotes;
DROP POLICY IF EXISTS "admin_full_access_quotes" ON public.quotes;
DROP POLICY IF EXISTS "vendor_quotes_select" ON public.quotes;
DROP POLICY IF EXISTS "vendor_quotes_update" ON public.quotes;

CREATE POLICY "quotes_admin_all" ON public.quotes
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "quotes_vendor_select" ON public.quotes
  FOR SELECT
  USING (
    (select auth.uid()) = vendor_id
    OR (select public.is_admin())
  );

CREATE POLICY "quotes_vendor_insert" ON public.quotes
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = vendor_id
    OR (select public.is_admin())
  );

CREATE POLICY "quotes_vendor_update" ON public.quotes
  FOR UPDATE
  USING (
    (select auth.uid()) = vendor_id
    OR (select public.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = vendor_id
    OR (select public.is_admin())
  );

CREATE POLICY "quotes_vendor_delete_admin_only" ON public.quotes
  FOR DELETE
  USING ((select public.is_admin()));

-- ============================================================================
-- 4. OPTIMIZAR POLÍTICAS DE QUOTE_ITEMS
-- ============================================================================

DROP POLICY IF EXISTS "qi_admin_all" ON public.quote_items;
DROP POLICY IF EXISTS "qi_vendor_select" ON public.quote_items;
DROP POLICY IF EXISTS "qi_vendor_insert" ON public.quote_items;
DROP POLICY IF EXISTS "qi_vendor_update" ON public.quote_items;
DROP POLICY IF EXISTS "qi_vendor_delete_admin_only" ON public.quote_items;

CREATE POLICY "qi_admin_all" ON public.quote_items
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "qi_vendor_select" ON public.quote_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

CREATE POLICY "qi_vendor_insert" ON public.quote_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

CREATE POLICY "qi_vendor_update" ON public.quote_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

CREATE POLICY "qi_vendor_delete_admin_only" ON public.quote_items
  FOR DELETE
  USING ((select public.is_admin()));

-- ============================================================================
-- 5. OPTIMIZAR POLÍTICAS DE QUOTE_SERVICES
-- ============================================================================

DROP POLICY IF EXISTS "quote_services_select" ON public.quote_services;
DROP POLICY IF EXISTS "quote_services_insert" ON public.quote_services;
DROP POLICY IF EXISTS "quote_services_update" ON public.quote_services;
DROP POLICY IF EXISTS "quote_services_delete" ON public.quote_services;

CREATE POLICY "quote_services_select" ON public.quote_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_services.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

CREATE POLICY "quote_services_insert" ON public.quote_services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_services.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

CREATE POLICY "quote_services_update" ON public.quote_services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_services.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_services.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

CREATE POLICY "quote_services_delete" ON public.quote_services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_services.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

-- ============================================================================
-- 6. OPTIMIZAR POLÍTICAS DE EVENTS
-- ============================================================================

DROP POLICY IF EXISTS "events_admin_all" ON public.events;
DROP POLICY IF EXISTS "events_vendor_select" ON public.events;
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

CREATE POLICY "events_admin_all" ON public.events
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "events_vendor_select" ON public.events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = events.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

CREATE POLICY "events_insert" ON public.events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = events.quote_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

CREATE POLICY "events_delete" ON public.events
  FOR DELETE
  USING ((select public.is_admin()));

-- ============================================================================
-- 7. OPTIMIZAR POLÍTICAS DE FINANCE_LEDGER
-- ============================================================================

DROP POLICY IF EXISTS "finance_admin_all" ON public.finance_ledger;
DROP POLICY IF EXISTS "finance_vendor_commission" ON public.finance_ledger;
DROP POLICY IF EXISTS "finance_ledger_admin" ON public.finance_ledger;

CREATE POLICY "finance_admin_all" ON public.finance_ledger
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "finance_vendor_commission" ON public.finance_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN quotes q ON q.id = e.quote_id
      WHERE e.id = finance_ledger.event_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    )
  );

-- ============================================================================
-- 8. OPTIMIZAR POLÍTICAS DE SERVICE_PRICE_RULES
-- ============================================================================

DROP POLICY IF EXISTS "price_rules_admin_all" ON public.service_price_rules;
DROP POLICY IF EXISTS "price_rules_vendor_select" ON public.service_price_rules;

CREATE POLICY "price_rules_admin_all" ON public.service_price_rules
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "price_rules_vendor_select" ON public.service_price_rules
  FOR SELECT
  USING (
    (select auth.uid()) IS NOT NULL
    OR (select public.is_admin())
  );

-- ============================================================================
-- 9. OPTIMIZAR POLÍTICAS DE QUOTE_VERSIONS
-- ============================================================================

DROP POLICY IF EXISTS "quote_versions_user_select" ON public.quote_versions;
DROP POLICY IF EXISTS "quote_versions_user_insert" ON public.quote_versions;
DROP POLICY IF EXISTS "quote_versions_admin_select" ON public.quote_versions;
DROP POLICY IF EXISTS "quote_versions_admin_insert" ON public.quote_versions;

CREATE POLICY "quote_versions_user_select" ON public.quote_versions
  FOR SELECT
  USING (
    (select auth.uid()) = created_by
    OR (select public.is_admin())
  );

CREATE POLICY "quote_versions_user_insert" ON public.quote_versions
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = created_by
    OR (select public.is_admin())
  );

CREATE POLICY "quote_versions_admin_select" ON public.quote_versions
  FOR SELECT
  USING ((select public.is_admin()));

CREATE POLICY "quote_versions_admin_insert" ON public.quote_versions
  FOR INSERT
  WITH CHECK ((select public.is_admin()));

-- ============================================================================
-- 10. OPTIMIZAR POLÍTICAS DE PROFILES (ya optimizadas en migración 003)
-- ============================================================================
-- Las políticas de profiles ya están optimizadas, pero podemos mejorar
-- las que usan auth.uid() directamente

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_middleware" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_middleware" ON public.profiles;

-- Mantener solo las políticas simples optimizadas
-- (profiles_select_own_simple, profiles_insert_own_simple, etc.)
-- Estas ya están optimizadas en la migración 003

-- ============================================================================
-- 11. OPTIMIZAR POLÍTICAS DE AUDIT_LOGS (migración 001)
-- ============================================================================

DROP POLICY IF EXISTS "audit_logs_admin_view" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_user_view_own" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_user_create" ON public.audit_logs;

CREATE POLICY "audit_logs_admin_view" ON public.audit_logs
  FOR SELECT
  USING ((select public.is_admin()));

CREATE POLICY "audit_logs_user_view_own" ON public.audit_logs
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR (select public.is_admin())
  );

CREATE POLICY "audit_logs_user_create" ON public.audit_logs
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================================
-- 12. OPTIMIZAR POLÍTICAS DE NOTIFICATIONS (migración 004)
-- ============================================================================

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own_or_admin" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR (select public.is_admin())
  );

CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    OR (select public.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select public.is_admin())
  );

CREATE POLICY "notifications_delete_own_or_admin" ON public.notifications
  FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (select public.is_admin())
  );

-- ============================================================================
-- 13. OPTIMIZAR POLÍTICAS DE COMMENTS (migración 005)
-- ============================================================================

DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;

CREATE POLICY "comments_select" ON public.comments
  FOR SELECT
  USING (
    (entity_type = 'quote' AND EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = comments.entity_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    ))
    OR
    (entity_type = 'event' AND EXISTS (
      SELECT 1 FROM events e
      JOIN quotes q ON q.id = e.quote_id
      WHERE e.id = comments.entity_id
      AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
    ))
    OR
    (entity_type = 'client' AND (select auth.uid()) IS NOT NULL)
    OR
    (select public.is_admin())
  );

CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (
      (entity_type = 'quote' AND EXISTS (
        SELECT 1 FROM quotes q
        WHERE q.id = comments.entity_id
        AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
      ))
      OR
      (entity_type = 'event' AND EXISTS (
        SELECT 1 FROM events e
        JOIN quotes q ON q.id = e.quote_id
        WHERE e.id = comments.entity_id
        AND ((select auth.uid()) = q.vendor_id OR (select public.is_admin()))
      ))
      OR
      (entity_type = 'client' AND EXISTS (
        SELECT 1 FROM clients c
        WHERE c.id = comments.entity_id
        AND ((select auth.uid()) = c.created_by OR (select public.is_admin()))
      ))
      OR
      (select public.is_admin())
    )
  );

CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    OR (select public.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select public.is_admin())
  );

CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (select public.is_admin())
  );

-- ============================================================================
-- 14. OPTIMIZAR POLÍTICAS DE QUOTE_TEMPLATES (migración 006)
-- ============================================================================

DROP POLICY IF EXISTS "quote_templates_select" ON public.quote_templates;
DROP POLICY IF EXISTS "quote_templates_insert" ON public.quote_templates;
DROP POLICY IF EXISTS "quote_templates_update" ON public.quote_templates;
DROP POLICY IF EXISTS "quote_templates_delete" ON public.quote_templates;

CREATE POLICY "quote_templates_select" ON public.quote_templates
  FOR SELECT
  USING (
    is_public = TRUE
    OR (select auth.uid()) = created_by
    OR (select public.is_admin())
  );

CREATE POLICY "quote_templates_insert" ON public.quote_templates
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = created_by
    OR (select public.is_admin())
  );

CREATE POLICY "quote_templates_update" ON public.quote_templates
  FOR UPDATE
  USING (
    (select auth.uid()) = created_by
    OR (select public.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = created_by
    OR (select public.is_admin())
  );

CREATE POLICY "quote_templates_delete" ON public.quote_templates
  FOR DELETE
  USING (
    (select auth.uid()) = created_by
    OR (select public.is_admin())
  );

-- ============================================================================
-- 15. OPTIMIZAR POLÍTICAS DE USER_PREFERENCES (migración 007)
-- ============================================================================

DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_delete_own" ON public.user_preferences;

CREATE POLICY "user_preferences_select_own" ON public.user_preferences
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "user_preferences_insert_own" ON public.user_preferences
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_preferences_update_own" ON public.user_preferences
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_preferences_delete_own" ON public.user_preferences
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- Comentarios Finales
-- ============================================================================

COMMENT ON POLICY "clients_admin_all" ON public.clients IS
'Política optimizada: Admin tiene acceso total. Usa (select is_admin()) para mejor rendimiento.';

COMMENT ON POLICY "quotes_vendor_select" ON public.quotes IS
'Política optimizada: Vendors ven sus propias cotizaciones. Usa (select auth.uid()) para mejor rendimiento.';

-- ============================================================================
-- Verificación
-- ============================================================================

-- Verificar que todas las políticas se crearon correctamente
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN (
    'clients', 'services', 'quotes', 'quote_items', 'quote_services',
    'events', 'finance_ledger', 'service_price_rules', 'quote_versions',
    'profiles', 'audit_logs', 'notifications', 'comments', 'quote_templates',
    'user_preferences'
  );
  
  RAISE NOTICE 'Total de políticas RLS optimizadas: %', policy_count;
END $$;

