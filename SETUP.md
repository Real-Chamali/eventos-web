# Configuración del Sistema de Eventos

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

## Estructura de Base de Datos en Supabase

El sistema requiere las siguientes tablas en Supabase:

### 1. `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'vendor' CHECK (role IN ('admin', 'vendor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. `services`
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. `quotes`
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  vendor_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. `quote_services`
```sql
CREATE TABLE quote_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. `finance_ledger`
```sql
CREATE TABLE finance_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. `events`
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Función RPC: `confirm_sale`

Crea esta función en Supabase para cerrar ventas:

```sql
CREATE OR REPLACE FUNCTION confirm_sale(quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  event_id UUID;
BEGIN
  -- Actualizar el estado de la cotización
  UPDATE quotes
  SET status = 'confirmed', updated_at = NOW()
  WHERE id = quote_id AND status = 'draft';

  -- Crear el evento
  INSERT INTO events (quote_id)
  VALUES (quote_id)
  RETURNING id INTO event_id;

  -- Registrar ingreso en el ledger financiero
  INSERT INTO finance_ledger (amount, type, description)
  SELECT total_price, 'income', 'Venta confirmada - Cotización #' || quote_id
  FROM quotes
  WHERE id = quote_id;

  RETURN event_id;
END;
$$;
```

## Políticas RLS (Row Level Security)

Asegúrate de configurar las políticas RLS apropiadas en Supabase para cada tabla según tus necesidades de seguridad.

## Inicio

1. Instala las dependencias: `npm install`
2. Configura las variables de entorno en `.env.local`
3. Crea las tablas y funciones en Supabase
4. Ejecuta el servidor de desarrollo: `npm run dev`


