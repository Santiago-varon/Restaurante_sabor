Sistema de Reservas – Restaurante El Sabor

Sistema completo para la gestión de reservas de un restaurante, con API REST en Node.js y un panel administrativo para control interno.

 Requisitos

•	Node.js v20 o superior
•	MySQL o MariaDB
•	npm

 Instalación
1.	Clonar el repositorio
git clone https://github.com/tu-usuario/restaurante-reservas.git
cd restaurante-reservas

2.	Configurar la base de datos
Opción A: Importar por terminal
mysql -u root -p < restaurante_sabor.sql

Opción B: Importar desde phpMyAdmin
1.	Abrir phpMyAdmin
2.	Crear una base de datos llamada restaurante_sabor
3.	Importar el archivo restaurante_sabor.sql

3.	Configurar variables de entorno
Dentro del directorio Backend, editar el archivo .env:
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=su_contraseña
DB_NAME=restaurante_sabor

4.	Instalar dependencias
cd Backend
npm install

5.	Iniciar el servidor
npm run dev


La API estará disponible en:
 http://localhost:3000

 Uso del Sistema
 Cliente (Frontend)
1.	Abrir: Frontend/index.html
2.	Usar "Reservar ahora" para crear una reserva
3.	Consultar reservas con "Consulta tu mesa" mediante código y correo

 Panel Administrativo
1.	Abrir: Frontend/panel.html
2.	Visualizar todas las reservas y estadísticas
3.	Editar, cancelar o eliminar reservas
 Endpoints de la API
 Reservas
Método	Endpoint						Descripción
GET		/api/reservas					Obtener todas las reservas
GET		/api/reservas/:codigo?correo=email	Buscar reserva por código y correo
POST		/api/reservas					Crear nueva reserva
PUT		/api/reservas/:codigo				Cambiar estado de reserva
PUT		/api/reservas/:codigo/admin		Actualizar completamente una reserva
DELETE	/api/reservas/:codigo				Eliminar reserva

Salud del servidor
Método	Endpoint		Descripción
GET		/api/health	Verificar estado de la API


Tecnologías Utilizadas
•	Backend: Node.js, Express, MySQL
•	Frontend: HTML5, CSS, JavaScript
•	Base de datos: MySQL 


Autor
•	Jhonatan Santiago Varón Ramírez – SENA 2025

 Notas Importantes
•	El backend debe estar activo para que el frontend funcione
•	Verificar que MySQL esté instalado y ejecutándose
•	Configurar correctamente el archivo .env
•	La base de datos se crea automáticamente al importar el archivo SQL
