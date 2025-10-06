import { config } from '../config/environment';

// Interfaces para Productos
export interface Product {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  marca?: string;
  codigo_barras?: string;
  imagen_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  marca?: string;
  codigo_barras?: string;
  imagen_url?: string;
}

export interface UpdateProductData {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  categoria?: string;
  marca?: string;
  codigo_barras?: string;
  imagen_url?: string;
}

export interface ProductResponse {
  success: boolean;
  data: {
    producto: Product;
  };
  message?: string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    productos: Product[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  marca?: string;
  is_active?: boolean;
  stock_min?: number;
  precio_min?: number;
  precio_max?: number;
}

class ProductsService {
  private makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de acceso requerido');
    }

    const requestConfig: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    return fetch(`${config.apiBaseUrl}${endpoint}`, requestConfig)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
  }

  // Obtener todos los productos
  async getAllProducts(params: ProductsQueryParams = {}): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.categoria) queryParams.append('categoria', params.categoria);
    if (params.marca) queryParams.append('marca', params.marca);
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.stock_min) queryParams.append('stock_min', params.stock_min.toString());
    if (params.precio_min) queryParams.append('precio_min', params.precio_min.toString());
    if (params.precio_max) queryParams.append('precio_max', params.precio_max.toString());

    const queryString = queryParams.toString();
    const endpoint = `/productos${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ProductsResponse>(endpoint);
  }

  // Obtener producto por ID
  async getProductById(id: number): Promise<ProductResponse> {
    return this.makeRequest<ProductResponse>(`/productos/${id}`);
  }

  // Buscar productos por nombre o código
  async searchProducts(searchTerm: string, limit: number = 20): Promise<ProductsResponse> {
    return this.getAllProducts({
      search: searchTerm,
      limit: limit,
      is_active: true
    });
  }

  // Obtener productos con stock disponible
  async getAvailableProducts(params: ProductsQueryParams = {}): Promise<ProductsResponse> {
    return this.getAllProducts({
      ...params,
      is_active: true,
      stock_min: 1
    });
  }

  // Crear nuevo producto
  async createProduct(data: CreateProductData): Promise<ProductResponse> {
    return this.makeRequest<ProductResponse>('/productos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actualizar producto
  async updateProduct(id: number, data: UpdateProductData): Promise<ProductResponse> {
    return this.makeRequest<ProductResponse>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Eliminar producto (baja lógica)
  async deleteProduct(id: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/productos/${id}`, {
      method: 'DELETE',
    });
  }

  // Restaurar producto
  async restoreProduct(id: number): Promise<ProductResponse> {
    return this.makeRequest<ProductResponse>(`/productos/${id}/restore`, {
      method: 'PATCH',
    });
  }

  // Obtener categorías
  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    return this.makeRequest<{ success: boolean; data: string[] }>('/productos/categorias');
  }

  // Obtener marcas
  async getBrands(): Promise<{ success: boolean; data: string[] }> {
    return this.makeRequest<{ success: boolean; data: string[] }>('/productos/marcas');
  }
}

export const productsService = new ProductsService();
