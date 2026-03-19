export interface ProductAttribute {
  name: string;
  options: string[];
}

export interface ProductVariation {
  id: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  sku?: string;
  stockQuantity?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'on_backorder';
  image?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
}

export interface Product {
  id: string;
  type?: 'simple' | 'variable';
  name: string;
  price: number;
  salePrice?: number;
  sku?: string;
  stockQuantity?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'on_backorder';
  category: string;
  tags?: string[];
  image: string;
  gallery?: string[];
  shortDescription?: string;
  description?: string;
  featured?: boolean;
  rating?: number;
  reviewsCount?: number;
  specs?: string[];
  createdAt?: string;
  updatedAt?: string;
  
  // Tax and Shipping
  taxStatus?: 'taxable' | 'shipping' | 'none';
  taxClass?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  shippingClass?: string;

  // Variable Product Data
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
}
