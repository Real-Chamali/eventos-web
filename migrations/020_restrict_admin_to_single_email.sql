-- Migración 020: Restringir rol admin solo a admin@chamali.com
-- Fecha: Diciembre 2024
-- Descripción: Asegurar que solo admin@chamali.com pueda tener rol admin

-- 1. Función para verificar si un usuario puede ser admin
CREATE OR REPLACE FUNCTION can_be_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Obtener el email del usuario desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  -- Solo admin@chamali.com puede ser admin
  RETURN COALESCE(user_email = 'admin@chamali.com', false);
END;
$$;

-- 2. Función para prevenir asignación de rol admin a usuarios no autorizados
CREATE OR REPLACE FUNCTION prevent_unauthorized_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Si se intenta asignar rol 'admin'
  IF NEW.role = 'admin' THEN
    -- Verificar que el usuario puede ser admin
    IF NOT can_be_admin(NEW.id) THEN
      RAISE EXCEPTION 'Solo admin@chamali.com puede tener rol admin. Intento de asignar admin a: %', 
        (SELECT email FROM auth.users WHERE id = NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Crear trigger para prevenir asignación no autorizada de admin
DROP TRIGGER IF EXISTS prevent_unauthorized_admin_trigger ON profiles;
CREATE TRIGGER prevent_unauthorized_admin_trigger
  BEFORE INSERT OR UPDATE OF role
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unauthorized_admin();

-- 4. Asegurar que admin@chamali.com tenga rol admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar el ID del usuario admin@chamali.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@chamali.com';
  
  -- Si existe, asegurar que tenga rol admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = NOW();
    
    RAISE NOTICE 'Rol admin asignado/verificado para admin@chamali.com (ID: %)', admin_user_id;
  ELSE
    RAISE WARNING 'Usuario admin@chamali.com no encontrado en auth.users';
  END IF;
END;
$$;

-- 5. Actualizar función is_admin para verificar también el email
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  current_user_id UUID;
  user_email TEXT;
  user_role TEXT;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Obtener email y rol del usuario
  SELECT 
    u.email,
    p.role::TEXT
  INTO 
    user_email,
    user_role
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = current_user_id;
  
  -- Solo admin@chamali.com con rol admin puede ser admin
  RETURN COALESCE(user_email = 'admin@chamali.com' AND user_role = 'admin', false);
END;
$$;

-- 6. Comentarios para documentación
COMMENT ON FUNCTION can_be_admin(UUID) IS 'Verifica si un usuario puede tener rol admin. Solo admin@chamali.com puede ser admin.';
COMMENT ON FUNCTION prevent_unauthorized_admin() IS 'Trigger function que previene asignación de rol admin a usuarios no autorizados.';
COMMENT ON TRIGGER prevent_unauthorized_admin_trigger ON profiles IS 'Previene que usuarios distintos a admin@chamali.com tengan rol admin.';

-- 7. Verificación: Intentar cambiar cualquier otro usuario a admin debería fallar
-- (Esto es solo para documentación, no se ejecuta)
-- UPDATE profiles SET role = 'admin' WHERE id != (SELECT id FROM auth.users WHERE email = 'admin@chamali.com');
-- Debería fallar con: "Solo admin@chamali.com puede tener rol admin"

