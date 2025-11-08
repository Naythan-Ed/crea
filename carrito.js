// carrito.js - Sistema de carrito de compras (Arrays temporales, BD solo al comprar)

const API_URL = 'http://localhost:3000/api';
const COSTO_ENVIO = 50.00;

// Cargar carrito al iniciar
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    cargarCarrito();
    actualizarContadorCarrito();
});

// ==================== VERIFICAR SESIÓN ====================
function verificarSesion() {
    const usuario = obtenerUsuarioActual();
    
    if (!usuario) {
        document.getElementById('no-sesion').style.display = 'block';
        document.getElementById('carrito-vacio').style.display = 'none';
        document.getElementById('carrito-contenido').style.display = 'none';
        return false;
    }
    
    return true;
}

function obtenerUsuarioActual() {
    const usuarioJSON = sessionStorage.getItem('usuario_sesion') || 
                        localStorage.getItem('usuario_sesion');
    return usuarioJSON ? JSON.parse(usuarioJSON) : null;
}

// ==================== OBTENER CARRITO (ARRAY TEMPORAL) ====================
function obtenerCarrito() {
    const carritoJSON = sessionStorage.getItem('carrito') || localStorage.getItem('carrito');
    return carritoJSON ? JSON.parse(carritoJSON) : [];
}

function guardarCarrito(carrito) {
    const storage = localStorage.getItem('usuario_sesion') ? localStorage : sessionStorage;
    storage.setItem('carrito', JSON.stringify(carrito));
}

// ==================== CARGAR Y MOSTRAR CARRITO ====================
function cargarCarrito() {
    if (!verificarSesion()) return;
    
    const carrito = obtenerCarrito();
    
    if (carrito.length === 0) {
        document.getElementById('carrito-vacio').style.display = 'block';
        document.getElementById('carrito-contenido').style.display = 'none';
        return;
    }
    
    document.getElementById('carrito-vacio').style.display = 'none';
    document.getElementById('carrito-contenido').style.display = 'block';
    
    renderizarProductos(carrito);
    calcularTotales(carrito);
}

// ==================== RENDERIZAR PRODUCTOS ====================
function renderizarProductos(carrito) {
    const container = document.getElementById('productos-lista');
    container.innerHTML = '';
    
    carrito.forEach((item, index) => {
        const productoDiv = document.createElement('div');
        productoDiv.className = 'producto-carrito';
        
        // Determinar emoji según el nombre del producto
        let emoji = '🍞';
        if (item.nombre.toLowerCase().includes('pastel') || 
            item.nombre.toLowerCase().includes('brownie')) {
            emoji = '🎂';
        } else if (item.nombre.toLowerCase().includes('galleta') || 
                   item.nombre.toLowerCase().includes('rosca')) {
            emoji = '✨';
        }
        
        const subtotal = item.precio * item.cantidad;
        
        productoDiv.innerHTML = `
            <div class="producto-imagen">
                ${emoji}
            </div>
            
            <div class="producto-info-carrito">
                <div class="producto-nombre-carrito">${item.nombre}</div>
                <div class="producto-precio-unit">$${parseFloat(item.precio).toFixed(2)} c/u</div>
            </div>
            
            <div class="producto-controles">
                <div class="cantidad-controles">
                    <button class="btn-cantidad" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <span class="cantidad-display">${item.cantidad}</span>
                    <button class="btn-cantidad" onclick="cambiarCantidad(${index}, 1)">+</button>
                </div>
                
                <div class="producto-subtotal">$${subtotal.toFixed(2)}</div>
                
                <button class="btn-eliminar" onclick="eliminarProducto(${index})">
                    🗑️ Eliminar
                </button>
            </div>
        `;
        
        container.appendChild(productoDiv);
    });
}

