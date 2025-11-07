// registro.js - Sistema de autenticación COMPLETO Y CORREGIDO

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registroForm) {
        registroForm.addEventListener('submit', handleRegistro);
    }
    
    verificarSesionActiva();
});

// ==================== FUNCIONES DE LOGIN ====================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const recordar = document.getElementById('recordar').checked;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const loading = document.getElementById('loading');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (!email || !password) {
        mostrarError(errorDiv, 'Por favor completa todos los campos');
        return;
    }
    
    loading.style.display = 'block';
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        loading.style.display = 'none';
        
        if (data.error) {
            mostrarError(errorDiv, data.error);
            return;
        }
        
        if (data.success) {
            // Guardar sesión
            const storage = recordar ? localStorage : sessionStorage;
            storage.setItem('usuario_sesion', JSON.stringify(data.usuario));
            
            // ✅ VERIFICAR SI ES ADMIN por email
            if (data.usuario.email === 'admin@gmail.com') {
                mostrarExito(successDiv, '¡Bienvenido Administrador!');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                mostrarExito(successDiv, '¡Bienvenido ' + data.usuario.nombre + '!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        }
        
    } catch (error) {
        loading.style.display = 'none';
        mostrarError(errorDiv, 'Error de conexión con el servidor. Asegúrate de que el servidor esté corriendo.');
        console.error('Error:', error);
    }
}

// ==================== FUNCIONES DE REGISTRO ====================

async function handleRegistro(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const loading = document.getElementById('loading');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Validaciones del lado del cliente
    if (!nombre || !apellido || !email || !telefono || !password || !confirmPassword) {
        mostrarError(errorDiv, 'Por favor completa todos los campos');
        return;
    }
    
    if (!validarEmail(email)) {
        mostrarError(errorDiv, 'Email inválido');
        return;
    }
    
    if (password.length < 6) {
        mostrarError(errorDiv, 'La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (password !== confirmPassword) {
        mostrarError(errorDiv, 'Las contraseñas no coinciden');
        return;
    }
    
    loading.style.display = 'block';
    
    try {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                apellido,
                email,
                telefono,
                password
            })
        });
        
        const data = await response.json();
        
        loading.style.display = 'none';
        
        if (data.error) {
            mostrarError(errorDiv, data.error);
            return;
        }
        
        if (data.success) {
            mostrarExito(successDiv, '¡Cuenta creada exitosamente! Redirigiendo a login...');
            
            document.getElementById('registroForm').reset();
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
        
    } catch (error) {
        loading.style.display = 'none';
        mostrarError(errorDiv, 'Error de conexión con el servidor. Asegúrate de que el servidor esté corriendo.');
        console.error('Error:', error);
    }
}

// ==================== FUNCIONES AUXILIARES ====================

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function mostrarError(elemento, mensaje) {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mostrarExito(elemento, mensaje) {
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function verificarSesionActiva() {
    const usuarioSesion = sessionStorage.getItem('usuario_sesion') || 
                          localStorage.getItem('usuario_sesion');
    
    if (usuarioSesion) {
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('registro.html')) {
            window.location.href = 'index.html';
        }
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('usuario_sesion');
    localStorage.removeItem('usuario_sesion');
    window.location.href = 'login.html';
}

function obtenerUsuarioActual() {
    const usuarioJSON = sessionStorage.getItem('usuario_sesion') || 
                        localStorage.getItem('usuario_sesion');
    return usuarioJSON ? JSON.parse(usuarioJSON) : null;
}