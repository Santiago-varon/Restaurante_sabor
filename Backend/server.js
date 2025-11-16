const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Rutas de la API

// Crear una reserva
app.post('/api/reservas', async (req, res) => {
    try {
        const { codigo, nombre, telefono, correo, fecha, hora, personas, comentarios, estado } = req.body;
        
        // Validación básica
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

// Obtener todas las reservas
app.get('/api/reservas', async (req, res) => {
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

// Actualizar reserva - panel
app.put('/api/reservas/:codigo/admin', async (req, res) => {
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
        
        console.log('🔄 Reserva actualizada desde panel admin:', codigo);
        res.json(rows[0]);
        
    } catch (error) {
        console.error('❌ Error al actualizar reserva:', error);
        res.status(500).json({ error: 'Error al actualizar la reserva' });
    }
});

// Eliminar reserva - panel 
app.delete('/api/reservas/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const query = 'DELETE FROM reservas WHERE codigo = ?';
        const [result] = await pool.query(query, [codigo]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        console.log('🗑️ Reserva eliminada:', codigo);
        res.json({ message: 'Reserva eliminada correctamente' });
        
    } catch (error) {
        console.error('❌ Error al eliminar reserva:', error);
        res.status(500).json({ error: 'Error al eliminar la reserva' });
    }
});

// Iniciar servidor
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`Servidor activo en http://localhost:${PORT}`);
        console.log(`Estado de la API: http://localhost:${PORT}/api/health`);
    });
}

startServer();