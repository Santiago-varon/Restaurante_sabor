// URL de la API
const API_URL = 'http://localhost:3000/api';

// Variable global para almacenar reservas
let reservasAdmin = [];

// Obtener sessionId
function getSessionId() {
    return localStorage.getItem('sessionId');
}

// Headers con autenticación
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'session-id': getSessionId()
    };
}

// Verificar si está logueado
async function verificarAutenticacion() {
    const sessionId = getSessionId();
    
    if (!sessionId) {
        window.location.href = 'auth/login.html';
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/verificar`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Sesión inválida');
        }
        
        const data = await response.json();
        
        // Mostrar nombre del usuario
        const usuarioInfo = document.getElementById('usuarioInfo');
        if (usuarioInfo) {
            usuarioInfo.innerHTML = `<i class="fas fa-user"></i> ${data.usuario.nombre}`;
        }
        
        return true;
    } catch (error) {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('usuario');
        window.location.href = 'auth/login.html';
        return false;
    }
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        const sessionId = getSessionId();
        if (sessionId) {
            fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
        }
        localStorage.removeItem('sessionId');
        localStorage.removeItem('usuario');
        window.location.href = 'auth/login.html';
    }
}

// Función para cargar reservas desde la API
async function cargarReservasAdmin() {
    try {
        const response = await fetch(`${API_URL}/reservas`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                cerrarSesion();
                return;
            }
            throw new Error('Error al cargar reservas');
        }
        
        reservasAdmin = await response.json();
        actualizarEstadisticas();
        mostrarReservas(reservasAdmin);
        
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        mostrarMensajeAdmin('Error al cargar las reservas', 'error');
    }
}

// Actualizar estadísticas del panel
function actualizarEstadisticas() {
    const confirmadas = reservasAdmin.filter(r => r.estado === 'confirmada').length;
    const canceladas = reservasAdmin.filter(r => r.estado === 'cancelada').length;
    const totalPersonas = reservasAdmin.reduce((sum, r) => sum + parseInt(r.personas || 0), 0);

    document.getElementById('totalReservas').textContent = reservasAdmin.length;
    document.getElementById('reservasConfirmadas').textContent = confirmadas;
    document.getElementById('reservasCanceladas').textContent = canceladas;
    document.getElementById('totalPersonas').textContent = totalPersonas;
}

// Mostrar reservas en la tabla
function mostrarReservas(lista) {
    const tbody = document.getElementById('reservasBody');
    
    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h3>No hay reservas</h3>
                        <p>Las reservas aparecerán aquí cuando los clientes las realicen</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista.map(reserva => `
        <tr>
            <td><strong>${reserva.codigo}</strong></td>
            <td>${reserva.nombre}</td>
            <td>${new Date(reserva.fecha).toLocaleDateString('es-ES')}</td>
            <td>${reserva.hora}</td>
            <td><i class="fas fa-users" style="color: var(--color-primary); margin-right: 6px;"></i>${reserva.personas}</td>
            <td>${reserva.telefono}</td>
            <td>${reserva.comentarios || 'Sin comentarios'}</td>
            <td><span class="status-badge status-${reserva.estado}">${reserva.estado}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success btn-icon" onclick="editarReserva('${reserva.codigo}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-icon" onclick="eliminarReservaAdmin('${reserva.codigo}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Aplicar filtros
function aplicarFiltros() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const fecha = document.getElementById('filterFecha').value;
    const estado = document.getElementById('filterEstado').value;

    let filtradas = reservasAdmin.filter(r => {
        const matchSearch = !search || 
            r.codigo.toLowerCase().includes(search) || 
            r.nombre.toLowerCase().includes(search);
        
        let matchFecha = true;
        if (fecha) {
            const fechaReserva = new Date(r.fecha).toISOString().split('T')[0];
            matchFecha = fechaReserva === fecha;
        }
        
        const matchEstado = !estado || r.estado === estado;
        
        return matchSearch && matchFecha && matchEstado;
    });

    mostrarReservas(filtradas);
}

// Editar reserva
function editarReserva(codigo) {
    const reserva = reservasAdmin.find(r => r.codigo === codigo);
    if (!reserva) return;

    document.getElementById('editCodigo').value = reserva.codigo;
    document.getElementById('editNombre').value = reserva.nombre;
    document.getElementById('editTelefono').value = reserva.telefono;
    document.getElementById('editFecha').value = reserva.fecha;
    document.getElementById('editHora').value = reserva.hora;
    document.getElementById('editPersonas').value = reserva.personas;
    document.getElementById('editEstado').value = reserva.estado;
    document.getElementById('editComentarios').value = reserva.comentarios || '';

    document.getElementById('editModal').style.display = 'flex';
}

// Cerrar modal
function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Guardar cambios de edición
async function guardarEdicion(e) {
    e.preventDefault();
    
    const codigo = document.getElementById('editCodigo').value;
    
    const datosActualizados = {
        nombre: document.getElementById('editNombre').value,
        telefono: document.getElementById('editTelefono').value,
        fecha: document.getElementById('editFecha').value,
        hora: document.getElementById('editHora').value,
        personas: parseInt(document.getElementById('editPersonas').value),
        estado: document.getElementById('editEstado').value,
        comentarios: document.getElementById('editComentarios').value,
        correo: reservasAdmin.find(r => r.codigo === codigo)?.correo || ''
    };
    
    try {
        const response = await fetch(`${API_URL}/reservas/${codigo}/admin`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(datosActualizados)
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar la reserva');
        }
        
        await cargarReservasAdmin();
        cerrarModal('editModal');
        mostrarMensajeAdmin('Reserva actualizada correctamente', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeAdmin('Error al actualizar la reserva', 'error');
    }
}

// Eliminar reserva
async function eliminarReservaAdmin(codigo) {
    if (!confirm('¿Estás seguro de eliminar esta reserva?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservas/${codigo}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar la reserva');
        }
        
        await cargarReservasAdmin();
        mostrarMensajeAdmin('Reserva eliminada correctamente', 'info');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeAdmin('Error al eliminar la reserva', 'error');
    }
}

// Limpiar todas las reservas
async function limpiarTodasReservas() {
    if (!confirm('¿Estás seguro de eliminar TODAS las reservas? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const promesas = reservasAdmin.map(r => 
            fetch(`${API_URL}/reservas/${r.codigo}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            })
        );
        
        await Promise.all(promesas);
        await cargarReservasAdmin();
        mostrarMensajeAdmin('Todas las reservas fueron eliminadas', 'info');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeAdmin('Error al limpiar las reservas', 'error');
    }
}

// Exportar reporte CSV
function exportarReporte() {
    if (reservasAdmin.length === 0) {
        alert('No hay reservas para exportar');
        return;
    }
    
    let csv = 'Código,Nombre,Teléfono,Correo,Fecha,Hora,Personas,Estado,Comentarios\n';
    
    reservasAdmin.forEach(r => {
        csv += `${r.codigo},${r.nombre},${r.telefono},${r.correo || ''},${r.fecha},${r.hora},${r.personas},${r.estado},"${r.comentarios || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas_el_sabor_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    mostrarMensajeAdmin('📥 Reporte exportado correctamente', 'success');
}

// Mostrar mensaje en el panel admin
function mostrarMensajeAdmin(texto, tipo = 'success') {
    let mensaje = document.getElementById('mensajeAdmin');
    
    if (!mensaje) {
        mensaje = document.createElement('div');
        mensaje.id = 'mensajeAdmin';
        mensaje.className = 'mensaje';
        mensaje.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 2000;
        `;
        document.body.appendChild(mensaje);
    }
    
    const colores = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    mensaje.style.backgroundColor = colores[tipo] || colores.success;
    mensaje.innerHTML = texto;
    mensaje.style.display = 'block';
    
    setTimeout(() => {
        mensaje.style.display = 'none';
    }, 3000);
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación primero
    const autenticado = await verificarAutenticacion();
    
    if (!autenticado) {
        return; // Ya se redirigió a login
    }
    
    cargarReservasAdmin();
    
    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
    document.getElementById('filterFecha').addEventListener('change', aplicarFiltros);
    document.getElementById('filterEstado').addEventListener('change', aplicarFiltros);
    document.getElementById('editForm').addEventListener('submit', guardarEdicion);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Recargar cada 30 segundos
    setInterval(cargarReservasAdmin, 30000);
});