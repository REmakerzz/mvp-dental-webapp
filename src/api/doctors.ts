import { Doctor } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const getDoctors = async (): Promise<Doctor[]> => {
  const response = await fetch(`${API_URL}/api/doctors`);
  if (!response.ok) {
    throw new Error('Failed to fetch doctors');
  }
  return response.json();
};

export const addDoctor = async (doctor: Omit<Doctor, 'id'>): Promise<Doctor> => {
  const response = await fetch(`${API_URL}/api/doctors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doctor),
  });
  if (!response.ok) {
    throw new Error('Failed to add doctor');
  }
  return response.json();
};

export const updateDoctor = async (doctor: Doctor): Promise<Doctor> => {
  const response = await fetch(`${API_URL}/api/doctors/${doctor.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doctor),
  });
  if (!response.ok) {
    throw new Error('Failed to update doctor');
  }
  return response.json();
};

export const deleteDoctor = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/doctors/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete doctor');
  }
}; 