// ==================== CAMBIAR CANTIDAD ====================
function cambiarCantidad(index, cambio) {
    let carrito = obtenerCarrito();
    
    carrito[index].cantidad += cambio;
    
    // Si la cantidad llega a 0, eliminar el producto
    if (carrito[index].cantidad <= 0) {
        eliminarProducto(index);
        return;
    }
    
    guardarCarrito(carrito);
    cargarCarrito();
    actualizarContadorCarrito();
}

// ==================== ELIMINAR PRODUCTO ====================
function eliminarProducto(index) {
    if (confirm('¿Estás seguro de eliminar este producto del carrito?')) {
        let carrito = obtenerCarrito();
        carrito.splice(index, 1);
        guardarCarrito(carrito);
        cargarCarrito();
        actualizarContadorCarrito();
        mostrarNotificacion('Producto eliminado del carrito', 'info');
    }
}

// ==================== VACIAR CARRITO ====================
function vaciarCarrito() {
    if (confirm('¿Estás seguro de vaciar todo el carrito?')) {
        const storage = localStorage.getItem('usuario_sesion') ? localStorage : sessionStorage;
        storage.removeItem('carrito');
        cargarCarrito();
        actualizarContadorCarrito();
        mostrarNotificacion('Carrito vaciado', 'info');
    }
}

// ==================== CALCULAR TOTALES ====================
function calcularTotales(carrito) {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const envio = subtotal > 0 ? COSTO_ENVIO : 0;
    const total = subtotal + envio;
    
    const cantidadTotal = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('envio').textContent = envio > 0 ? `$${envio.toFixed(2)}` : 'Gratis';
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('cantidad-items').textContent = `${cantidadTotal} producto${cantidadTotal !== 1 ? 's' : ''}`;
}

// ==================== FINALIZAR COMPRA (GUARDAR EN BD) ====================
async function finalizarCompra() {
    const usuario = obtenerUsuarioActual();
    
    if (!usuario) {
        alert('Debes iniciar sesión para realizar la compra');
        window.location.href = 'login.html';
        return;
    }
    
    const carrito = obtenerCarrito();
    
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    if (!confirm('¿Confirmas que deseas finalizar la compra?')) {
        return;
    }
    
    try {
        // Calcular total
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const envio = COSTO_ENVIO;
        const total = subtotal + envio;
        
        // Preparar items para la BD
        const items = carrito.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio
        }));
        
        // Enviar pedido al servidor
        const response = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: usuario.id,
                items: items,
                total: total
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Error al procesar el pedido: ' + data.error);
            return;
        }
        
        if (data.success) {
            // Limpiar carrito del array temporal
            const storage = localStorage.getItem('usuario_sesion') ? localStorage : sessionStorage;
            storage.removeItem('carrito');
            
            // Mostrar modal de confirmación
            document.getElementById('numero-pedido').textContent = `#${data.pedido_id}`;
            document.getElementById('modal-confirmacion').style.display = 'flex';
            
            actualizarContadorCarrito();
        }
        
    } catch (error) {
        console.error('Error finalizando compra:', error);
        alert('Error de conexión con el servidor. Verifica que esté corriendo.');
    }
}

// ==================== MODAL ====================
function cerrarModal() {
    document.getElementById('modal-confirmacion').style.display = 'none';
    window.location.href = 'panes.html';
}

function irAPerfil() {
    window.location.href = 'perfil.html';
}

// ==================== CONTADOR DEL CARRITO ====================
function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const contador = carrito.reduce((total, item) => total + item.cantidad, 0);
    
    const badge = document.getElementById('carrito-badge');
    if (badge) {
        badge.textContent = contador;
        badge.style.display = contador > 0 ? 'block' : 'none';
    }
}

// ==================== NOTIFICACIONES ====================
function mostrarNotificacion(mensaje, tipo = 'success') {
    const colores = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3'
    };
    
    const notificacion = document.createElement('div');
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${colores[tipo]};
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
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// Agregar estilos de animación
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
`;
document.head.appendChild(style);