import { Injectable } from '@angular/core';

export interface Recurso {
  codigo: string;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecursoService {
  private readonly DB_NOMBRE = 'mi_basededatos';
  private readonly OBJETO_TIENDA = 'recursos';
  private readonly DB_VERSION = 9;

  async getAllRecursos(): Promise<Recurso[]> {
    const db = await this.abrirConexion();
    return new Promise<Recurso[]>((resolve) => {
      const transaccion = db.transaction(this.OBJETO_TIENDA, 'readonly');
      const tienda = transaccion.objectStore(this.OBJETO_TIENDA);
      const recursos: Recurso[] = [];

      transaccion.oncomplete = () => {
        resolve(recursos);
      };

      const solicitud = tienda.openCursor();
      solicitud.onsuccess = (evento) => {
        const cursor = (evento.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          recursos.push(cursor.value);
          cursor.continue();
        }
      };
    });
  }

  async agregarRecurso(recurso: Recurso): Promise<void> {
    const db = await this.abrirConexion();
    const transaccion = db.transaction(this.OBJETO_TIENDA, 'readwrite');
    const tienda = transaccion.objectStore(this.OBJETO_TIENDA);
    tienda.add(recurso);
  }

  async actualizarRecurso(recurso: Recurso): Promise<void> {
    const db = await this.abrirConexion();
    const transaccion = db.transaction(this.OBJETO_TIENDA, 'readwrite');
    const tienda = transaccion.objectStore(this.OBJETO_TIENDA);
    tienda.put(recurso);
  }

  async eliminarRecurso(codigo: string): Promise<void> {
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
