import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { FormularioComponent } from './pages/formulario/formulario.component';


export const routes: Routes = [
    {path: 'home', component: HomeComponent}, // Ruta a la pagina de inicio.
    {path: 'productos', component: ProductosComponent}, // Ruta a la pagina de productos.
    {path: 'formulario', component: FormularioComponent}, // Ruta al formulario de los admin.
];
