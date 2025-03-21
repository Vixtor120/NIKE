import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  loading = false;
  errorMessage = '';

  constructor(private router: Router) {}

  // Formulario con validaciones
  registerForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required, 
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/) // Al menos una mayúscula, minúscula y número
    ])
  });

  // Método para verificar si un campo tiene errores
  hasError(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // Método para obtener el mensaje de error de un campo
  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    
    if (!control) return '';
    
    if (control.errors?.['required']) {
      return 'Este campo es obligatorio';
    }
    
    if (field === 'nombre' && control.errors?.['minlength']) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (field === 'email' && control.errors?.['email']) {
      return 'El formato de email no es válido';
    }
    
    if (field === 'password') {
      if (control.errors?.['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
      if (control.errors?.['pattern']) {
        return 'La contraseña debe incluir mayúsculas, minúsculas y números';
      }
    }
    
    return 'Campo inválido';
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    
    // Aquí implementarías la llamada al servicio de autenticación
    // Ejemplo simulado:
    setTimeout(() => {
      this.loading = false;
      
      // Simulación de éxito
      console.log('Usuario registrado:', this.registerForm.value);
      
      // Navegar a login
      this.router.navigate(['/login'], { queryParams: { registered: 'success' } });
      
      // Alternativa: Mostrar error si hay problemas
      // this.errorMessage = 'Este correo ya está registrado';
    }, 1500);
  }
}
