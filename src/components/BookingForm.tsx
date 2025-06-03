import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
}

const BookingForm: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [times, setTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [smsCode, setSmsCode] = useState<string>('');
  const [step, setStep] = useState<'service' | 'date' | 'time' | 'phone' | 'sms'>('service');

  useEffect(() => {
    // Загрузка списка услуг
    axios.get('http://localhost:8080/api/services')
      .then(response => {
        setServices(response.data);
      })
      .catch(error => {
        console.error('Error loading services:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedDate) {
      // Загрузка доступного времени для выбранной даты
      axios.get(`http://localhost:8080/api/available_times?date=${selectedDate}`)
        .then(response => {
          setTimes(response.data);
        })
        .catch(error => {
          console.error('Error loading times:', error);
        });
    }
  }, [selectedDate]);

  useEffect(() => {
    // Загрузка доступных дат
    axios.get('http://localhost:8080/api/available_dates')
      .then(response => {
        setDates(response.data);
      })
      .catch(error => {
        console.error('Error loading dates:', error);
      });
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('date');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('phone');
  };

  const handlePhoneSubmit = () => {
    // Отправка SMS-кода
    axios.post('http://localhost:8080/api/send_sms', {
      phone,
      telegram_id: 123 // Заглушка, замените на реальный ID
    })
      .then(() => {
        setStep('sms');
      })
      .catch(error => {
        console.error('Error sending SMS:', error);
      });
  };

  const handleSmsSubmit = () => {
    // Создание записи
    axios.post('http://localhost:8080/api/bookings', {
      phone,
      telegram_id: 123, // Заглушка, замените на реальный ID
      name: 'User', // Заглушка, замените на реальное имя
      service_id: selectedService?.id,
      date: selectedDate,
      time: selectedTime,
      code: smsCode
    })
      .then(() => {
        alert('Запись успешно создана!');
        setStep('service');
        setSelectedService(null);
        setSelectedDate('');
        setSelectedTime('');
        setPhone('');
        setSmsCode('');
      })
      .catch(error => {
        console.error('Error creating booking:', error);
      });
  };

  return (
    <div>
      {step === 'service' && (
        <div>
          <h2>Выберите услугу</h2>
          {services.map(service => (
            <div key={service.id} onClick={() => handleServiceSelect(service)}>
              {service.name} - {service.price} руб. ({service.duration} мин.)
            </div>
          ))}
        </div>
      )}

      {step === 'date' && (
        <div>
          <h2>Выберите дату</h2>
          {dates.map(date => (
            <div key={date} onClick={() => handleDateSelect(date)}>
              {date}
            </div>
          ))}
        </div>
      )}

      {step === 'time' && (
        <div>
          <h2>Выберите время</h2>
          {times.map(time => (
            <div key={time} onClick={() => handleTimeSelect(time)}>
              {time}
            </div>
          ))}
        </div>
      )}

      {step === 'phone' && (
        <div>
          <h2>Введите номер телефона</h2>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button onClick={handlePhoneSubmit}>Отправить код</button>
        </div>
      )}

      {step === 'sms' && (
        <div>
          <h2>Введите SMS-код</h2>
          <input type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} />
          <button onClick={handleSmsSubmit}>Подтвердить</button>
        </div>
      )}
    </div>
  );
};

export default BookingForm; 