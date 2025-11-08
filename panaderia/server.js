// server.js - Backend LIMPIO para La Desesperanza (SIN CARRITO)
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.database
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// ==================== RUTAS ====================

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// ==================== REGISTRO ====================
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, password } = req.body;
        
        // Validaciones
        if (!nombre || !apellido || !email || !telefono || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        
        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }
        
        // Verificar si el email ya existe
        const [usuarios] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (usuarios.length > 0) {
            return res.status(400).json({ error: 'Este email ya está registrado' });
        }
        
        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar usuario
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, apellido, email, telefono, contraseña) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido, email, telefono, hashedPassword]
        );
        
        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado exitosamente',
            usuario_id: result.insertId
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== LOGIN ====================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }
        
        // Buscar usuario
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ? AND estado = "activo"',
            [email]
        );
        
        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Email no registrado' });
        }
        
        const usuario = usuarios[0];
        
        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.contraseña);
        
        if (!passwordValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        
        // Actualizar fecha de login
        await pool.query(
            'UPDATE usuarios SET fecha_login = NOW() WHERE id = ?',
            [usuario.id]
        );
        
        // Eliminar contraseña del objeto antes de enviarlo
        delete usuario.contraseña;
        
        res.json({
            success: true,
            mensaje: 'Login exitoso',
            usuario: usuario
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== ACTUALIZAR PERFIL ====================
app.put('/api/actualizar-perfil', async (req, res) => {
    try {
        const { id, nombre, apellido, email, telefono, password_actual, password_nueva } = req.body;
        
        // Validaciones
        if (!id || !nombre || !apellido || !email || !telefono) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        
        // Verificar si el email ya está en uso por otro usuario
        const [emailExiste] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ? AND id != ?',
            [email, id]
        );
        
        if (emailExiste.length > 0) {
            return res.status(400).json({ error: 'Este email ya está registrado por otro usuario' });
        }
        
        // Verificar si el usuario existe
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE id = ?',
            [id]
        );
        
        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = usuarios[0];
        
        // Si se está cambiando la contraseña
        if (password_actual && password_nueva) {
            // Verificar contraseña actual
            const passwordValida = await bcrypt.compare(password_actual, usuario.contraseña);
            
            if (!passwordValida) {
                return res.status(401).json({ error: 'Contraseña actual incorrecta' });
            }
            
            // Validar nueva contraseña
            if (password_nueva.length < 6) {
                return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
            }
            
            // Encriptar nueva contraseña
            const hashedPassword = await bcrypt.hash(password_nueva, 10);
            
            // Actualizar con nueva contraseña
            await pool.query(
                'UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ?, contraseña = ? WHERE id = ?',
                [nombre, apellido, email, telefono, hashedPassword, id]
            );
        } else {
            // Actualizar sin cambiar contraseña
            await pool.query(
                'UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ? WHERE id = ?',
                [nombre, apellido, email, telefono, id]
            );
        }
        
        res.json({
            success: true,
            mensaje: 'Perfil actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== OBTENER PRODUCTOS ====================
app.get('/api/productos', async (req, res) => {
    try {
        const [productos] = await pool.query(
            'SELECT * FROM productos ORDER BY categoria, nombre'
        );
        
        res.json({
            success: true,
            productos: productos
        });
        
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== OBTENER PRODUCTOS POR CATEGORÍA ====================
app.get('/api/productos/categoria/:categoria', async (req, res) => {
    try {
        const { categoria } = req.params;
        
        const [productos] = await pool.query(
            'SELECT * FROM productos WHERE categoria = ? AND stock > 0 ORDER BY nombre',
            [categoria]
        );
        
        res.json({
            success: true,
            productos: productos
        });
        
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== AGREGAR PRODUCTO (ADMIN) ====================
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria, stock, imagen } = req.body;
        
        if (!nombre || !descripcion || !precio || !categoria) {
            return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, categoria, stock, imagen) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, descripcion, precio, categoria, stock || 0, imagen]
        );
        
        res.json({
            success: true,
            mensaje: 'Producto agregado exitosamente',
            producto_id: result.insertId
        });
        
    } catch (error) {
        console.error('Error agregando producto:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== ACTUALIZAR PRODUCTO (ADMIN) ====================
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, categoria, stock, imagen } = req.body;
        
        if (!nombre || !descripcion || !precio || !categoria) {
            return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse' });
        }
        
        const [result] = await pool.query(
            'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, categoria = ?, stock = ?, imagen = ? WHERE id = ?',
            [nombre, descripcion, precio, categoria, stock || 0, imagen, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({
            success: true,
            mensaje: 'Producto actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== ELIMINAR PRODUCTO (ADMIN) ====================
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.query(
            'DELETE FROM productos WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({
            success: true,
            mensaje: 'Producto eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== OBTENER PEDIDOS DE UN USUARIO ====================
app.get('/api/pedidos/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;
        
        const [pedidos] = await pool.query(
            `SELECT p.*, 
                    COUNT(dp.id) as cantidad_productos
             FROM pedidos p
             LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
             WHERE p.usuario_id = ?
             GROUP BY p.id
             ORDER BY p.fecha_pedido DESC`,
            [usuario_id]
        );
        
        res.json({
            success: true,
            pedidos: pedidos
        });
        
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== OBTENER DETALLE DE UN PEDIDO ====================
app.get('/api/pedidos/detalle/:pedido_id', async (req, res) => {
    try {
        const { pedido_id } = req.params;
        
        const [detalles] = await pool.query(
            `SELECT dp.*, p.nombre, p.descripcion, p.imagen
             FROM detalle_pedidos dp
             JOIN productos p ON dp.producto_id = p.id
             WHERE dp.pedido_id = ?`,
            [pedido_id]
        );
        
        res.json({
            success: true,
            detalles: detalles
        });
        
    } catch (error) {
        console.error('Error obteniendo detalle del pedido:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== CREAR PEDIDO ====================
app.post('/api/pedidos', async (req, res) => {
    try {
        const { usuario_id, items, total } = req.body;
        
        if (!usuario_id || !items || items.length === 0) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }
        
        // Crear pedido
        const [pedidoResult] = await pool.query(
            'INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)',
            [usuario_id, total]
        );
        
        const pedido_id = pedidoResult.insertId;
        
        // Insertar detalles del pedido
        for (const item of items) {
            await pool.query(
                'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [pedido_id, item.producto_id, item.cantidad, item.precio_unitario]
            );
            
            // Actualizar stock
            await pool.query(
                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                [item.cantidad, item.producto_id]
            );
        }
        
        res.json({
            success: true,
            mensaje: 'Pedido creado exitosamente',
            pedido_id: pedido_id
        });
        
    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== ACTUALIZAR ESTADO DE PEDIDO (ADMIN) ====================
app.put('/api/pedidos/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        const estadosValidos = ['pendiente', 'procesado', 'enviado', 'entregado', 'cancelado'];
        
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }
        
        const [result] = await pool.query(
            'UPDATE pedidos SET estado = ? WHERE id = ?',
            [estado, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        res.json({
            success: true,
            mensaje: 'Estado del pedido actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== OBTENER TODOS LOS PEDIDOS (ADMIN) ====================
app.get('/api/admin/pedidos', async (req, res) => {
    try {
        const [pedidos] = await pool.query(
            `SELECT p.*, 
                    u.nombre as usuario_nombre,
                    u.apellido as usuario_apellido,
                    u.email as usuario_email,
                    COUNT(dp.id) as cantidad_productos
             FROM pedidos p
             JOIN usuarios u ON p.usuario_id = u.id
             LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
             GROUP BY p.id
             ORDER BY p.fecha_pedido DESC`
        );
        
        res.json({
            success: true,
            pedidos: pedidos
        });
        
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🍞 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Base de datos: ${dbConfig.database}`);
});

// Manejo de errores de conexión
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error conectando a la base de datos:', err);
    });