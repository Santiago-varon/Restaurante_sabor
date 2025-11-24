# Sistema de Reservas – Restaurante El Sabor

Sistema completo para la gestión de reservas de un restaurante, con API REST en Node.js y un panel administrativo para control interno.

## Requisitos

- Node.js v20 o superior
- MySQL o MariaDB
- npm

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/Santiago-varon/Restaurante_sabor.git
cd restaurante-reservas
```

### 2. Configurar la base de datos

#### Opción A: Importar por terminal
```bash
mysql -u root -p < restaurante_sabor.sql
```

#### Opción B: Importar desde phpMyAdmin

1. Abrir phpMyAdmin
2. Crear una base de datos llamada `restaurante_sabor`
3. Importar el archivo `restaurante_sabor.sql`

### 3. Configurar variables de entorno

Dentro del directorio Backend, crear el archivo `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=su_contraseña
DB_NAME=restaurante_sabor
```

### 4. Instalar dependencias
```bash
cd Backend
npm install
```

### 5. Iniciar el servidor
```bash
npm run dev
```

La API estará disponible en: http://localhost:3000

## Uso del Sistema

### Cliente (Frontend)

1. Abrir: `http://localhost:3000/index.html` (después de iniciar el servidor)
2. Usar "Reservar ahora" para crear una reserva
3. Consultar reservas con "Consulta tu mesa" mediante código y correo

### Panel Administrativo (Requiere autenticación)

1. **Registrar empleado:** Abrir `http://localhost:3000/auth/registro.html` y crear una cuenta
2. **Iniciar sesión:** Abrir `http://localhost:3000/auth/login.html` e ingresar con correo y contraseña
3. **Acceder al panel:** Después del login, serás redirigido automáticamente al panel administrativo
4. Visualizar todas las reservas y estadísticas
5. Editar, cancelar o eliminar reservas
6. Exportar reportes en CSV

## Endpoints de la API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/registro` | Registrar nuevo empleado |
| POST | `/api/auth/login` | Iniciar sesión (retorna sessionId) |
| GET | `/api/auth/verificar` | Verificar sesión (requiere autenticación) |
| POST | `/api/auth/logout` | Cerrar sesión |

### Reservas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reservas` | Obtener todas las reservas (requiere autenticación) |
| GET | `/api/reservas/:codigo?correo=email` | Buscar reserva por código y correo |
| POST | `/api/reservas` | Crear nueva reserva |
| PUT | `/api/reservas/:codigo` | Cambiar estado de reserva |
| PUT | `/api/reservas/:codigo/admin` | Actualizar completamente una reserva (requiere autenticación) |
| DELETE | `/api/reservas/:codigo` | Eliminar reserva (requiere autenticación) |

### Salud del servidor

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Verificar estado de la API |

## Tecnologías Utilizadas

- **Backend:** Node.js, Express, MySQL, bcrypt
- **Frontend:** HTML5, CSS, JavaScript, React (CDN)
- **Base de datos:** MySQL

## Autor

Jhonatan Santiago Varón Ramírez – SENA 2025

## Notas Importantes

- El backend debe estar activo para que el frontend funcione
- Verificar que MySQL esté instalado y ejecutándose
- Configurar correctamente el archivo `.env` con todas las variables
- La base de datos se crea automáticamente al importar el archivo SQL
- **Importante:** El panel administrativo ahora requiere autenticación. Debes registrar un empleado primero
- Las contraseñas se almacenan de forma segura usando bcrypt
