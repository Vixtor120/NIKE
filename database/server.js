const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // En producción usar variables de entorno

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: '192.168.72.159',
  user: 'admin',
  password: 'password',
  database: 'nike'
});

db.connect(err => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
  console.log('Conexión a la base de datos exitosa.');
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

// Middleware para roles de administrador
const isAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Requiere permisos de administrador' });
  }
  next();
};

// Rutas de Autenticación

// Registro de usuarios
app.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  
  // Validar datos
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  
  try {
    // Verificar si el email ya existe
    db.query('SELECT id FROM usuarios WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insertar usuario
      db.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, 'cliente'],
        (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al registrar usuario' });
          }
          
          res.status(201).json({ message: 'Usuario registrado exitosamente', userId: results.insertId });
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validar datos
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }
  
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
    const user = results[0];
    
    // Comparar contraseñas
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  });
});

// Rutas de la API de Productos

// GET: Obtener todos los productos
app.get('/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener los productos.' });
    }
    res.json(results);
  });
});

// GETBYID: Obtener un producto por ID
app.get('/productos/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM productos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener el producto.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json(results[0]);
  });
});

// POST: Crear un nuevo producto
app.post('/productos', (req, res) => {
  const { nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock } = req.body;
  const query = 'INSERT INTO productos (nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear el producto.' });
    }
    res.status(201).json({ message: 'Producto creado exitosamente.', id: results.insertId });
  });
});

// PUT: Actualizar un producto por ID
app.put('/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock } = req.body;
  const query = 'UPDATE productos SET nombre = ?, precio = ?, descripcion = ?, tipo_producto = ?, producto_oferta = ?, imagen = ?, stock = ? WHERE id = ?';
  db.query(query, [nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock, id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al actualizar el producto.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ message: 'Producto actualizado exitosamente.' });
  });
});

// DELETE: Eliminar un producto por ID
app.delete('/productos/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM productos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar el producto.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ message: 'Producto eliminado exitosamente.' });
  });
});

// Rutas de Usuario

// Obtener datos del perfil
app.get('/usuarios/perfil', authenticateToken, (req, res) => {
  db.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener perfil de usuario' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(results[0]);
  });
});

// Actualizar perfil de usuario
app.put('/usuarios/perfil', authenticateToken, (req, res) => {
  const { nombre, email } = req.body;
  
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email son requeridos' });
  }
  
  db.query(
    'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
    [nombre, email, req.user.id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al actualizar perfil' });
      }
      
      res.json({ message: 'Perfil actualizado exitosamente' });
    }
  );
});

// Cambiar contraseña
app.put('/usuarios/cambiar-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Se requieren ambas contraseñas' });
  }
  
  db.query('SELECT password FROM usuarios WHERE id = ?', [req.user.id], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const validPassword = await bcrypt.compare(currentPassword, results[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    db.query(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al cambiar contraseña' });
        }
        
        res.json({ message: 'Contraseña actualizada exitosamente' });
      }
    );
  });
});

// Rutas de Carrito

// Crear un nuevo carrito
app.post('/carritos', authenticateToken, (req, res) => {
  db.query('INSERT INTO carritos (usuario_id) VALUES (?)', [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear carrito' });
    }
    
    // Programar eliminación del carrito después de 10 minutos
    setTimeout(() => {
      db.query('SELECT * FROM carritos WHERE id = ?', [results.insertId], (err, checkResults) => {
        if (err || checkResults.length === 0) return;
        
        // Devolver stock de productos en el carrito
        db.query('SELECT producto_id, cantidad FROM carrito_productos WHERE carrito_id = ?', 
          [results.insertId], (err, cartProducts) => {
            if (err || cartProducts.length === 0) return;
            
            // Actualizar stock para cada producto
            cartProducts.forEach(item => {
              db.query('UPDATE productos SET stock = stock + ? WHERE id = ?', 
                [item.cantidad, item.producto_id]);
            });
            
            // Eliminar productos del carrito
            db.query('DELETE FROM carrito_productos WHERE carrito_id = ?', [results.insertId]);
            
            // Eliminar el carrito
            db.query('DELETE FROM carritos WHERE id = ?', [results.insertId]);
            console.log(`Carrito ${results.insertId} eliminado por timeout`);
          });
      });
    }, 600000); // 10 minutos = 600000 ms
    
    res.status(201).json({ 
      message: 'Carrito creado exitosamente', 
      id: results.insertId,
      expiraEn: '10 minutos'
    });
  });
});

