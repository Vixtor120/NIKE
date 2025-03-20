import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidationErrors, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../interfaces/producto.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css']
})
export class FormularioComponent {
  MyNewForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, this.nombreUnicoValidator]),
    precio: new FormControl('', [Validators.required, Validators.min(1)]),
    descripcion: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]),
    tipoProducto: new FormControl('', Validators.required),
    productoOferta: new FormControl(false, Validators.required),
    imagen: new FormControl('', Validators.required),
  });

  //usamos la interfaz creada
  producto: Producto = {
    nombre: '',
    precio: 0,
    descripcion: '',
    tipoProducto: '',
    productoOferta: false,
    imagen: ''
  };

  //metodo para enviar el formulario fijandonos en el tipo de dato
  //que se espera en la interfaz
  enviarFormulario() {
    this.producto.nombre = this.MyNewForm.value.nombre ?? '';
    this.producto.precio = Number(this.MyNewForm.value.precio ?? 0);
    this.producto.descripcion = this.MyNewForm.value.descripcion ?? '';
    this.producto.tipoProducto = this.MyNewForm.value.tipoProducto ?? '';
    this.producto.productoOferta = Boolean(this.MyNewForm.value.productoOferta ?? false);
    this.producto.imagen = this.MyNewForm.value.imagen ?? '';
    console.log(this.producto);

    this.MyNewForm.reset();
  }

  // Validador personalizado para verificar que el nombre no se repita
  nombreUnicoValidator(control: AbstractControl): ValidationErrors | null {
    const nombresExistentes = ['Nike Air Max', 'Nike Dunk', 'Nike React'];
    if (nombresExistentes.includes(control.value)) {
      return { nombreUnico: true };
    }
    return null;
  }
}