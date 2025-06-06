export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  description: string;
  photo_url: string;
  is_active: boolean;
}

export interface Booking {
  id: number;
  user_name: string;
  service_name: string;
  date: string;
  time: string;
  status: 'active' | 'cancelled' | 'completed';
} 