// Obtener carrito activo del usuario
app.get('/carritos/usuario', authenticateToken, (req, res) => {
  db.query(
    `SELECT c.id, c.created_at 
     FROM carritos c 
     WHERE c.usuario_id = ? 
     ORDER BY c.created_at DESC 
     LIMIT 1`,
    [req.user.id],
    (err, cartResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener carrito' });
      }
      
      if (cartResults.length === 0) {
        return res.json({ message: 'No hay carrito activo', items: [] });
      }
      
      const carritoId = cartResults[0].id;
      
      // Obtener productos del carrito
      db.query(
        `SELECT cp.producto_id, cp.cantidad, p.nombre, p.precio, p.imagen
         FROM carrito_productos cp
         JOIN productos p ON cp.producto_id = p.id
         WHERE cp.carrito_id = ?`,
        [carritoId],
        (err, productResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener productos del carrito' });
          }
          
          res.json({
            id: carritoId,
            created_at: cartResults[0].created_at,
            items: productResults,
            total: productResults.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
          });
        }
      );
    }
  );
});

// Añadir producto al carrito
app.post('/carritos/:carritoId/productos', authenticateToken, (req, res) => {
  const { carritoId } = req.params;
  const { productoId, cantidad } = req.body;
  
  if (!productoId || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Producto y cantidad válida son requeridos' });
  }
  
  // Verificar propiedad del carrito
  db.query('SELECT usuario_id FROM carritos WHERE id = ?', [carritoId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al verificar carrito' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    
    if (results[0].usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este carrito' });
    }
    
    // Verificar stock del producto
    db.query('SELECT stock FROM productos WHERE id = ?', [productoId], (err, stockResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al verificar stock' });
      }
      
      if (stockResults.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      if (stockResults[0].stock < cantidad) {
        return res.status(400).json({ 
          error: 'Stock insuficiente', 
          disponible: stockResults[0].stock 
        });
      }
      
      // Verificar si el producto ya está en el carrito
      db.query(
        'SELECT id, cantidad FROM carrito_productos WHERE carrito_id = ? AND producto_id = ?',
        [carritoId, productoId],
        (err, cartResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al verificar producto en carrito' });
          }
          
          const transaction = async () => {
            try {
              // Reducir stock del producto
              await db.promise().query(
                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                [cantidad, productoId]
              );
              
              // Añadir o actualizar producto en carrito
              if (cartResults.length > 0) {
                const newCantidad = cartResults[0].cantidad + cantidad;
                await db.promise().query(
                  'UPDATE carrito_productos SET cantidad = ? WHERE id = ?',
                  [newCantidad, cartResults[0].id]
                );
              } else {
                await db.promise().query(
                  'INSERT INTO carrito_productos (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)',
                  [carritoId, productoId, cantidad]
                );
              }
              
              res.json({ message: 'Producto añadido al carrito exitosamente' });
            } catch (error) {
              console.error(error);
              res.status(500).json({ error: 'Error al añadir producto al carrito' });
            }
          };
          
          transaction();
        }
      );
    });
  });
});

// Eliminar producto del carrito
app.delete('/carritos/:carritoId/productos/:productoId', authenticateToken, (req, res) => {
  const { carritoId, productoId } = req.params;
  
  // Verificar propiedad del carrito
  db.query('SELECT usuario_id FROM carritos WHERE id = ?', [carritoId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al verificar carrito' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    
    if (results[0].usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este carrito' });
    }
    
    // Obtener cantidad actual en el carrito
    db.query(
      'SELECT cantidad FROM carrito_productos WHERE carrito_id = ? AND producto_id = ?',
      [carritoId, productoId],
      (err, cartResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al verificar producto en carrito' });
        }
        
        if (cartResults.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }
        
        const cantidad = cartResults[0].cantidad;
        
        // Transacción: eliminar del carrito y restaurar stock
        const transaction = async () => {
          try {
            // Restaurar stock
            await db.promise().query(
              'UPDATE productos SET stock = stock + ? WHERE id = ?',
              [cantidad, productoId]
            );
            
            // Eliminar del carrito
            await db.promise().query(
              'DELETE FROM carrito_productos WHERE carrito_id = ? AND producto_id = ?',
              [carritoId, productoId]
            );
            
            res.json({ message: 'Producto eliminado del carrito exitosamente' });
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar producto del carrito' });
          }
        };
        
        transaction();
      }
    );
  });
});

