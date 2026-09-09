# Control de Gastos - Fundación Kinal

Aplicación web para el control de finanzas personales desarrollada para Fundación Kinal. Permite registrar y clasificar ingresos y gastos, ver gráficos de evolución y distribución por categoría, definir una meta de ahorro mensual y detectar los llamados "gastos vampiros" (aquellos que se escapan del presupuesto sin darnos cuenta).

## Funcionalidades

- Inicio de sesión con correo y contraseña usando JWT, con opción de entrar con cuenta de Google.
- Dos perfiles de usuario: administrador y usuario normal.
- Panel principal con balance neto, totales de ingresos y gastos, un indicador tipo manómetro hacia una meta mensual y avisos según el estado financiero.
- Módulo de ingresos con categorías (Salario, Bono, Ventas, Inversiones, Negocio, Regalo, Otros), gráfico de evolución y distribución por categoría, y exportación a CSV.
- Módulo de gastos con categorías (Alimentación, Transporte, Servicios, Entretenimiento, Salud, Educación, Hogar, Otros), método de pago (Efectivo, Transferencia, Tarjeta), clasificación de gastos fijos, variables y vampiros, gráfico de evolución de los últimos seis meses, dona de distribución y exportación a CSV.
- Sección de gastos vampiros: un interruptor por gasto para marcarlo como "controlado". Al marcarlo el gasto se excluye de los totales y del gráfico, como simulador de lo que se ahorraría dejando de hacerlo.
- Módulo de ahorros con meta mensual, registro de aportes, dona de progreso, tabla de movimientos y tarjeta motivacional.
- Búsqueda y filtro de registros por mes, año o todo dentro de cada módulo.
- Notificaciones y mensajes locales guardados por usuario en el navegador.
- Temporizador de sesión visible en la parte superior que muestra el tiempo restante y avisa cuando está por expirar.
- Edición de perfil (nombre, correo, foto) y cambio de contraseña.
- Diseño oscuro con barra lateral de navegación entre módulos.

## Tecnologías

### Backend
- Node.js y TypeScript.
- Express para la API.
- PostgreSQL como base de datos.
- TypeORM como ORM.
- JWT para autenticación.
- bcryptjs para el cifrado de contraseñas.
- helmet y cors para seguridad y control de acceso.

### Frontend
- Angular 18 (componentes standalone).
- TypeScript.
- CSS incrustado por componente.
- Font Awesome para iconos.
- FormsModule y ReactiveFormsModule de Angular.

## Estructura del proyecto

```
Control_de_Gastos/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuración de la conexión a la base de datos
│   │   ├── controllers/  # Lógica de las rutas (auth, gastos, ingresos)
│   │   ├── entities/     # Modelos User, Gasto e Ingreso
│   │   ├── middlewares/  # Verificación del token JWT
│   │   ├── routes/       # Definición de endpoints
│   │   ├── services/     # Lógica de negocio
│   │   ├── index.ts      # Punto de entrada del servidor
│   │   └── seed.ts       # Crea los usuarios iniciales
│   ├── .env              # Variables de entorno locales
│   └── package.json
├── frontend/
│   └── control-gastos-frontend/
│       └── src/
│           └── app/
│               ├── auth/          # Login y guard de rutas
│               ├── dashboard/     # Dashboard, ingresos, gastos, ahorros, perfil
│               ├── interceptors/  # Inyección del token en las peticiones
│               ├── models/        # Modelo de usuario
│               └── services/      # Llamadas a la API y control de sesión
└── README.md
```

## Puesta en marcha

### Requisitos

- Node.js 18 o superior.
- pnpm.
- PostgreSQL 14 o superior.
- Angular CLI 18.

### Base de datos

Crear una base de datos llamada `control_gastos`. En el archivo `backend/.env` (o `.env.example`) se configuran los datos de conexión:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=admin
DB_DATABASE=control_gastos
```

El servidor crea las tablas automáticamente al arrancar (la sincronización del esquema está activada). Para cargar los usuarios iniciales se ejecuta el seed:

```
pnpm ts-node src/seed.ts
```

### Backend

```
cd backend
pnpm install
pnpm dev
```

Queda escuchando en `http://localhost:3000`.

### Frontend

```
cd frontend/control-gastos-frontend
pnpm install
pnpm start
```

Se abre en `http://localhost:4200`.

## Credenciales de acceso

- Administrador: `admin@kinal.org` / `Admin123!`
- Usuario: `usuario@kinal.org` / `User123!`

En la pantalla de login hay botones que rellenan estas credenciales automáticamente.

## API

Todas las rutas de gastos e ingresos requieren el token JWT (encabezado `Authorization: Bearer <token>`).

### Autenticación (`/api/auth`)
- `POST /login`: iniciar sesión.
- `POST /google`: iniciar sesión con el token de Google Sign-In.
- `POST /refresh`: renovar el token.
- `PATCH /perfil`: actualizar nombre, correo o foto.
- `PUT /cambiar-password`: cambiar la contraseña.

### Gastos (`/api/gastos`)
- `GET /`: listar, acepta `mes` y `anio`.
- `GET /resumen`: total por categoría.
- `GET /:id`: obtener uno.
- `POST /`: crear.
- `PUT /:id`: actualizar.
- `DELETE /:id`: eliminar.

### Ingresos (`/api/ingresos`)
- `GET /`: listar, acepta `mes` y `anio`.
- `GET /resumen`: total por categoría.
- `GET /:id`: obtener uno.
- `POST /`: crear.
- `PUT /:id`: actualizar.
- `DELETE /:id`: eliminar.

Además hay un endpoint `GET /health` para comprobar que el servidor responde.

## Datos que se guardan en el navegador

El módulo de ahorros, la meta mensual, los gastos vampiros controlados y las notificaciones se guardan en `localStorage` por usuario, no en la base de datos. Si se borran los datos del navegador, esos registros se pierden.
