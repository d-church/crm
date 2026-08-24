import { ApiService } from './api-service';

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

  public async create(data: Partial<T>): Promise<T> {
    const response = await this.api.post<T>(this.anchor, data);

    return response.data;
  }

  public async update(id: string, data: Partial<T>): Promise<T> {
    const response = await this.api.patch<T>(`${this.anchor}/${id}`, data);

    return response.data;
  }

  public async delete(id: string): Promise<T> {
    const response = await this.api.delete<T>(`${this.anchor}/${id}`);

    return response.data;
  }
}
