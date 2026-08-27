import { ApiService } from './api-service';

/**
 * Payload for a write. A field may be omitted to leave it as it is, or sent as
 * `null` to clear it — which is how a PATCH empties a nullable column.
 */
export type Writable<T> = { [K in keyof T]?: T[K] | null };

export abstract class RestService<T> extends ApiService {
  protected abstract anchor: string;

  public async getAll(): Promise<T[]> {
    const response = await this.api.get<T[]>(this.anchor);

    return response.data;
  }

  public async get(id: string): Promise<T> {
    const response = await this.api.get<T>(`${this.anchor}/${id}`);

    return response.data;
  }

  public async create(data: Writable<T>): Promise<T> {
    const response = await this.api.post<T>(this.anchor, data);

    return response.data;
  }

  public async update(id: string, data: Writable<T>): Promise<T> {
    const response = await this.api.patch<T>(`${this.anchor}/${id}`, data);

    return response.data;
  }

  public async delete(id: string): Promise<T> {
    const response = await this.api.delete<T>(`${this.anchor}/${id}`);

    return response.data;
  }
}
