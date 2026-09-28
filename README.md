# Formulario de Terapia Ocupacional
## Programa de Reinserción Socio-Laboral — Clínica Día

Aplicación web para la recolección de información sobre habilidades de desempeño ocupacional, habilidades laborales básicas, habilidades de interacción social, barreras y apoyos para la participación laboral e intereses ocupacionales y laborales.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | Vite + HTML/CSS/JavaScript vanilla |
| Base de datos | Supabase PostgreSQL |
| Autenticación | Supabase Auth |
| Almacenamiento de firmas | Supabase Storage (bucket privado) |
| Hosting | Netlify |
| Gráficos | Chart.js |

---

## Estructura del Proyecto

```
Forms_IntegracionSocial/
├── index.html                  # Formulario público (participantes)
├── admin.html                  # Dashboard administrativo
├── vite.config.js
├── package.json
├── netlify.toml
├── .env.example                # Variables de entorno requeridas
├── public/
│   └── favicon.svg
├── src/
│   ├── lib/
│   │   └── supabase.js         # Cliente Supabase
│   ├── services/
│   │   ├── responses.js        # CRUD de respuestas
│   │   ├── signatures.js       # Firmas en Storage
│   │   ├── auth.js             # Autenticación admin
│   │   ├── export.js           # Exportación CSV
│   │   └── realtime.js         # Supabase Realtime
│   ├── dashboard/
│   │   ├── statistics.js       # Estadísticas descriptivas
│   │   └── charts.js           # Chart.js helpers
│   ├── pages/
│   │   ├── form/
│   │   │   ├── form.js         # Controlador del formulario
│   │   │   └── form.css        # Estilos del formulario
│   │   └── admin/
│   │       ├── dashboard.js    # Controlador del dashboard
│   │       └── admin.css       # Estilos del dashboard
│   ├── styles/
│   │   ├── variables.css       # Design tokens
│   │   └── base.css            # Estilos base
│   └── utils/
│       ├── validation.js       # Validaciones
│       └── format.js           # Formateo de datos
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql  # Esquema completo
        ├── 002_rls_policies.sql    # Row Level Security
        ├── 003_seed_questions.sql  # Catálogo de preguntas
        └── 004_storage_setup.sql  # Bucket de firmas
```

---

## Prerequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Cuenta de [Supabase](https://supabase.com/) (gratuita)
- Cuenta de [Netlify](https://netlify.com/) (gratuita)

---

## Instalación Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

Editar `.env` y completar:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
VITE_CONSENT_VERSION=1.0
VITE_APP_ENV=development
```

> ⚠️ **NUNCA** incluir la `service_role key` en el frontend ni en este archivo.

### 3. Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:
- `http://localhost:5173` → Formulario público
- `http://localhost:5173/admin.html` → Dashboard administrativo

---

## Configuración de Supabase

### Paso 1 — Crear proyecto Supabase

1. Ir a [supabase.com](https://supabase.com/) y crear un nuevo proyecto.
2. Anotar la **Project URL** y la **anon public key** (en Settings > API).

### Paso 2 — Ejecutar migraciones SQL

Ir al **SQL Editor** de Supabase y ejecutar los archivos en orden:

```sql
-- 1. Esquema de tablas
-- Pegar y ejecutar: supabase/migrations/001_initial_schema.sql

-- 2. Políticas de seguridad (RLS)
-- Pegar y ejecutar: supabase/migrations/002_rls_policies.sql

-- 3. Catálogo de preguntas
-- Pegar y ejecutar: supabase/migrations/003_seed_questions.sql

-- 4. Bucket de firmas (Storage)
-- Pegar y ejecutar: supabase/migrations/004_storage_setup.sql
```

> ⚠️ Ejecutar en orden. Cada migración depende de la anterior.

### Paso 3 — Habilitar Realtime

En el panel de Supabase:
1. Ir a **Database > Replication**.
2. Habilitar Realtime para la tabla `responses`.

### Paso 4 — Crear el usuario administrador

1. En Supabase, ir a **Authentication > Users**.
2. Clic en **Add user** → **Create new user**.
3. Ingresar email y contraseña del administrador.
4. Copiar el `UUID` del usuario creado.
5. En el **SQL Editor**, ejecutar:

```sql
-- Reemplazar 'UUID-DEL-USUARIO' con el UUID real
INSERT INTO user_roles (user_id, role)
VALUES ('UUID-DEL-USUARIO', 'admin');
```

> 🔒 **No hay registro público de administradores.** Solo se pueden crear desde el panel de Supabase.

### Paso 5 — Crear bucket de firmas (si 004 falló)

Si la migración 004 no se ejecutó correctamente:

1. Ir a **Storage** en Supabase.
2. Clic en **New bucket**.
3. Nombre: `signatures`.
4. **Desmarcar** "Public bucket" → bucket privado.
5. Agregar las políticas manualmente desde Storage > Policies (ver `004_storage_setup.sql`).

---

## Despliegue en Netlify

### Opción A — Desde la interfaz de Netlify

1. Hacer un push del proyecto a un repositorio en GitHub/GitLab.
2. En Netlify, clic en **Add new site > Import an existing project**.
3. Conectar el repositorio.
4. Configurar:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Agregar las variables de entorno en **Site settings > Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CONSENT_VERSION`
   - `VITE_APP_ENV=production`
6. Clic en **Deploy site**.

### Opción B — Netlify CLI

```bash
# Instalar CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

---

## Rutas de la Aplicación

| URL | Descripción |
|-----|-------------|
| `/` | Formulario público para participantes |
| `/admin` | Dashboard administrativo (requiere autenticación) |

---

## Seguridad

- ✅ **Row Level Security (RLS)** habilitado en todas las tablas.
- ✅ Los participantes solo pueden crear su propia respuesta.
- ✅ Los participantes no pueden leer datos de otros.
- ✅ Las firmas están en un bucket **privado** de Storage.
- ✅ Solo administradores autenticados pueden acceder al dashboard.
- ✅ Las URLs de firmas son temporales (firmadas, máx. 60 segundos).
- ✅ No se expone la `service_role key` en el frontend.
- ✅ Las respuestas abiertas son sanitizadas antes de guardarse.

---

## Modificar el Consentimiento Informado

El texto del consentimiento está en `src/pages/form/form.js` (constante `CONSENT_TEXT`).

Para modificarlo:
1. Editar el texto en `form.js`.
2. **Actualizar la versión** desde el dashboard admin > Configuración.
3. El número de versión queda registrado en cada nueva aceptación.
4. Las aceptaciones históricas conservan la versión con la que fueron firmadas.

---

## Modificar Preguntas

Las preguntas se almacenan en la tabla `questions` de Supabase.

Para **desactivar** una pregunta:
```sql
UPDATE questions SET active = FALSE WHERE question_code = 'codigo_pregunta';
```

Para **agregar** una pregunta nueva (ejemplo):
```sql
INSERT INTO questions (section_code, question_code, question_text, question_type, options, "order", required)
VALUES (
  'work_skills',
  'w_nueva',
  'Nueva pregunta laboral.',
  'likert',
  '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]',
  9,
  TRUE
);
```

> ⚠️ Registrar el cambio en `audit_log` manualmente si no se hace desde el dashboard.

---

## Variables de Entorno Requeridas

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Supabase > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anónima | Supabase > Settings > API > anon public |
| `VITE_CONSENT_VERSION` | Versión del consentimiento | Definida por el investigador (ej: `1.0`) |
| `VITE_APP_ENV` | Entorno (`development` o `production`) | Definida por el investigador |

---

## Notas Metodológicas

- Las preguntas de Desempeño Ocupacional están **basadas conceptualmente** en el AMPS (Assessment of Motor and Process Skills) como referencia. Este instrumento **no es el AMPS oficial** y no genera puntuaciones oficiales de dicho instrumento.
- Las estadísticas del dashboard son **exclusivamente descriptivas** (frecuencias, porcentajes, medias, medianas).
- No se realizan interpretaciones clínicas ni se categorizan puntuaciones como "normal", "anormal", "apto" o "no apto".

---

## Licencia

Uso académico exclusivo — Programa de Terapia Ocupacional, Clínica Día.

---

*Desarrollado con ❤️ para el Programa de Reinserción Socio-Laboral.*
