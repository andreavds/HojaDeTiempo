import { Component } from '@angular/core';
import { ProyectoService, Proyecto } from './proyecto.service';

@Component({
  selector: 'app-proyecto',
  templateUrl: './proyecto.component.html',
  styleUrls: ['./proyecto.component.css']
})
export class ProyectoComponent {
  proyectos: Proyecto[] = [];
  codigoProyecto = '';
  descripcionProyecto = '';
  mostrarFormulario = false;

  constructor(private proyectoService: ProyectoService) {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.proyectoService.getAllProyectos().then((proyectos) => {
      this.proyectos = proyectos;
    });
  }

  nuevoProyecto(): void {
    const codigo = this.codigoProyecto.trim();

    if (!codigo) {
      alert('Inserta un código para el proyecto');
      return;
    }

    this.mostrarFormulario = true;
    this.descripcionProyecto = '';
  }

  editarProyecto(codigo: string): void {
    this.codigoProyecto = codigo;
    const proyecto = this.proyectos.find((p) => p.codigo === codigo);

    if (proyecto) {
      this.descripcionProyecto = proyecto.descripcion;
      this.mostrarFormulario = true;
    }
  }

  confirmarAccion(): void {
    const codigo = this.codigoProyecto.trim();
    const descripcion = this.descripcionProyecto.trim();

    if (!codigo || !descripcion) {
      alert('Completa el código y la descripción del proyecto');
      return;
    }

    if (!this.mostrarFormulario) {
      return;
    }

    if (this.proyectos.some((proyecto) => proyecto.codigo === codigo)) {
      this.proyectoService
        .actualizarProyecto({
          codigo,
          descripcion,
          recurso: ''
        })
        .then(() => {
          this.cargarProyectos();
          this.mostrarFormulario = false;
          this.codigoProyecto = '';
          this.descripcionProyecto = '';
        });
    } else {
      this.proyectoService
        .agregarProyecto({
          codigo,
          descripcion,
          recurso: ''
        })
        .then(() => {
          this.cargarProyectos();
          this.mostrarFormulario = false;
          this.codigoProyecto = '';
          this.descripcionProyecto = '';
        });
    }
  }

  eliminarProyecto(codigo: string): void {
    this.proyectoService.eliminarProyecto(codigo).then(() => {
      this.cargarProyectos();
    });
  }
}
