const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ debug: false });

const app = express();
const PORT = process.env.PORT || 3000;

const sesiones = {};

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../Frontend')));

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restaurante_sabor'
};

// Pool de conexiones
let pool;

async function initializeDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Base de datos conectada - Restaurante El Sabor');
        
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1);
    }
}

function verificarSesion(req, res, next) {
    const sessionId = req.headers['session-id'];
    
    if (!sessionId || !sesiones[sessionId]) {
        return res.status(401).json({ error: 'No has iniciado sesión' });
    }
    
    req.usuario = sesiones[sessionId];
    next();
}

app.post('/api/auth/registro', async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;
        
        if (!nombre || !correo || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }
        
        const [existe] = await pool.query('SELECT id FROM empleados WHERE correo = ?', [correo]);
        if (existe.length > 0) {
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO empleados (nombre, correo, password) VALUES (?, ?, ?)';
        const [result] = await pool.query(query, [nombre, correo, passwordHash]);
        
        const [rows] = await pool.query('SELECT id, nombre, correo, rol FROM empleados WHERE id = ?', [result.insertId]);
        
        console.log('Empleado registrado:', correo);
        res.status(201).json({ 
            message: 'Empleado registrado correctamente',
            usuario: rows[0]
        });
        
    } catch (error) {
        console.error('Error al registrar empleado:', error);
        res.status(500).json({ error: 'Error al registrar el empleado' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { correo, password } = req.body;
        
        if (!correo || !password) {
            return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
        }
        
        const [rows] = await pool.query('SELECT * FROM empleados WHERE correo = ?', [correo]);
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const empleado = rows[0];
        
        const passwordValida = await bcrypt.compare(password, empleado.password);
        
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const sessionId = Date.now() + '-' + Math.random();
        sesiones[sessionId] = {
            id: empleado.id,
            nombre: empleado.nombre,
            correo: empleado.correo,
            rol: empleado.rol
        };
        
        console.log('Empleado inició sesión:', correo);
        res.json({
            message: 'Inicio de sesión exitoso',
            sessionId: sessionId,
            usuario: {
                id: empleado.id,
                nombre: empleado.nombre,
                correo: empleado.correo,
                rol: empleado.rol
            }
        });
        
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

app.get('/api/auth/verificar', verificarSesion, (req, res) => {
    res.json({ usuario: req.usuario });
});

app.post('/api/auth/logout', verificarSesion, (req, res) => {
    const sessionId = req.headers['session-id'];
    delete sesiones[sessionId];
    res.json({ message: 'Sesión cerrada' });
});

// Crear una reserva
app.post('/api/reservas', async (req, res) => {
    try {
        const { codigo, nombre, telefono, correo, fecha, hora, personas, comentarios, estado } = req.body;
        
        if (!codigo || !nombre || !telefono || !correo || !fecha || !hora || !personas) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        
        const query = `
            INSERT INTO reservas (codigo, nombre, telefono, correo, fecha, hora, personas, comentarios, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(query, [
            codigo, nombre, telefono, correo, fecha, hora, personas, 
            comentarios || 'Sin comentarios', estado || 'confirmada'
        ]);
        
        // Obtener la reserva creada
        const [rows] = await pool.query('SELECT * FROM reservas WHERE id = ?', [result.insertId]);
        
        console.log('Reserva creada:', codigo);
        res.status(201).json(rows[0]);
        
    } catch (error) {
        console.error('Error al crear reserva:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El código de reserva ya existe' });
        }
        
        res.status(500).json({ error: 'Error al crear la reserva' });
    }
});

// Buscar una reserva por código y correo
app.get('/api/reservas/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { correo } = req.query;
        
        if (!correo) {
            return res.status(400).json({ error: 'El correo es requerido' });
        }
        
        const query = 'SELECT * FROM reservas WHERE codigo = ? AND correo = ?';
        const [rows] = await pool.query(query, [codigo, correo]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        console.log('Reserva encontrada:', codigo);
        res.json(rows[0]);
        
    } catch (error) {
        console.error('Error al buscar reserva:', error);
        res.status(500).json({ error: 'Error al buscar la reserva' });
    }
});

// Actualizar estado de una reserva (cancelar)
app.put('/api/reservas/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { estado } = req.body;
        
        if (!estado) {
            return res.status(400).json({ error: 'El estado es requerido' });
        }
        
        const query = 'UPDATE reservas SET estado = ? WHERE codigo = ?';
        const [result] = await pool.query(query, [estado, codigo]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        // Obtener la reserva actualizada
        const [rows] = await pool.query('SELECT * FROM reservas WHERE codigo = ?', [codigo]);
        
        console.log('Reserva actualizada:', codigo);
        res.json(rows[0]);
        
    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({ error: 'Error al actualizar la reserva' });
    }
});

// Obtener todas las reservas (protegida)
app.get('/api/reservas', verificarSesion, async (req, res) => {
    try {
        const query = 'SELECT * FROM reservas ORDER BY fecha DESC, hora DESC';
        const [rows] = await pool.query(query);
        
        res.json(rows);
        
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ error: 'Error al obtener las reservas' });
    }
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Actualizar reserva - panel (protegida)
app.put('/api/reservas/:codigo/admin', verificarSesion, async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nombre, telefono, correo, fecha, hora, personas, estado, comentarios } = req.body;
        
        const query = `
            UPDATE reservas 
            SET nombre = ?, telefono = ?, correo = ?, fecha = ?, hora = ?, 
                personas = ?, estado = ?, comentarios = ?
            WHERE codigo = ?
        `;
        
        const [result] = await pool.query(query, [
            nombre, telefono, correo, fecha, hora, personas, estado, 
            comentarios || 'Sin comentarios', codigo
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        const [rows] = await pool.query('SELECT * FROM reservas WHERE codigo = ?', [codigo]);
        
        console.log('Reserva actualizada desde panel admin:', codigo);
        res.json(rows[0]);
        
    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({ error: 'Error al actualizar la reserva' });
    }
});

// Eliminar reserva - panel (protegida)
app.delete('/api/reservas/:codigo', verificarSesion, async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const query = 'DELETE FROM reservas WHERE codigo = ?';
        const [result] = await pool.query(query, [codigo]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        console.log('Reserva eliminada:', codigo);
        res.json({ message: 'Reserva eliminada correctamente' });
        
    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        res.status(500).json({ error: 'Error al eliminar la reserva' });
    }
});

// Iniciar servidor
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`✅ Servidor activo en http://localhost:${PORT}`);
    });
}

startServer();