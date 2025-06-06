import React, { useState, useEffect } from 'react';
import { Service, Doctor } from '../types';
import { getServices } from '../api/services';
import { getDoctors } from '../api/doctors';

interface BookingFormProps {
  onSubmit: (booking: {
    service_id: number;
    doctor_id: number;
    date: string;
    time: string;
    user_name: string;
    user_phone: string;
  }) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSubmit }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    service_id: '',
    doctor_id: '',
    date: '',
    time: '',
    user_name: '',
    user_phone: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, doctorsData] = await Promise.all([
          getServices(),
          getDoctors()
        ]);
        setServices(servicesData);
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      service_id: parseInt(formData.service_id),
      doctor_id: parseInt(formData.doctor_id),
      date: formData.date,
      time: formData.time,
      user_name: formData.user_name,
      user_phone: formData.user_phone
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'service_id') {
      const service = services.find(s => s.id === parseInt(value));
      setSelectedService(service || null);
    } else if (name === 'doctor_id') {
      const doctor = doctors.find(d => d.id === parseInt(value));
      setSelectedDoctor(doctor || null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <div className="mb-3">
        <label htmlFor="service_id" className="form-label">Услуга</label>
        <select
          className="form-select"
          id="service_id"
          name="service_id"
          value={formData.service_id}
          onChange={handleChange}
          required
        >
          <option value="">Выберите услугу</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>
              {service.name} - {service.price} ₽
            </option>
          ))}
        </select>
        {selectedService && (
          <div className="form-text">
            {selectedService.description}
          </div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="doctor_id" className="form-label">Врач</label>
        <select
          className="form-select"
          id="doctor_id"
          name="doctor_id"
          value={formData.doctor_id}
          onChange={handleChange}
          required
        >
          <option value="">Выберите врача</option>
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialization}
            </option>
          ))}
        </select>
        {selectedDoctor && (
          <div className="form-text">
            {selectedDoctor.description}
          </div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="date" className="form-label">Дата</label>
        <input
          type="date"
          className="form-control"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="time" className="form-label">Время</label>
        <input
          type="time"
          className="form-control"
          id="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="user_name" className="form-label">Ваше имя</label>
        <input
          type="text"
          className="form-control"
          id="user_name"
          name="user_name"
          value={formData.user_name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="user_phone" className="form-label">Телефон</label>
        <input
          type="tel"
          className="form-control"
          id="user_phone"
          name="user_phone"
          value={formData.user_phone}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Записаться
      </button>
    </form>
  );
};

export default BookingForm; 