import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Producto } from '../../interfaces/producto.interface';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  // Lista de productos
  productos: Producto[] = [];

  // Constructor del servicio 
  constructor(private productoService: ProductoService) {}
  
  ngOnInit() {
    this.productos = this.productoService.getProductos();
  }
}