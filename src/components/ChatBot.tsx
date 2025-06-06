import React, { useState, useEffect, useRef } from 'react';
import { Service, Doctor } from '../types';
import { getServices } from '../api/services';
import { getDoctors } from '../api/doctors';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  buttons?: { text: string; callback_data: string }[];
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Добавляем приветственное сообщение
    setMessages([
      {
        id: 1,
        text: 'Здравствуйте! Я бот стоматологической клиники. Чем могу помочь?',
        isBot: true,
        buttons: [
          { text: 'Записаться на прием', callback_data: 'book' },
          { text: 'Узнать цены', callback_data: 'prices' },
          { text: 'Наши врачи', callback_data: 'doctors' }
        ]
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleButtonClick = (callbackData: string) => {
    switch (callbackData) {
      case 'book':
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: 'Выберите услугу:',
            isBot: true,
            buttons: services.map(service => ({
              text: `${service.name} - ${service.price} ₽`,
              callback_data: `service_${service.id}`
            }))
          }
        ]);
        break;

      case 'prices':
        const pricesMessage = services
          .map(service => `${service.name}: ${service.price} ₽`)
          .join('\n');
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: 'Наши цены:\n' + pricesMessage,
            isBot: true,
            buttons: [
              { text: 'Записаться на прием', callback_data: 'book' },
              { text: 'Наши врачи', callback_data: 'doctors' }
            ]
          }
        ]);
        break;

      case 'doctors':
        const doctorsMessage = doctors
          .map(doctor => `${doctor.name} - ${doctor.specialization}`)
          .join('\n');
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: 'Наши врачи:\n' + doctorsMessage,
            isBot: true,
            buttons: [
              { text: 'Записаться на прием', callback_data: 'book' },
              { text: 'Узнать цены', callback_data: 'prices' }
            ]
          }
        ]);
        break;

      default:
        if (callbackData.startsWith('service_')) {
          const serviceId = parseInt(callbackData.split('_')[1]);
          const service = services.find(s => s.id === serviceId);
          if (service) {
            setMessages(prev => [
              ...prev,
              {
                id: prev.length + 1,
                text: `Вы выбрали услугу: ${service.name}\nВыберите врача:`,
                isBot: true,
                buttons: doctors.map(doctor => ({
                  text: `${doctor.name} - ${doctor.specialization}`,
                  callback_data: `doctor_${doctor.id}_${serviceId}`
                }))
              }
            ]);
          }
        } else if (callbackData.startsWith('doctor_')) {
          const [_, doctorId, serviceId] = callbackData.split('_');
          const doctor = doctors.find(d => d.id === parseInt(doctorId));
          const service = services.find(s => s.id === parseInt(serviceId));
          if (doctor && service) {
            setMessages(prev => [
              ...prev,
              {
                id: prev.length + 1,
                text: `Вы выбрали:\nУслуга: ${service.name}\nВрач: ${doctor.name}\n\nДля записи перейдите на наш сайт: https://remakerzz.github.io/mvp-dental-webapp/`,
                isBot: true,
                buttons: [
                  { text: 'Записаться на прием', callback_data: 'book' },
                  { text: 'Узнать цены', callback_data: 'prices' },
                  { text: 'Наши врачи', callback_data: 'doctors' }
                ]
              }
            ]);
          }
        }
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          text: input,
          isBot: false
        }
      ]);
      setInput('');

      // Имитация ответа бота
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: 'Для записи на прием, пожалуйста, используйте кнопки ниже:',
            isBot: true,
            buttons: [
              { text: 'Записаться на прием', callback_data: 'book' },
              { text: 'Узнать цены', callback_data: 'prices' },
              { text: 'Наши врачи', callback_data: 'doctors' }
            ]
          }
        ]);
      }, 1000);
    }
  };

  return (
    <div className="chatbot">
      <div className="chatbot-messages">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.isBot ? 'bot' : 'user'}`}
          >
            <div className="message-content">
              {message.text.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            {message.buttons && (
              <div className="message-buttons">
                {message.buttons.map(button => (
                  <button
                    key={button.callback_data}
                    className="btn btn-primary btn-sm me-2 mb-2"
                    onClick={() => handleButtonClick(button.callback_data)}
                  >
                    {button.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Введите сообщение..."
          className="form-control"
        />
        <button type="submit" className="btn btn-primary">
          Отправить
        </button>
      </form>
    </div>
  );
};

export default ChatBot; 