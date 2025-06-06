import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Service, Doctor, Booking } from '../types';
import { getServices, addService, updateService, deleteService } from '../api/services';
import { getDoctors, addDoctor, updateDoctor, deleteDoctor } from '../api/doctors';
import { getBookings, cancelBooking } from '../api/bookings';

const AdminPanel: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesData, doctorsData, bookingsData] = await Promise.all([
        getServices(),
        getDoctors(),
        getBookings()
      ]);
      setServices(servicesData);
      setDoctors(doctorsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleServiceSubmit = async (service: Service) => {
    try {
      if (service.id) {
        await updateService(service);
      } else {
        await addService(service);
      }
      setShowServiceModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDoctorSubmit = async (doctor: Doctor) => {
    try {
      if (doctor.id) {
        await updateDoctor(doctor);
      } else {
        await addDoctor(doctor);
      }
      setShowDoctorModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving doctor:', error);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await cancelBooking(bookingId);
      loadData();
    } catch (error) {
      console.error('Error canceling booking:', error);
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Админ-панель</h1>
      
      <Tabs>
        <TabList>
          <Tab>Услуги</Tab>
          <Tab>Врачи</Tab>
          <Tab>Записи</Tab>
        </TabList>

        <TabPanel>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Управление услугами</h2>
            <button className="btn btn-primary" onClick={() => setShowServiceModal(true)}>
              Добавить услугу
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Описание</th>
                  <th>Цена</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>{service.description}</td>
                    <td>{service.price} ₽</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => {
                          setSelectedService(service);
                          setShowServiceModal(true);
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteService(service.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabPanel>

        <TabPanel>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Управление врачами</h2>
            <button className="btn btn-primary" onClick={() => setShowDoctorModal(true)}>
              Добавить врача
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Специализация</th>
                  <th>Описание</th>
                  <th>Фото</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doctor => (
                  <tr key={doctor.id}>
                    <td>{doctor.name}</td>
                    <td>{doctor.specialization}</td>
                    <td>{doctor.description}</td>
                    <td>
                      {doctor.photo_url && (
                        <img
                          src={doctor.photo_url}
                          alt={doctor.name}
                          style={{ maxWidth: '50px' }}
                        />
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setShowDoctorModal(true);
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteDoctor(doctor.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabPanel>

        <TabPanel>
          <h2>Управление записями</h2>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь</th>
                  <th>Услуга</th>
                  <th>Дата</th>
                  <th>Время</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.user_name}</td>
                    <td>{booking.service_name}</td>
                    <td>{new Date(booking.date).toLocaleDateString()}</td>
                    <td>{booking.time}</td>
                    <td>{booking.status}</td>
                    <td>
                      {booking.status === 'active' && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Отменить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabPanel>
      </Tabs>

      {showServiceModal && (
        <ServiceModal
          service={selectedService}
          onClose={() => {
            setShowServiceModal(false);
            setSelectedService(null);
          }}
          onSubmit={handleServiceSubmit}
        />
      )}

      {showDoctorModal && (
        <DoctorModal
          doctor={selectedDoctor}
          onClose={() => {
            setShowDoctorModal(false);
            setSelectedDoctor(null);
          }}
          onSubmit={handleDoctorSubmit}
        />
      )}
    </div>
  );
};

export default AdminPanel; 