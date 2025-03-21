import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidationErrors, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../interfaces/producto.interface';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css']
})
export class FormularioComponent {
  constructor(private productoService: ProductoService, private router: Router) {}

  // Formulario con validaciones
  MyNewForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, this.nombreUnicoValidator]),
    precio: new FormControl('', [Validators.required, Validators.min(1)]),
    descripcion: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]),
    tipoProducto: new FormControl('', Validators.required),
    productoOferta: new FormControl(false),
    imagen: new FormControl('', Validators.required),
  });

  // Enviar el formulario
  enviarFormulario() {
    if (this.MyNewForm.valid) {
      // Crear el producto
      const nuevoProducto: Producto = {
        nombre: this.MyNewForm.value.nombre ?? '',
        precio: Number(this.MyNewForm.value.precio ?? 0),
        descripcion: this.MyNewForm.value.descripcion ?? '',
        tipoProducto: this.MyNewForm.value.tipoProducto ?? '',
        productoOferta: Boolean(this.MyNewForm.value.productoOferta ?? false),
        imagen: this.MyNewForm.value.imagen ?? '',
      };

      // Añadir al servicio
      this.productoService.addProducto(nuevoProducto);
      
      // Mostrar alerta y resetear
      alert('¡Producto añadido correctamente!');
      this.MyNewForm.reset({
        nombre: '',
        precio: '',
        descripcion: '',
        tipoProducto: '',
        productoOferta: false,
        imagen: ''
      });
      
      // Ir a la página de productos
      this.router.navigate(['/productos']);
    }
  }

  // Validador para nombres duplicados
  nombreUnicoValidator(control: AbstractControl): ValidationErrors | null {
    const nombresExistentes = ['Nike Air Max', 'Nike Dunk', 'Nike React'];
    if (nombresExistentes.includes(control.value)) {
      return { nombreUnico: true };
    }
    return null;
  }
}