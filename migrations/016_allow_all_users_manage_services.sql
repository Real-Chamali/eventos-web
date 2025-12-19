-- migrations/016_allow_all_users_manage_services.sql

-- Permitir que todos los usuarios autenticados puedan gestionar servicios
-- Esto permite que los vendedores puedan crear, editar y eliminar servicios
-- desde el dashboard para poder hacer cotizaciones

-- Eliminar políticas restrictivas de admin
DROP POLICY IF EXISTS "Admins can create services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

-- Crear políticas que permitan a todos los usuarios autenticados gestionar servicios
CREATE POLICY "Authenticated users can create services"
ON public.services
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update services"
ON public.services
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete services"
ON public.services
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- La política de SELECT ya existe y permite a todos los autenticados leer servicios
-- No es necesario cambiarla

