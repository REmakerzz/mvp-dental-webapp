import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { Box, Button, Typography, Container, ThemeProvider, createTheme } from '@mui/material';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
}

interface DateInfo {
  date: string;
  status: 'available' | 'booked' | 'weekend';
  isActive: boolean;
}

interface TimeSlot {
  time: string;
  status: 'free' | 'busy';
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#43a047', // Зеленый для доступных дат
    },
    error: {
      main: '#d32f2f', // Красный для занятых дат
    },
    grey: {
      500: '#9e9e9e', // Серый для выходных
    },
  },
});

const BookingForm: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dates, setDates] = useState<DateInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
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
    // Загрузка доступных дат
    axios.get('http://localhost:8080/api/available_dates')
      .then(response => {
        setDates(response.data);
      })
      .catch(error => {
        console.error('Error loading dates:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedDate) {
      // Загрузка доступного времени для выбранной даты
      axios.get(`http://localhost:8080/api/available_times?date=${selectedDate.toISOString().split('T')[0]}`)
        .then(response => {
          const times = response.data.map((time: string) => ({
            time,
            status: 'free'
          }));
          setTimeSlots(times);
        })
        .catch(error => {
          console.error('Error loading times:', error);
        });
    }
  }, [selectedDate]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('date');
  };

  const handleDateSelect = (date: Date | null) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      const dateInfo = dates.find(d => d.date === dateStr);
      if (dateInfo && dateInfo.isActive) {
        setSelectedDate(date);
        setStep('time');
      }
    }
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
      date: selectedDate?.toISOString().split('T')[0],
      time: selectedTime,
      code: smsCode
    })
      .then(() => {
        alert('Запись успешно создана!');
        setStep('service');
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime('');
        setPhone('');
        setSmsCode('');
      })
      .catch(error => {
        console.error('Error creating booking:', error);
      });
  };

  // Функция для рендеринга дней в календаре
  const renderDay = (day: Date, selectedDays: Date[], dayProps: any) => {
    const dateStr = day.toISOString().split('T')[0];
    const dateInfo = dates.find(d => d.date === dateStr);

    if (!dateInfo) {
      return <PickersDay {...dayProps} day={day} selectedDays={selectedDays} />;
    }

    let sx = {};
    switch (dateInfo.status) {
      case 'available':
        sx = { bgcolor: '#43a047', color: '#fff', '&:hover': { bgcolor: '#43a047' } };
        break;
      case 'booked':
        sx = { bgcolor: '#d32f2f', color: '#fff', '&:hover': { bgcolor: '#d32f2f' } };
        break;
      case 'weekend':
        sx = { bgcolor: '#9e9e9e', color: '#fff', '&:hover': { bgcolor: '#9e9e9e' } };
        break;
    }

    return (
      <PickersDay
        {...dayProps}
        day={day}
        selectedDays={selectedDays}
        disabled={!dateInfo.isActive}
        sx={sx}
      />
    );
  };

  if (step === 'service') {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h5" gutterBottom>Выберите услугу</Typography>
          <Box mt={3} display="flex" flexDirection="column" gap={2}>
            {services.map(service => (
              <Button
                key={service.id}
                variant="outlined"
                fullWidth
                onClick={() => handleServiceSelect(service)}
                sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 2 }}
              >
                <Box>
                  <Typography variant="subtitle1">{service.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.duration} мин · {service.price} ₽
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  if (step === 'date' && selectedService) {
    return (
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
          <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h5" gutterBottom>Выберите дату</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {selectedService.name} · {selectedService.duration} мин · {selectedService.price} ₽
            </Typography>
            <Box mt={4}>
              <DatePicker
                label="Дата приёма"
                value={selectedDate}
                onChange={handleDateSelect}
                disablePast
                slots={{ day: renderDay }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </Container>
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  if (step === 'time' && selectedService && selectedDate) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h5" gutterBottom>Выберите время</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {selectedService.name} · {selectedService.duration} мин · {selectedService.price} ₽<br/>
            {selectedDate.toLocaleDateString('ru-RU')}
          </Typography>
          <Box mt={3} display="flex" flexWrap="wrap" gap={2}>
            {timeSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={slot.status === 'free' ? (selectedTime === slot.time ? 'contained' : 'outlined') : 'outlined'}
                color={slot.status === 'free' ? 'primary' : 'error'}
                disabled={slot.status === 'busy'}
                sx={{ minWidth: 100, mb: 1, borderRadius: 3, fontWeight: 600 }}
                onClick={() => handleTimeSelect(slot.time)}
              >
                {slot.time}
              </Button>
            ))}
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  if (step === 'phone') {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h5" gutterBottom>Введите номер телефона</Typography>
          <Box mt={3} display="flex" flexDirection="column" gap={2}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handlePhoneSubmit}
            >
              Отправить код
            </Button>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  if (step === 'sms') {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h5" gutterBottom>Введите SMS-код</Typography>
          <Box mt={3} display="flex" flexDirection="column" gap={2}>
            <input
              type="text"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSmsSubmit}
            >
              Подтвердить
            </Button>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return null;
};

export default BookingForm; 