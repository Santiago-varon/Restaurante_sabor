// configuracion de la API
const API_URL = 'https://restaurantesabor-production.up.railway.app/api';

// generar codigo
function generarCodigo() {
    return 'RES' + (Math.floor(Math.random() * 90000) + 10000);
}

// abrir modal
function abrir(id){
    document.getElementById(id).style.display="flex";
}

// cerrar modal
function cerrar(id){
    document.getElementById(id).style.display="none";
    if(id === 'modal1') {
        document.getElementById('reservaForm').reset();
    }
    if(id === 'modal2') {
        document.getElementById('codigoConsulta').value = '';
        document.getElementById('correoConsulta').value = '';
        document.getElementById('resultadoConsulta').innerHTML = '';
    }
}

// mostrar mensaje
function mostrarMensaje(texto, tipo = 'success') {
    const mensaje = document.getElementById('mensaje');
    mensaje.className = `mensaje ${tipo}`;
    mensaje.innerHTML = texto;
    mensaje.style.display = 'block';
    
    setTimeout(() => {
        mensaje.style.display = 'none';
    }, 3000);
}

// confirmar reserva
async function confirmarReserva() {
    const form = document.getElementById('reservaForm');
    
    if (!form.checkValidity()) {
        mostrarMensaje('Completa todos los campos', 'error');
        return false;
    }
    
    const reserva = {
        codigo: generarCodigo(),
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        correo: document.getElementById('correo').value,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        personas: document.getElementById('personas').value,
        comentarios: document.getElementById('comentarios').value || 'Sin comentarios',
        estado: 'confirmada'
    };
    
    // no se pueda reservar fechas pasadas
    const fechaReserva = new Date(reserva.fecha);
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    if (fechaReserva < hoy) {
        mostrarMensaje('No puedes reservar fechas pasadas', 'error');
        return false;
    }
    
    try {
        // Enviar a API
        const response = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reserva)
        });
        
        if (!response.ok) {
            throw new Error('Error al crear la reserva');
        }
        
        const data = await response.json();
        
        // mostrar confirmacion
        mostrarConfirmacion(data);
        cerrar('modal1');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al crear la reserva. Intenta de nuevo.', 'error');
    }
    
    return false;
}

// mostrar confirmacion
function mostrarConfirmacion(reserva) {
    document.getElementById('codigoGenerado').textContent = reserva.codigo;
    
    const detalles = `
        <div class="detalles">
            <h4>Detalles:</h4>
            <p><strong>Nombre:</strong> ${reserva.nombre}</p>
            <p><strong>Fecha:</strong> ${new Date(reserva.fecha).toLocaleDateString('es-ES')}</p>
            <p><strong>Hora:</strong> ${reserva.hora}</p>
            <p><strong>Personas:</strong> ${reserva.personas}</p>
            <p><strong>Estado:</strong> <span style="color: green;">Confirmada</span></p>
        </div>
    `;
    
    document.getElementById('detallesReserva').innerHTML = detalles;
    abrir('modal3');
    mostrarMensaje('¡Reserva Hecha!', 'success');
}

// buscar reserva
async function buscarReserva() {
    const codigo = document.getElementById('codigoConsulta').value.trim().toUpperCase();
    const correo = document.getElementById('correoConsulta').value.trim();
    
    if (!codigo || !correo) {
        mostrarMensaje('Ingresa código y correo', 'error');
        return;
    }
    
    try {
        // Buscar en la API
        const response = await fetch(`${API_URL}/reservas/${codigo}?correo=${encodeURIComponent(correo)}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                document.getElementById('resultadoConsulta').innerHTML = `
                    <div style="color: red; margin-top: 15px; text-align: center;">
                        <h4>Reserva no encontrada</h4>
                        <p>Verifica el código y correo</p>
                    </div>
                `;
                mostrarMensaje('No se encontró la reserva', 'error');
                return;
            }
            throw new Error('Error al buscar la reserva');
        }
        
        const reserva = await response.json();
        
        // mostrar reserva
        const estadoColor = reserva.estado === 'confirmada' ? 'green' : 'red';
        const estadoTexto = reserva.estado === 'confirmada' ? 'Confirmada' : 'Cancelada';
        
        document.getElementById('resultadoConsulta').innerHTML = `
            <div class="detalles">
                <h4>Reserva ${reserva.codigo}</h4>
                <p><strong>Nombre:</strong> ${reserva.nombre}</p>
                <p><strong>Fecha:</strong> ${new Date(reserva.fecha).toLocaleDateString('es-ES')}</p>
                <p><strong>Hora:</strong> ${reserva.hora}</p>
                <p><strong>Personas:</strong> ${reserva.personas}</p>
                <p><strong>Teléfono:</strong> ${reserva.telefono}</p>
                <p><strong>Estado:</strong> <span style="color: ${estadoColor};">${estadoTexto}</span></p>
                ${reserva.estado === 'confirmada' ? `
                    <button class="btn cancel" onclick="cancelarReserva('${reserva.codigo}')" style="margin-top: 10px;">
                        Cancelar Reserva
                    </button>
                ` : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al buscar la reserva', 'error');
    }
}

// cancelar reserva
async function cancelarReserva(codigo) {
    if (!confirm('¿Seguro que quieres cancelar?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservas/${codigo}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado: 'cancelada' })
        });
        
        if (!response.ok) {
            throw new Error('Error al cancelar la reserva');
        }
        
        buscarReserva();
        mostrarMensaje('Reserva cancelada', 'info');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cancelar la reserva', 'error');
    }
}

// scroll 
var enlaces = document.querySelectorAll('a[href^="#"]');
for (var i = 0; i < enlaces.length; i++) {
    enlaces[i].addEventListener('click', function (e) {
        e.preventDefault();
        var destino = document.querySelector(this.getAttribute('href'));
        if (destino) {
            destino.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}

// cuando cargue la pagina
document.addEventListener('DOMContentLoaded', function() {
    // fecha minima hoy
    document.getElementById('fecha').min = new Date().toISOString().split('T')[0];
    
    document.getElementById('reservaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        confirmarReserva();
    });
    
    // cerrar modal
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    };
});

// Menú funcional
const btnMenu = document.getElementById('btnMenu');
const menuNavegacion = document.getElementById('menuNavegacion');
btnMenu.addEventListener('click', function() {
    menuNavegacion.classList.toggle('activo');
    btnMenu.classList.toggle('activo');
});
