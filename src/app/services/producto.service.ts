import { Injectable } from '@angular/core';
import { Producto } from '../interfaces/producto.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Lista de productos
  private productos: Producto[] = [];

  // Método para obtener todos los productos
  getProductos() {
    return this.productos;
  }

  // Método para añadir un nuevo producto
  addProducto(producto: Producto) {
    this.productos.push(producto);
    console.log('Producto añadido:', producto);
  }
}
