import React, { useState, useEffect, useMemo } from 'react';
import { scheduleAPI, roomsAPI } from '../api/api';
import BookingModal from '../components/BookingModal';
import './Schedule.css';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 9); // 9:00 - 23:00
const HOUR_HEIGHT = 60; // пикселей на час

const Schedule = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookings, setBookings] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day' | 'week'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Вычисляем дни недели для режима "Неделя"
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  // Даты для загрузки данных
  const datesToLoad = useMemo(() => {
    if (viewMode === 'day') {
      return [selectedDate];
    }
    return weekDays;
  }, [viewMode, selectedDate, weekDays]);

  // Загрузка комнат
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await roomsAPI.list();
        const roomsList = response.data.results || response.data || [];
        setRooms(roomsList);
        if (roomsList.length > 0 && !selectedRoom) {
          setSelectedRoom(roomsList[0]);
        }
      } catch (err) {
        console.error('Ошибка загрузки комнат:', err);
      }
    };
    loadRooms();
  }, []);

  // Загрузка расписания
  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      try {
        const bookingsData = {};
        await Promise.all(
          datesToLoad.map(async (day) => {
            const dateStr = formatDate(day);
            const response = await scheduleAPI.getSchedule(dateStr);
            bookingsData[dateStr] = response.data;
          })
        );
        setBookings(bookingsData);
      } catch (err) {
        setError('Ошибка загрузки расписания');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, [datesToLoad]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  };

  const getDayNumber = (date) => {
    return date.getDate();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Получить бронирования для комнаты и даты
  const getRoomBookings = (roomId, date) => {
    const dateStr = formatDate(date);
    const dayData = bookings[dateStr];
    if (!dayData?.rooms) return [];
    
    const room = dayData.rooms.find(r => r.id === roomId);
    return room?.bookings || [];
  };

  // Вычислить позицию и высоту бронирования
  const getBookingStyle = (booking) => {
    const [startHour, startMin] = booking.start_time.split(':').map(Number);
    const [endHour, endMin] = booking.end_time.split(':').map(Number);
    
    const startOffset = (startHour - 9) * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT;
    const duration = (endHour - startHour) * HOUR_HEIGHT + ((endMin - startMin) / 60) * HOUR_HEIGHT;
    
    return {
      top: `${startOffset}px`,
      height: `${Math.max(duration, 24)}px`,
    };
  };

  // Генерация уникального цвета для комнаты на основе её ID
  const getRoomColor = (roomId) => {
    // Используем золотое сечение для равномерного распределения цветов
    const goldenRatio = 0.618033988749895;
    const hue = ((roomId * goldenRatio) % 1) * 360;
    return `hsla(${hue}, 70%, 55%, 0.5)`;
  };

  // Получить цвет границы (более насыщенный)
  const getRoomBorderColor = (roomId) => {
    const goldenRatio = 0.618033988749895;
    const hue = ((roomId * goldenRatio) % 1) * 360;
    return `hsl(${hue}, 70%, 40%)`;
  };

  // Обработка наведения на бронирование
  const handleBookingMouseEnter = (e, booking, room) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredBooking({ ...booking, roomName: room.name });
  };

  const handleBookingMouseLeave = () => {
    setHoveredBooking(null);
  };

  // Обработка клика по ячейке
  const handleCellClick = (room, date, hour) => {
    setSelectedSlot({
      room,
      date: formatDate(date),
      startTime: `${hour.toString().padStart(2, '0')}:00`,
    });
    setShowModal(true);
  };

  const handleBookingSuccess = () => {
    setShowModal(false);
    // Перезагружаем расписание
    const loadSchedule = async () => {
      const bookingsData = {};
      await Promise.all(
        datesToLoad.map(async (day) => {
          const dateStr = formatDate(day);
          const response = await scheduleAPI.getSchedule(dateStr);
          bookingsData[dateStr] = response.data;
        })
      );
      setBookings(bookingsData);
    };
    loadSchedule();
  };

  // Навигация
  const goToToday = () => {
    setSelectedDate(new Date());
    setCalendarMonth(new Date());
  };

  const navigate = (direction) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setSelectedDate(newDate);
  };

  // Генерация мини-календаря
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay() || 7;
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    for (let i = 1; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
    const start = weekDays[0];
    const end = weekDays[weekDays.length - 1];
    const startStr = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  // Проверка, входит ли дата в текущую неделю
  const isInCurrentWeek = (date) => {
    if (!date) return false;
    return weekDays.some(d => d.toDateString() === date.toDateString());
  };

  if (loading && Object.keys(bookings).length === 0) {
    return <div className="schedule-loading">Загрузка расписания...</div>;
  }

  return (
    <div className="schedule-page">
      {/* Левая панель с выбором аудитории и календарём */}
      <aside className="schedule-sidebar">
        {/* Выбор комнаты для режима "Неделя" */}
        {viewMode === 'week' && (
          <div className="room-selector">
            <label>Аудитория:</label>
            <select 
              value={selectedRoom?.id || ''} 
              onChange={(e) => {
                const room = rooms.find(r => r.id === Number(e.target.value));
                setSelectedRoom(room);
              }}
            >
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.capacity} чел.)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mini-calendar">
          <div className="mini-calendar-header">
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>
              ‹
            </button>
            <span>
              {calendarMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>
              ›
            </button>
          </div>
          <div className="mini-calendar-weekdays">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mini-calendar-days">
            {generateCalendarDays().map((day, idx) => (
              <button
                key={idx}
                className={`mini-calendar-day ${!day ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''} ${day && formatDate(day) === formatDate(selectedDate) ? 'selected' : ''} ${day && isWeekend(day) ? 'weekend' : ''} ${day && viewMode === 'week' && isInCurrentWeek(day) ? 'in-week' : ''}`}
                onClick={() => day && setSelectedDate(day)}
                disabled={!day}
              >
                {day?.getDate()}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Основная область */}
      <main className="schedule-main">
        {/* Верхняя панель */}
        <div className="schedule-toolbar">
          <div className="view-switcher">
            <button 
              className={viewMode === 'day' ? 'active' : ''} 
              onClick={() => setViewMode('day')}
            >
              День
            </button>
            <button 
              className={viewMode === 'week' ? 'active' : ''} 
              onClick={() => setViewMode('week')}
            >
              Неделя
            </button>
          </div>
          
          <div className="date-navigation">
            <button onClick={() => navigate(-1)}>‹</button>
            <span className="date-range">{getDateRangeText()}</span>
            <button onClick={() => navigate(1)}>›</button>
          </div>
          
          <button className="today-btn" onClick={goToToday}>
            Сегодня
          </button>
        </div>

        {error && <div className="schedule-error">{error}</div>}

        {/* Сетка расписания */}
        <div className="schedule-grid-container">
          <div className={`schedule-grid ${viewMode}`}>
            {/* Заголовок с комнатами или днями */}
            <div className="grid-header">
              <div className="time-column-header"></div>
              
              {viewMode === 'day' ? (
                // Режим "День" - показываем комнаты
                rooms.map(room => (
                  <div key={room.id} className="column-header">
                    <div className="header-title">{room.name}</div>
                    <div className="header-subtitle">{room.capacity} чел.</div>
                  </div>
                ))
              ) : (
                // Режим "Неделя" - показываем дни
                weekDays.map(day => (
                  <div 
                    key={formatDate(day)} 
                    className={`column-header ${isToday(day) ? 'today' : ''} ${isWeekend(day) ? 'weekend' : ''}`}
                  >
                    <div className="header-weekday">{getDayName(day)}</div>
                    <div className={`header-day-number ${isToday(day) ? 'today' : ''}`}>
                      {getDayNumber(day)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Тело сетки */}
            <div className="grid-body">
              {/* Колонка времени */}
              <div className="time-column">
                {HOURS.map(hour => (
                  <div key={hour} className="time-slot" style={{ height: HOUR_HEIGHT }}>
                    <span>{hour.toString().padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {viewMode === 'day' ? (
                // Режим "День" - колонки комнат
                rooms.map(room => (
                  <div key={room.id} className="data-column">
                    {HOURS.map(hour => (
                      <div 
                        key={hour} 
                        className="hour-cell"
                        style={{ height: HOUR_HEIGHT }}
                        onClick={() => handleCellClick(room, selectedDate, hour)}
                      />
                    ))}
                    
                    <div className="bookings-overlay">
                      {getRoomBookings(room.id, selectedDate).map((booking, idx) => (
                        <div
                          key={booking.id || idx}
                          className={`booking-block ${booking.is_own ? 'own' : ''}`}
                          style={{
                            ...getBookingStyle(booking),
                            '--booking-color': getRoomColor(room.id),
                            '--booking-border-color': getRoomBorderColor(room.id),
                          }}
                          onMouseEnter={(e) => handleBookingMouseEnter(e, booking, room)}
                          onMouseLeave={handleBookingMouseLeave}
                        >
                          <div className="booking-title">{booking.purpose || 'Бронирование'}</div>
                          <div className="booking-time">{booking.start_time} - {booking.end_time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Режим "Неделя" - колонки дней
                weekDays.map(day => (
                  <div 
                    key={formatDate(day)} 
                    className={`data-column ${isWeekend(day) ? 'weekend' : ''}`}
                  >
                    {HOURS.map(hour => (
                      <div 
                        key={hour} 
                        className="hour-cell"
                        style={{ height: HOUR_HEIGHT }}
                        onClick={() => selectedRoom && handleCellClick(selectedRoom, day, hour)}
                      />
                    ))}
                    
                    {selectedRoom && (
                      <div className="bookings-overlay">
                        {getRoomBookings(selectedRoom.id, day).map((booking, idx) => (
                          <div
                            key={booking.id || idx}
                            className={`booking-block ${booking.is_own ? 'own' : ''}`}
                            style={{
                              ...getBookingStyle(booking),
                              '--booking-color': getRoomColor(selectedRoom.id),
                              '--booking-border-color': getRoomBorderColor(selectedRoom.id),
                            }}
                            onMouseEnter={(e) => handleBookingMouseEnter(e, booking, selectedRoom)}
                            onMouseLeave={handleBookingMouseLeave}
                          >
                            <div className="booking-title">{booking.purpose || 'Бронирование'}</div>
                            <div className="booking-time">{booking.start_time} - {booking.end_time}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {showModal && selectedSlot && (
        <BookingModal
          room={selectedSlot.room}
          date={selectedSlot.date}
          onClose={() => setShowModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Tooltip при наведении на бронирование */}
      {hoveredBooking && (
        <div 
          className="booking-tooltip"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-room">{hoveredBooking.roomName}</span>
          </div>
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span className="tooltip-icon">🕐</span>
              <span>{hoveredBooking.start_time} - {hoveredBooking.end_time}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-icon">👤</span>
              <span>{hoveredBooking.user_name || 'Не указан'}</span>
            </div>
            {hoveredBooking.purpose && (
              <div className="tooltip-row">
                <span className="tooltip-icon">📝</span>
                <span>{hoveredBooking.purpose}</span>
              </div>
            )}
            {hoveredBooking.is_own && (
              <div className="tooltip-badge own">Ваше бронирование</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
