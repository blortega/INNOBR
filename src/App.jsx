import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Calendar, Users, Clock, MapPin } from 'lucide-react';

const App = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    startTime: '',
    endTime: '',
    attendees: '',
    organizer: ''
  });

  const locations = [
    'Activity Center 1',
    'Activity Center 2',
    'Conference Room 1',
    'Conference Room 2',
    'Conference Room 3',
    'Conference Room 4',
    'Conference Room 5',
    'Conference Room 6'
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get days in month
  const getDaysInMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    
    return days;
  };

  // Navigation functions
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Event management
  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    openModal();
  };

  const openModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        attendees: event.attendees,
        organizer: event.organizer
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        location: locations[0],
        startTime: '',
        endTime: '',
        attendees: '',
        organizer: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.startTime || !formData.endTime) return;

    const newEvent = {
      id: editingEvent ? editingEvent.id : Date.now().toString(),
      date: selectedDate.toDateString(),
      ...formData
    };

    if (editingEvent) {
      setEvents(events.map(event => event.id === editingEvent.id ? newEvent : event));
    } else {
      setEvents([...events, newEvent]);
    }
    
    closeModal();
  };

  const deleteEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => event.date === date.toDateString());
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getLocationColor = (location) => {
    const colors = {
      'Activity Center 1': '#1a73e8',
      'Activity Center 2': '#137333',
      'Conference Room 1': '#9334e6',
      'Conference Room 2': '#ea8600',
      'Conference Room 3': '#d93025',
      'Conference Room 4': '#0d9488',
      'Conference Room 5': '#c2185b',
      'Conference Room 6': '#5f6368'
    };
    return colors[location] || '#5f6368';
  };

  const days = getDaysInMonth(currentDate);

  return (
     <div style={{ 
      height: '100vh', // Changed from minHeight to height
      width: '100vw', // Ensure full viewport width
      backgroundColor: '#ffffff', 
      fontFamily: 'Google Sans, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Prevent double scrollbars
    }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid #dadce0', 
        padding: '8px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        minHeight: '64px',
        flexShrink: 0, 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={goToToday}
              style={{ 
                padding: '10px 24px', 
                border: '1px solid #dadce0', 
                borderRadius: '4px', 
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#3c4043',
                transition: 'box-shadow 0.2s, background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.boxShadow = 'none';
              }}
            >
              Today
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={previousMonth}
                style={{ 
                  padding: '8px', 
                  border: 'none',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f3f4'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <ChevronLeft size={18} color="#5f6368" />
              </button>
              <button
                onClick={nextMonth}
                style={{ 
                  padding: '8px', 
                  border: 'none',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f3f4'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <ChevronRight size={18} color="#5f6368" />
              </button>
            </div>
            <h1 style={{ 
              fontSize: '22px', 
              fontWeight: '400', 
              color: '#3c4043', 
              margin: 0,
              lineHeight: '28px'
            }}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1a73e8',
            color: '#ffffff',
            padding: '10px 24px',
            borderRadius: '24px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1557b0';
            e.target.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1a73e8';
            e.target.style.boxShadow = 'none';
          }}
        >
          <Plus size={16} />
          <span>Create</span>
        </button>
      </header>

      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        width: '100%' 
      }}>
        {/* Sidebar */}
         <div style={{ 
          width: '280px', 
          minWidth: '280px', // Prevent sidebar from shrinking
          borderRight: '1px solid #dadce0', 
          padding: '20px 16px',
          backgroundColor: '#ffffff',
          overflowY: 'auto',
          height: '100%' // Take full available height
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#3c4043', 
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '2px', 
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              {weekdaysShort.map(day => (
                <div key={day} style={{ 
                  padding: '8px 0', 
                  textAlign: 'center',
                  color: '#5f6368',
                  fontWeight: '500'
                }}>
                  {day.charAt(0)}
                </div>
              ))}
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '2px'
            }}>
              {days.map((day, index) => {
                const isToday = day && day.toDateString() === new Date().toDateString();
                const isSelected = day && day.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => day && setSelectedDate(day)}
                    style={{
                      padding: '8px 0',
                      fontSize: '13px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: day ? 'pointer' : 'default',
                      backgroundColor: isSelected && !isToday
                        ? '#1a73e8'
                        : isToday
                        ? '#1a73e8'
                        : 'transparent',
                      color: isSelected || isToday
                        ? '#ffffff'
                        : day 
                        ? '#3c4043' 
                        : '#dadce0',
                      transition: 'background-color 0.2s',
                      fontWeight: isToday ? '500' : '400',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (day && !isSelected && !isToday) {
                        e.target.style.backgroundColor = '#f1f3f4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (day && !isSelected && !isToday) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {day ? day.getDate() : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#3c4043', 
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              My calendars
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {locations.map(location => (
                <div key={location} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  fontSize: '14px',
                  padding: '4px 0'
                }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: getLocationColor(location),
                    flexShrink: 0
                  }}></div>
                  <span style={{ 
                    color: '#3c4043',
                    fontSize: '14px',
                    lineHeight: '20px'
                  }}>
                    {location}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Calendar */}
        <div style={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          overflow: 'auto', // Allow scrolling only for calendar
          minWidth: 0 // Fix flexbox overflow issue
        }}>
          {/* Calendar Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #dadce0',
            backgroundColor: '#ffffff',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            flexShrink: 0
          }}>
            {weekdays.map(day => (
              <div key={day} style={{
                padding: '12px 8px',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '500',
                color: '#70757a',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                borderRight: day !== 'Saturday' ? '1px solid #dadce0' : 'none'
              }}>
                {day.substring(0, 3)}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', // Equal width columns
            gridAutoRows: '1fr', // Equal height rows
            flex: 1,
            backgroundColor: '#ffffff',
            minHeight: '600px' // Ensure minimum height
          }}>
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isToday = day && day.toDateString() === new Date().toDateString();
              const isSelected = day && day.toDateString() === selectedDate.toDateString();
              const isWeekend = day && (day.getDay() === 0 || day.getDay() === 6);
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  style={{
                    minHeight: '120px',
                    padding: '8px',
                    cursor: day ? 'pointer' : 'default',
                    border: '1px solid #dadce0',
                    borderTop: 'none',
                    borderLeft: index % 7 === 0 ? '1px solid #dadce0' : 'none',
                    backgroundColor: '#ffffff',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative' // For absolute positioning of content
                  }}
                  onMouseEnter={(e) => {
                    if (day) e.target.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    if (day) e.target.style.backgroundColor = '#ffffff';
                  }}
                >
                  {day && (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontSize: '26px',
                          color: isToday ? '#1a73e8' : '#3c4043',
                          fontWeight: isToday ? '500' : '400',
                          lineHeight: '32px'
                        }}>
                          {day.getDate()}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '2px',
                        flex: 1
                      }}>
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(event);
                            }}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              backgroundColor: getLocationColor(event.location),
                              color: '#ffffff',
                              transition: 'opacity 0.2s',
                              border: `1px solid ${getLocationColor(event.location)}`,
                              marginBottom: '1px'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <div style={{ 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              fontWeight: '500'
                            }}>
                              {formatTime(event.startTime)} {event.title}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#5f6368',
                            padding: '2px 8px',
                            cursor: 'pointer'
                          }}>
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12), 0 5px 5px -3px rgba(0,0,0,.2)',
            width: '540px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '24px' 
              }}>
                <h2 style={{ 
                  fontSize: '22px', 
                  fontWeight: '400', 
                  color: '#3c4043', 
                  margin: 0 
                }}>
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h2>
                {editingEvent && (
                  <button
                    onClick={() => {
                      deleteEvent(editingEvent.id);
                      closeModal();
                    }}
                    style={{
                      padding: '8px',
                      color: '#ea4335',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fce8e6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#3c4043', 
                    marginBottom: '8px' 
                  }}>
                    Add title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                    onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    placeholder="Add title"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#3c4043', 
                    marginBottom: '8px',
                    gap: '8px'
                  }}>
                    <MapPin size={16} />
                    Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                    onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                  >
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#3c4043', 
                      marginBottom: '8px',
                      gap: '8px'
                    }}>
                      <Clock size={16} />
                      Start time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                      onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#3c4043', 
                      marginBottom: '8px' 
                    }}>
                      End time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                      onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#3c4043', 
                    marginBottom: '8px',
                    gap: '8px'
                  }}>
                    <Users size={16} />
                    Number of attendees
                  </label>
                  <input
                    type="number"
                    value={formData.attendees}
                    onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                    onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#3c4043', 
                    marginBottom: '8px' 
                  }}>
                    Organizer name
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                    onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                    placeholder="Your name"
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  paddingTop: '16px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      padding: '10px 24px',
                      border: '1px solid #dadce0',
                      color: '#1a73e8',
                      backgroundColor: '#ffffff',
                      borderRadius: '4px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.2s, box-shadow 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f8f9fa';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    style={{
                      backgroundColor: '#1a73e8',
                      color: '#ffffff',
                      padding: '10px 24px',
                      borderRadius: '4px',
                      border: 'none',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.2s, box-shadow 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#1557b0';
                      e.target.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#1a73e8';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {editingEvent ? 'Save' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;