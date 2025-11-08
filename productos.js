// productos.js - Cargar productos desde la base de datos

// ✅ URL relativa para Render
const API_URL = '/api';

// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    verificarSesion();
});

// ==================== CARGAR PRODUCTOS ====================
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const data = await response.json();
        
        if (data.success) {
            // Organizar productos por categoría
            const productosPorCategoria = {
                panes: [],
                pasteles: [],
                temporada: []
            };
            
            data.productos.forEach(producto => {
                if (productosPorCategoria[producto.categoria]) {
                    productosPorCategoria[producto.categoria].push(producto);
                }
            });
            
            // Renderizar cada categoría
            renderizarCategoria('panes', productosPorCategoria.panes);
            renderizarCategoria('pasteles', productosPorCategoria.pasteles);
            renderizarCategoria('temporada', productosPorCategoria.temporada);
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarError('No se pudieron cargar los productos. Verifica que el servidor esté corriendo.');
    }
}

// ==================== RENDERIZAR CATEGORÍA ====================
function renderizarCategoria(categoria, productos) {
    const container = document.getElementById(`${categoria}-grid`);
    
    if (!container) {
        console.error(`No se encontró el contenedor para ${categoria}`);
        return;
    }
    
    if (productos.length === 0) {
        container.innerHTML = '<p style="color: #666; padding: 2rem;">No hay productos disponibles en esta categoría.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    productos.forEach(producto => {
        const productoCard = crearTarjetaProducto(producto);
        container.appendChild(productoCard);
    });
}

// ==================== CREAR TARJETA DE PRODUCTO ====================
function crearTarjetaProducto(producto) {
    const div = document.createElement('div');
    div.className = 'producto';
    
    // Determinar emoji según categoría
    let emoji = '🍞';
    if (producto.categoria === 'pasteles') emoji = '🎂';
    if (producto.categoria === 'temporada') emoji = '✨';
    
    // Verificar disponibilidad
    const disponible = producto.stock > 0;
    const stockClass = disponible ? '' : 'sin-stock';
    const stockText = disponible ? `Stock: ${producto.stock}` : 'Agotado';
    
    div.innerHTML = `
        <div class="producto-img ${stockClass}">
            ${producto.imagen ? `<img src="${producto.imagen}" alt="${producto.nombre}">` : emoji}
        </div>
        <div class="producto-info">
            <div class="producto-nombre">${producto.nombre}</div>
            <div class="producto-descripcion">${producto.descripcion || 'Delicioso producto de panadería'}</div>
            <div class="producto-precio">$${parseFloat(producto.precio).toFixed(2)}</div>
            <div class="producto-stock">${stockText}</div>
            <button class="btn-agregar" 
                    onclick="agregarAlCarrito(${producto.id}, '${producto.nombre}', ${producto.precio})"
                    ${!disponible ? 'disabled' : ''}>
                ${disponible ? '🛒 Agregar al carrito' : '❌ No disponible'}
            </button>
        </div>
    `;
    
    return div;
}

// ==================== AGREGAR AL CARRITO ====================
function agregarAlCarrito(id, nombre, precio) {
    // Verificar si hay sesión activa
    const usuario = obtenerUsuarioActual();
    
    if (!usuario) {
        if (confirm('Debes iniciar sesión para agregar productos al carrito. ¿Ir a login?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Obtener carrito actual del storage
    let carrito = obtenerCarrito();
    
    // Verificar si el producto ya está en el carrito
    const productoExistente = carrito.find(item => item.id === id);
    
    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        carrito.push({
            id: id,
            nombre: nombre,
            precio: precio,
            cantidad: 1
        });
    }
    
    // Guardar carrito actualizado
    guardarCarrito(carrito);
    
    // Mostrar notificación
    mostrarNotificacion(`✅ ${nombre} agregado al carrito`);
    
    // Actualizar contador del carrito si existe
    actualizarContadorCarrito();
}

// ==================== FUNCIONES DEL CARRITO ====================
function obtenerCarrito() {
    const carritoJSON = sessionStorage.getItem('carrito') || localStorage.getItem('carrito');
    return carritoJSON ? JSON.parse(carritoJSON) : [];
}

function guardarCarrito(carrito) {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;
    
    // Usar el mismo storage que el usuario
    const storage = localStorage.getItem('usuario_sesion') ? localStorage : sessionStorage;
    storage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const contador = carrito.reduce((total, item) => total + item.cantidad, 0);
    
    // Actualizar badge del carrito si existe
    const badge = document.getElementById('carrito-badge');
    if (badge) {
        badge.textContent = contador;
        badge.style.display = contador > 0 ? 'block' : 'none';
    }
}

// ==================== VERIFICAR SESIÓN ====================
function verificarSesion() {
    const usuario = obtenerUsuarioActual();
    
    // Actualizar el ícono de usuario si existe
    const userIcon = document.querySelector('.navbusca a[href="/login.html"]');
    if (userIcon && usuario) {
        userIcon.href = '/perfil.html';
        userIcon.title = `Perfil de ${usuario.nombre}`;
    }
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
}

function obtenerUsuarioActual() {
    const usuarioJSON = sessionStorage.getItem('usuario_sesion') || 
                        localStorage.getItem('usuario_sesion');
    return usuarioJSON ? JSON.parse(usuarioJSON) : null;
}

// ==================== NOTIFICACIONES ====================
function mostrarNotificacion(mensaje) {
    // Crear notificación
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: 'Lucida Sans', sans-serif;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notificacion);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

function mostrarError(mensaje) {
    const panes = document.querySelector('.panes');
    if (panes) {
        panes.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #d32f2f;">
                <h2>⚠️ Error</h2>
                <p>${mensaje}</p>
                <button onclick="location.reload()" style="
                    margin-top: 1rem;
                    padding: 10px 20px;
                    background-color: #d4af37;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">Reintentar</button>
            </div>
        `;
    }
}

// ==================== ANIMACIONES CSS ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .producto-stock {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }
    
    .sin-stock {
        opacity: 0.5;
        position: relative;
    }
    
    .sin-stock::after {
        content: 'AGOTADO';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-15deg);
        background-color: rgba(211, 47, 47, 0.9);
        color: white;
        padding: 10px 20px;
        font-weight: bold;
        border-radius: 5px;
        font-size: 1.2rem;
    }
    
    .btn-agregar:disabled {
        background-color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
    }
    
    .btn-agregar:disabled:hover {
        background-color: #ccc;
        transform: none;
        box-shadow: none;
    }
`;
document.head.appendChild(style);