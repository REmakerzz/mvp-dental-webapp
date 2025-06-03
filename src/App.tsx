import React from 'react';
import { Container, Box, Typography, Button, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { LocalizationProvider, DatePicker, PickersDay } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { isSameDay, addDays, startOfToday } from 'date-fns';
import TextField from '@mui/material/TextField';
import { API_URL } from './config';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#43a047',
    },
    background: {
      default: '#f7fafd',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 400,
    },
  },
});

type Step = 'main' | 'service' | 'date' | 'time' | 'confirm' | 'success';

function App() {
  // Состояния
  const [tgUser, setTgUser] = React.useState<{id: number; first_name: string; last_name?: string} | null>(null);
  const [step, setStep] = React.useState<Step>('main');
  const [services, setServices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedService, setSelectedService] = React.useState<any | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState('');
  const [phoneError, setPhoneError] = React.useState('');
  const [smsSent, setSmsSent] = React.useState(false);
  const [smsCode, setSmsCode] = React.useState('');
  const [smsError, setSmsError] = React.useState('');
  const [showCodeInput, setShowCodeInput] = React.useState(false);
  const [generatedCode, setGeneratedCode] = React.useState('');

  // Получение пользователя из Telegram WebApp API
  React.useEffect(() => {
    const initTelegramWebApp = () => {
      // @ts-ignore
      if (window.Telegram && window.Telegram.WebApp) {
        // @ts-ignore
        const webapp = window.Telegram.WebApp;
        webapp.ready();
        webapp.expand();
        
        // Логируем все данные Telegram WebApp
        console.log('Telegram WebApp:', webapp);
        console.log('initDataUnsafe:', webapp.initDataUnsafe);
        
        // @ts-ignore
        const user = webapp.initDataUnsafe?.user;
        console.log('Telegram user:', user);
        
        if (user) {
          setTgUser(user);
        } else {
          console.log('Telegram user not found in initDataUnsafe');
        }
      } else {
        console.log('Telegram WebApp not found, retrying in 1s...');
        setTimeout(initTelegramWebApp, 1000);
      }
    };
    
    initTelegramWebApp();
  }, []);

  // Загрузка услуг
  React.useEffect(() => {
    if (step === 'service') {
      setLoading(true);
      setError(null);
      fetch(`${API_URL}/api/services`)
        .then((res) => {
          if (!res.ok) throw new Error('Ошибка загрузки услуг');
          return res.json();
        })
        .then((data) => {
          console.log('Loaded services:', data);
          setServices(data);
        })
        .catch((e) => {
          console.error('Error loading services:', e);
          setError(e.message);
        })
        .finally(() => setLoading(false));
    }
  }, [step]);

  // Календарь (заглушка)
  const today = startOfToday();
  const availableDays = React.useMemo(() => {
    // Массив: {date: Date, status: 'free' | 'busy' | 'disabled'}
    return Array.from({ length: 14 }).map((_, i) => {
      const date = addDays(today, i);
      // Случайная генерация доступности (для демо)
      const rnd = Math.random();
      let status: 'free' | 'busy' | 'disabled' = 'free';
      if (rnd < 0.2) status = 'busy';
      if (rnd < 0.05) status = 'disabled';
      return { date, status };
    });
  }, [today]);

  // Генерация слотов времени (заглушка)
  const timeSlots = React.useMemo(() => {
    // 9:00 - 18:00, шаг 30 мин
    const slots: { time: string; status: 'free' | 'busy' }[] = [];
    for (let h = 9; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        // Случайная занятость
        const status = Math.random() < 0.2 ? 'busy' : 'free';
        slots.push({ time, status });
      }
    }
    return slots;
  }, [selectedDate, selectedService]);

  function renderDay(day: Date, value: Date | null, DayComponentProps: any) {
    const found = availableDays.find((d) => isSameDay(d.date, day));
    let color: string | undefined = undefined;
    if (found) {
      if (found.status === 'free') color = '#43a047';
      if (found.status === 'busy') color = '#e53935';
      if (found.status === 'disabled') color = '#bdbdbd';
    }
    return (
      <PickersDay
        {...DayComponentProps}
        sx={color ? { bgcolor: color, color: '#fff', '&:hover': { bgcolor: color } } : {}}
        disabled={found?.status === 'disabled'}
      />
    );
  }

  // Валидация телефона
  function normalizePhone(phone: string) {
    // Оставляем только цифры
    return phone.replace(/\D/g, '');
  }

  function formatPhoneForServer(phone: string) {
    const digits = normalizePhone(phone);
    
    // Если длина 11 цифр
    if (digits.length === 11) {
      // Если начинается с 8, заменяем на +7
      if (digits.startsWith('8')) {
        return '+7' + digits.slice(1);
      }
      // Если начинается с 7, добавляем +
      if (digits.startsWith('7')) {
        return '+' + digits;
      }
    }
    return '';
  }

  function validatePhone(phone: string) {
    const digits = normalizePhone(phone);
    return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
  }

  // Отправка SMS
  const handleGetCode = async () => {
    try {
      console.log('Telegram WebApp:', window.Telegram.WebApp);
      console.log('User:', window.Telegram.WebApp.initDataUnsafe?.user);
      
      if (!window.Telegram.WebApp.initDataUnsafe?.user?.id) {
        setError('Ошибка: приложение должно быть открыто через Telegram');
        return;
      }

      const response = await fetch('https://mvp-dental-backend.onrender.com/api/send_sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formatPhoneForServer(phone),
          telegram_id: window.Telegram.WebApp.initDataUnsafe.user.id
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.error) {
        setError(data.error);
      } else {
        setShowCodeInput(true);
        setGeneratedCode(data.code);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Ошибка при отправке кода');
    }
  };

  // Подтверждение записи
  const handleConfirmBooking = async () => {
    if (!validatePhone(phone)) {
      setPhoneError('Введите корректный номер телефона');
      return;
    }
    if (!smsCode) {
      setSmsError('Введите код из SMS');
      return;
    }
    setPhoneError('');
    setSmsError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formatPhoneForServer(phone),
          telegram_id: tgUser?.id,
          name: tgUser?.first_name,
          service_id: selectedService.id,
          date: selectedDate?.toISOString().split('T')[0],
          time: selectedTime,
          code: smsCode
        })
      });
      if (!response.ok) throw new Error('Ошибка создания записи');
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания записи');
    } finally {
      setLoading(false);
    }
  };

  // --- UI шаги ---
  if (step === 'main') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box textAlign="center" mb={4}>
            <MedicalServicesIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Добро пожаловать в стоматологию
            </Typography>
            {tgUser && (
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {tgUser.first_name}{tgUser.last_name ? ` ${tgUser.last_name}` : ''}, рады видеть вас!
              </Typography>
            )}
            {!tgUser && (
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Онлайн-запись на приём — быстро, удобно, современно
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 600, fontSize: 18 }}
            onClick={() => setStep('service')}
          >
            Записаться на приём
          </Button>
        </Container>
      </ThemeProvider>
    );
  }

  if (step === 'service') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h5" gutterBottom>Выберите услугу</Typography>
          {loading && <Typography>Загрузка...</Typography>}
          {error && <Typography color="error">{error}</Typography>}
          {!loading && !error && services.length === 0 && (
            <Typography color="text.secondary">Нет доступных услуг</Typography>
          )}
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            {services.map((s) => (
              <Button
                key={s.ID}
                variant="outlined"
                color="primary"
                sx={{ justifyContent: 'flex-start', textAlign: 'left', borderRadius: 3, p: 2 }}
                onClick={() => {
                  setSelectedService(s);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setStep('date');
                }}
              >
                <Box>
                  <Typography fontWeight={600}>{s.Name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.Duration} мин · {s.Price} ₽
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
        <CssBaseline />
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
                onChange={(date) => setSelectedDate(date)}
                disablePast
                slots={{ day: (props) => renderDay(props.day as Date, selectedDate, props) }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
            {selectedDate && (
              <Box mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ borderRadius: 3 }}
                  onClick={() => setStep('time')}
                >
                  Далее
                </Button>
              </Box>
            )}
          </Container>
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  if (step === 'time' && selectedService && selectedDate) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
                onClick={() => {
                  setSelectedTime(slot.time);
                  setStep('confirm');
                }}
              >
                {slot.time}
              </Button>
            ))}
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  if (step === 'confirm' && selectedService && selectedDate && selectedTime) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h5" gutterBottom>Подтверждение записи</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {selectedService.name} · {selectedService.duration} мин · {selectedService.price} ₽<br/>
            {selectedDate.toLocaleDateString('ru-RU')} · {selectedTime}
          </Typography>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          {!smsSent ? (
            <Box mt={3}>
              <TextField
                label="Телефон"
                value={phone}
                onChange={e => {
                  const newValue = e.target.value;
                  // Оставляем только цифры
                  const digits = newValue.replace(/\D/g, '');
                  // Ограничиваем длину 11 цифрами
                  if (digits.length <= 11) {
                    setPhone(digits);
                  }
                }}
                fullWidth
                placeholder="Введите номер телефона"
                error={!!phoneError}
                helperText={phoneError || 'Введите 11 цифр номера телефона'}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ borderRadius: 3 }}
                onClick={handleGetCode}
              >
                Получить код
              </Button>
            </Box>
          ) : (
            <Box mt={3}>
              <TextField
                label="Код из SMS"
                value={smsCode}
                onChange={e => setSmsCode(e.target.value)}
                fullWidth
                error={!!smsError}
                helperText={smsError || 'Введите код, отправленный на телефон'}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ borderRadius: 3 }}
                disabled={smsCode.length !== 4}
                onClick={handleConfirmBooking}
              >
                Подтвердить запись
              </Button>
            </Box>
          )}
        </Container>
      </ThemeProvider>
    );
  }

  if (step === 'success') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <Typography variant="h5" color="success.main" gutterBottom>Запись подтверждена!</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Спасибо за запись! Мы ждём вас в клинике.
          </Typography>
          <Button variant="contained" color="primary" sx={{ borderRadius: 3, mt: 3 }} onClick={() => {
            setStep('main');
            setSelectedService(null);
            setSelectedDate(null);
            setSelectedTime(null);
            setPhone('');
            setSmsSent(false);
            setSmsCode('');
            setSmsError('');
          }}>В главное меню</Button>
        </Container>
      </ThemeProvider>
    );
  }

  return null;
}

export default App; 