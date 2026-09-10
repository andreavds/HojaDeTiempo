import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ProyectoService, Proyecto } from '../proyecto/proyecto.service';
import { Notificacion, NotificacionService } from '../notificacion/notificacion.service';
import { Chart, ChartConfiguration, ChartDataset, registerables } from 'chart.js';

Chart.register(...registerables);

interface RecursoConTiempo {
  recurso: string;
  tiempoDedicadoTotal: number;
}

@Component({
  selector: 'app-reporte',
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css'],
})
export class ReporteComponent implements OnInit, OnDestroy {
  @ViewChild('graficaProyecto') graficaProyecto?: ElementRef<HTMLCanvasElement>;

  proyectos: Proyecto[] = [];
  proyectoSeleccionado = '';
  recursosConTiempo: RecursoConTiempo[] = [];
  private chart: Chart | null = null;

  constructor(
    private proyectoService: ProyectoService,
    private notificacionService: NotificacionService
  ) {
    this.cargarProyectos();
  }

  ngOnInit() {
    this.cargarProyectos();
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  cargarProyectos(): void {
    this.proyectoService.getAllProyectos().then((proyectos) => {
      this.proyectos = proyectos;
    });
  }

  generarReporte(): void {
    const proyectoSeleccionado = this.proyectoSeleccionado;

    if (!proyectoSeleccionado) {
      return;
    }

    this.notificacionService
      .obtenerNotificacionesPorProyecto(proyectoSeleccionado)
      .then((notificaciones) => {
        this.crearGrafico(notificaciones);
        this.calcularTiempoAcumulado(notificaciones);
      })
      .catch((error) => {
        console.error('Error al obtener notificaciones:', error);
      });
  }

  crearGrafico(notificaciones: Notificacion[]) {
    this.chart?.destroy();

    const notificacionesOrdenadas = [...notificaciones].sort((a, b) => {
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });

    const labels = notificacionesOrdenadas.map((notificacion) => notificacion.fecha);

    let tiempoAcumulado = 0;
    const datosTiempo = notificacionesOrdenadas.map((notificacion) => {
      tiempoAcumulado += Number(notificacion.tiempoDedicado || 0);
      return tiempoAcumulado;
    });

    const datosPorcentaje = notificacionesOrdenadas.map((notificacion) => Number(notificacion.porcentajeAvance || 0));

    const datasets: ChartDataset<'line', number[]>[] = [
      {
        label: 'Tiempo acumulado (días)',
        data: datosTiempo,
        borderColor: '#111111',
        backgroundColor: 'rgba(17, 17, 17, 0.12)',
        fill: false,
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'Porcentaje completado (%)',
        data: datosPorcentaje,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.18)',
        fill: false,
        tension: 0.3,
        yAxisID: 'y1',
        pointRadius: 4,
      },
    ];

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Fecha',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Tiempo acumulado',
            },
          },
          y1: {
            beginAtZero: true,
            max: 100,
            position: 'right',
            title: {
              display: true,
              text: 'Porcentaje (%)',
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    };

    if (this.graficaProyecto) {
      this.chart = new Chart(this.graficaProyecto.nativeElement, config);
    }
  }

  calcularTiempoAcumulado(notificaciones: Notificacion[]) {
    const recursosMap: { [recurso: string]: number } = {};

    notificaciones.forEach((notificacion: Notificacion) => {
      if (recursosMap.hasOwnProperty(notificacion.recursoCodigo)) {
        recursosMap[notificacion.recursoCodigo] += notificacion.tiempoDedicado;
      } else {
        recursosMap[notificacion.recursoCodigo] = notificacion.tiempoDedicado;
      }
    });

    this.recursosConTiempo = Object.keys(recursosMap).map((recurso) => ({
      recurso: recurso,
      tiempoDedicadoTotal: recursosMap[recurso],
    }));
  }
}