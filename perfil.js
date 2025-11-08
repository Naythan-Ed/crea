// perfil.js - Manejo del perfil de usuario (Corregido)

const API_URL = 'http://localhost:3000/api';

// ==================== OBTENER USUARIO ACTUAL ====================
function obtenerUsuarioActual() {
    // Intentar obtener de localStorage primero
    let usuario = localStorage.getItem('usuario_sesion');
    
    // Si no está en localStorage, intentar sessionStorage
    if (!usuario) {
        usuario = sessionStorage.getItem('usuario_sesion');
    }
    
    // Si se encontró, parsear el JSON
    if (usuario) {
        try {
            return JSON.parse(usuario);
        } catch (error) {
            console.error('Error parseando usuario:', error);
            return null;
        }
    }
    
    return null;
}

// ==================== CERRAR SESIÓN ====================
function cerrarSesion() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        // Limpiar ambos storages
        localStorage.removeItem('usuario_sesion');
        sessionStorage.removeItem('usuario_sesion');
        
        // Redirigir al login
        window.location.href = 'login.html';
    }
}

// Cargar información del perfil al cargar la página
document.addEventListener('DOMContentLoaded', cargarPerfil);

// ==================== CARGAR PERFIL ====================
function cargarPerfil() {
    // Ocultar loading inmediatamente
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    
    const usuario = obtenerUsuarioActual();
    
    console.log('Usuario obtenido:', usuario);
    
    if (!usuario) {
        const noSesionEl = document.getElementById('noSesion');
        if (noSesionEl) noSesionEl.style.display = 'block';
        return;
    }

    // Mostrar información del usuario
    const nombreCompletoEl = document.getElementById('nombreCompleto');
    if (nombreCompletoEl) {
        nombreCompletoEl.textContent = `${usuario.nombre} ${usuario.apellido}`;
    }
    
    const emailUsuarioEl = document.getElementById('emailUsuario');
    if (emailUsuarioEl) emailUsuarioEl.textContent = usuario.email;
    
    const telefonoUsuarioEl = document.getElementById('telefonoUsuario');
    if (telefonoUsuarioEl) telefonoUsuarioEl.textContent = `📞 ${usuario.telefono}`;
    
    // Avatar con inicial
    const avatarEl = document.getElementById('avatar');
    if (avatarEl) {
        avatarEl.textContent = usuario.nombre.charAt(0).toUpperCase();
    }

    // Información detallada
    const nombreEl = document.getElementById('nombre');
    if (nombreEl) nombreEl.textContent = usuario.nombre;
    
    const apellidoEl = document.getElementById('apellido');
    if (apellidoEl) apellidoEl.textContent = usuario.apellido;
    
    const emailEl = document.getElementById('email');
    if (emailEl) emailEl.textContent = usuario.email;
    
    const telefonoEl = document.getElementById('telefono');
    if (telefonoEl) telefonoEl.textContent = usuario.telefono;
    
    // Formatear fechas
    if (usuario.fecha_registro) {
        const fecha = new Date(usuario.fecha_registro);
        const fechaRegistroEl = document.getElementById('fechaRegistro');
        if (fechaRegistroEl) {
            fechaRegistroEl.textContent = fecha.toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }
    
    if (usuario.fecha_login) {
        const fecha = new Date(usuario.fecha_login);
        const fechaLoginEl = document.getElementById('fechaLogin');
        if (fechaLoginEl) {
            fechaLoginEl.textContent = fecha.toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Cargar pedidos del usuario
    cargarPedidos(usuario.id);

    // Mostrar contenido
    const perfilContentEl = document.getElementById('perfilContent');
    if (perfilContentEl) perfilContentEl.style.display = 'block';
}

// ==================== CARGAR PEDIDOS ====================
async function cargarPedidos(usuarioId) {
    try {
        const response = await fetch(`${API_URL}/pedidos/${usuarioId}`);
        const data = await response.json();
        
        if (data.success) {
            const totalPedidosEl = document.getElementById('totalPedidos');
            if (totalPedidosEl) {
                totalPedidosEl.textContent = data.pedidos.length;
            }
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        const totalPedidosEl = document.getElementById('totalPedidos');
        if (totalPedidosEl) totalPedidosEl.textContent = '0';
    }
}

// ==================== MOSTRAR FORMULARIO DE EDICIÓN ====================
function mostrarFormularioEdicion() {
    const usuario = obtenerUsuarioActual();
    
    if (!usuario) {
        alert('Error: No se pudo obtener la información del usuario');
        return;
    }

    // Llenar el formulario con los datos actuales
    document.getElementById('editNombre').value = usuario.nombre;
    document.getElementById('editApellido').value = usuario.apellido;
    document.getElementById('editEmail').value = usuario.email;
    document.getElementById('editTelefono').value = usuario.telefono;

    // Limpiar campos de contraseña
    document.getElementById('editPasswordActual').value = '';
    document.getElementById('editPasswordNueva').value = '';
    document.getElementById('editPasswordConfirm').value = '';

    // Ocultar mensajes
    document.getElementById('editErrorMessage').style.display = 'none';
    document.getElementById('editSuccessMessage').style.display = 'none';

    // Mostrar formulario y ocultar vista de perfil
    document.getElementById('vistaPerfilCard').style.display = 'none';
    document.getElementById('edicionPerfilCard').style.display = 'block';

    // Agregar evento al formulario
    const form = document.getElementById('editarPerfilForm');
    form.removeEventListener('submit', handleEditarPerfil);
    form.addEventListener('submit', handleEditarPerfil);
}

// ==================== CANCELAR EDICIÓN ====================
function cancelarEdicion() {
    document.getElementById('vistaPerfilCard').style.display = 'block';
    document.getElementById('edicionPerfilCard').style.display = 'none';
    
    // Limpiar mensajes
    document.getElementById('editErrorMessage').style.display = 'none';
    document.getElementById('editSuccessMessage').style.display = 'none';
}

// ==================== EDITAR PERFIL ====================
async function handleEditarPerfil(e) {
    e.preventDefault();
    
    const usuario = obtenerUsuarioActual();
    
    if (!usuario) {
        mostrarMensaje('editErrorMessage', 'Error: No se pudo obtener la información del usuario');
        return;
    }

    const nombre = document.getElementById('editNombre').value.trim();
    const apellido = document.getElementById('editApellido').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const telefono = document.getElementById('editTelefono').value.trim();
    
    const passwordActual = document.getElementById('editPasswordActual').value;
    const passwordNueva = document.getElementById('editPasswordNueva').value;
    const passwordConfirm = document.getElementById('editPasswordConfirm').value;

    const errorDiv = document.getElementById('editErrorMessage');
    const successDiv = document.getElementById('editSuccessMessage');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // Validaciones
    if (!nombre || !apellido || !email || !telefono) {
        mostrarMensaje('editErrorMessage', 'Por favor completa todos los campos obligatorios');
        return;
    }

    if (!validarEmail(email)) {
        mostrarMensaje('editErrorMessage', 'Email inválido');
        return;
    }

    // Validar cambio de contraseña si se ingresó algún campo
    if (passwordActual || passwordNueva || passwordConfirm) {
        if (!passwordActual || !passwordNueva || !passwordConfirm) {
            mostrarMensaje('editErrorMessage', 'Para cambiar la contraseña debes completar todos los campos de contraseña');
            return;
        }
        
        if (passwordNueva.length < 6) {
            mostrarMensaje('editErrorMessage', 'La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        if (passwordNueva !== passwordConfirm) {
            mostrarMensaje('editErrorMessage', 'Las contraseñas nuevas no coinciden');
            return;
        }
    }

    try {
        const datosActualizar = {
            id: usuario.id,
            nombre,
            apellido,
            email,
            telefono
        };

        // Si se está cambiando la contraseña, agregarla
        if (passwordActual && passwordNueva) {
            datosActualizar.password_actual = passwordActual;
            datosActualizar.password_nueva = passwordNueva;
        }

        const response = await fetch(`${API_URL}/actualizar-perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosActualizar)
        });

        const data = await response.json();

        if (data.error) {
            mostrarMensaje('editErrorMessage', data.error);
            return;
        }

        if (data.success) {
            // Actualizar datos en sesión
            const usuarioActualizado = {
                ...usuario,
                nombre,
                apellido,
                email,
                telefono
            };

            // Guardar en el mismo storage que se usó originalmente
            const storage = localStorage.getItem('usuario_sesion') ? localStorage : sessionStorage;
            storage.setItem('usuario_sesion', JSON.stringify(usuarioActualizado));

            mostrarMensaje('editSuccessMessage', '✅ Perfil actualizado exitosamente');

            // Recargar la información del perfil
            setTimeout(() => {
                cancelarEdicion();
                cargarPerfil();
            }, 2000);
        }

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        mostrarMensaje('editErrorMessage', 'Error de conexión con el servidor');
    }
}

// ==================== FUNCIONES AUXILIARES ====================
function mostrarMensaje(elementId, mensaje) {
    const elemento = document.getElementById(elementId);
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}