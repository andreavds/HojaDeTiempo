import { Injectable } from '@angular/core';

export interface Proyecto {
  recurso: string;
  codigo: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private readonly DB_NOMBRE = 'mi_basededatos';
  private readonly OBJETO_TIENDA = 'proyectos';
  private readonly DB_VERSION = 9;

  async getAllProyectos(): Promise<Proyecto[]> {
    const db = await this.abrirConexion();
    return new Promise<Proyecto[]>((resolve) => {
      const transaccion = db.transaction(this.OBJETO_TIENDA, 'readonly');
      const tienda = transaccion.objectStore(this.OBJETO_TIENDA);
      const proyectos: Proyecto[] = [];

      transaccion.oncomplete = () => {
        resolve(proyectos);
      };

      const solicitud = tienda.openCursor();
      solicitud.onsuccess = (evento) => {
        const cursor = (evento.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          proyectos.push(cursor.value);
          cursor.continue();
        }
      };
    });
  }

  async agregarProyecto(proyecto: Proyecto): Promise<void> {
    const db = await this.abrirConexion();
    const transaccion = db.transaction(this.OBJETO_TIENDA, 'readwrite');
    const tienda = transaccion.objectStore(this.OBJETO_TIENDA);
    tienda.add(proyecto);
  }

  async actualizarProyecto(proyecto: Proyecto): Promise<void> {
    const db = await this.abrirConexion();
    const transaccion = db.transaction(this.OBJETO_TIENDA, 'readwrite');
    const tienda = transaccion.objectStore(this.OBJETO_TIENDA);
    tienda.put(proyecto);
  }

  async eliminarProyecto(codigo: string): Promise<void> {
    const db = await this.abrirConexion();
    const transaccion = db.transaction(this.OBJETO_TIENDA, 'readwrite');
    const tienda = transaccion.objectStore(this.OBJETO_TIENDA);
    tienda.delete(codigo);
  }

  private async abrirConexion(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const intentarAbrir = (version: number) => {
        const solicitud = indexedDB.open(this.DB_NOMBRE, version);

        solicitud.onupgradeneeded = (evento) => {
          const db = (evento.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(this.OBJETO_TIENDA)) {
            db.createObjectStore(this.OBJETO_TIENDA, { keyPath: 'codigo' });
          }
        };

        solicitud.onsuccess = (evento) => {
          const db = (evento.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(this.OBJETO_TIENDA)) {
            db.close();
            intentarAbrir(version + 1);
            return;
          }

          resolve(db);
        };

        solicitud.onerror = (evento) => {
          reject((evento.target as IDBOpenDBRequest).error);
        };
      };

      intentarAbrir(this.DB_VERSION);
    });
  }
}