// Procesar la compra (checkout)
app.post('/carritos/:carritoId/checkout', authenticateToken, (req, res) => {
  const { carritoId } = req.params;
  
  // Verificar propiedad del carrito
  db.query('SELECT usuario_id FROM carritos WHERE id = ?', [carritoId], (err, cartResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al verificar carrito' });
    }
    
    if (cartResults.length === 0) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    
    if (cartResults[0].usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para procesar este carrito' });
    }
    
    // Obtener productos del carrito
    db.query(
      `SELECT cp.producto_id, cp.cantidad, p.precio
       FROM carrito_productos cp
       JOIN productos p ON cp.producto_id = p.id
       WHERE cp.carrito_id = ?`,
      [carritoId],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al obtener productos del carrito' });
        }
        
        if (results.length === 0) {
          return res.status(400).json({ error: 'El carrito está vacío' });
        }
        
        // Calcular total
        const total = results.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        // Procesar la compra (transacción)
        const transaction = async () => {
          try {
            // 1. Crear registro de compra
            const [compraResult] = await db.promise().query(
              'INSERT INTO compras (usuario_id, total) VALUES (?, ?)',
              [req.user.id, total]
            );
            
            const compraId = compraResult.insertId;
            
            // 2. Añadir productos a la compra
            for (const item of results) {
              await db.promise().query(
                'INSERT INTO compra_productos (compra_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [compraId, item.producto_id, item.cantidad, item.precio]
              );
            }
            
            // 3. Vaciar el carrito (eliminar productos)
            await db.promise().query('DELETE FROM carrito_productos WHERE carrito_id = ?', [carritoId]);
            
            // 4. Eliminar el carrito
            await db.promise().query('DELETE FROM carritos WHERE id = ?', [carritoId]);
            
            res.json({
              message: 'Compra procesada exitosamente',
              compraId,
              total
            });
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al procesar la compra' });
          }
        };
        
        transaction();
      }
    );
  });
});

// Obtener historial de compras del usuario
app.get('/compras', authenticateToken, (req, res) => {
  db.query(
    `SELECT c.id, c.total, c.created_at
     FROM compras c
     WHERE c.usuario_id = ?
     ORDER BY c.created_at DESC`,
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener historial de compras' });
      }
      
      res.json(results);
    }
  );
});

// Obtener detalles de una compra específica
app.get('/compras/:compraId', authenticateToken, (req, res) => {
  const { compraId } = req.params;
  
  // Verificar propiedad de la compra
  db.query('SELECT usuario_id FROM compras WHERE id = ?', [compraId], (err, compraResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al verificar compra' });
    }
    
    if (compraResults.length === 0) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    
    // Solo el propietario o un admin pueden ver los detalles
    if (compraResults[0].usuario_id !== req.user.id && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver esta compra' });
    }
    
    // Obtener detalles de la compra
    db.query(
      `SELECT c.id, c.total, c.created_at, u.nombre as usuario_nombre
       FROM compras c
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = ?`,
      [compraId],
      (err, compraInfo) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al obtener detalles de compra' });
        }
        
        // Obtener productos de la compra
        db.query(
          `SELECT cp.producto_id, cp.cantidad, cp.precio_unitario, p.nombre, p.imagen
           FROM compra_productos cp
           JOIN productos p ON cp.producto_id = p.id
           WHERE cp.compra_id = ?`,
          [compraId],
          (err, productosInfo) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Error al obtener productos de la compra' });
            }
            
            res.json({
              ...compraInfo[0],
              productos: productosInfo
            });
          }
        );
      }
    );
  });
});

// Rutas administrativas (protegidas)

// Obtener todos los usuarios (solo admin)
app.get('/admin/usuarios', authenticateToken, isAdmin, (req, res) => {
  db.query('SELECT id, nombre, email, rol, created_at FROM usuarios', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
    
    res.json(results);
  });
});

// Obtener todas las compras (solo admin)
app.get('/admin/compras', authenticateToken, isAdmin, (req, res) => {
  db.query(
    `SELECT c.id, c.usuario_id, c.total, c.created_at, u.nombre as usuario_nombre
     FROM compras c
     JOIN usuarios u ON c.usuario_id = u.id
     ORDER BY c.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener compras' });
      }
      
      res.json(results);
    }
  );
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});