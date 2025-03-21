import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { FormularioComponent } from './pages/formulario/formulario.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
    {path: '', component: HomeComponent}, // Ruta a la pagina de inicio.
    {path: 'productos', component: ProductosComponent}, // Ruta a la pagina de productos.
    {path: 'formulario', component: FormularioComponent}, // Ruta al formulario de los admin.
    {path: 'login', component: LoginComponent}, // Ruta a la pagina de login.
    {path: 'register', component: RegisterComponent}, // Ruta a la pagina de registro.
];
