import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

const App = () => {
  // State variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // 'month', 'week', or 'day'
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingFormData, setBookingFormData] = useState({
    title: "",
    room: "",
    startTime: "",
    endTime: "",
    organizer: "",
    attendees: "",
    description: "",
  });

  // Room data
  const rooms = [
    {
      id: "ac",
      name: "Activity Center - Main Hall",
      capacity: 100,
      color: "#9575cd",
    },
    {
      id: "as",
      name: "Activity Center - Studio",
      capacity: 30,
      color: "#ff8a65",
    },
    { id: "c1", name: "Conference Room 1", capacity: 20, color: "#4fc3f7" },
    { id: "c2", name: "Conference Room 2", capacity: 15, color: "#4db6ac" },
    { id: "c3", name: "Conference Room 3", capacity: 10, color: "#aed581" },
    { id: "c4", name: "Conference Room 4", capacity: 8, color: "#fff176" },
    { id: "c5", name: "Conference Room 5", capacity: 6, color: "#ffb74d" },
    { id: "c6", name: "Conference Room 6", capacity: 4, color: "#f06292" },
  ];

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();

    // Days from previous month to fill the first row
    const prevMonthDays = [];
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDate = prevMonth.getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push({
        date: prevMonthLastDate - i,
        month: "prev",
        fullDate: new Date(year, month - 1, prevMonthLastDate - i),
      });
    }

    // Days of the current month
    const currentMonthDays = [];
    for (let i = 1; i <= lastDate; i++) {
      currentMonthDays.push({
        date: i,
        month: "current",
        fullDate: new Date(year, month, i),
      });
    }

    // Days from next month to fill the last row
    const nextMonthDays = [];
    const daysNeeded = 42 - (prevMonthDays.length + currentMonthDays.length); // 6 rows * 7 days = 42

    for (let i = 1; i <= daysNeeded; i++) {
      nextMonthDays.push({
        date: i,
        month: "next",
        fullDate: new Date(year, month + 1, i),
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Handle month navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Format date for display
  const formatMonth = (date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Handle day selection
  const handleDayClick = (day) => {
    setSelectedDay(day);
    // Could add logic here to show bookings for the selected day
  };

  // Toggle booking form
  const toggleBookingForm = () => {
    setShowBookingForm(!showBookingForm);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingFormData({
      ...bookingFormData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Create new booking
    const newBooking = {
      id: Date.now().toString(),
      ...bookingFormData,
      date: selectedDay ? selectedDay.fullDate : new Date(),
    };

    // Add to bookings state
    setBookings([...bookings, newBooking]);

    // Reset form and close
    setBookingFormData({
      title: "",
      room: "",
      startTime: "",
      endTime: "",
      organizer: "",
      attendees: "",
      description: "",
    });
    setShowBookingForm(false);
  };

  // Get bookings for a specific day
  const getBookingsForDay = (day) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return (
        bookingDate.getDate() === day.date &&
        bookingDate.getMonth() === day.fullDate.getMonth() &&
        bookingDate.getFullYear() === day.fullDate.getFullYear()
      );
    });
  };

  // Generate calendar
  const calendarDays = generateCalendarDays();

  return (
    <div className="booking-calendar">
      <div className="booking-header">
        <h1>Booking Calendar</h1>
        <h2>Activity Center & Conference Rooms</h2>
        <button className="new-booking-btn" onClick={toggleBookingForm}>
          + New Booking
        </button>
      </div>

      <div className="calendar-navigation">
        <button onClick={() => navigateMonth(-1)}>&lt;</button>
        <h2>{formatMonth(currentDate)}</h2>
        <button onClick={() => navigateMonth(1)}>&gt;</button>

        <div className="view-options">
          <button
            className={view === "month" ? "active" : ""}
            onClick={() => setView("month")}
          >
            Month
          </button>
          <button
            className={view === "week" ? "active" : ""}
            onClick={() => setView("week")}
          >
            Week
          </button>
          <button
            className={view === "day" ? "active" : ""}
            onClick={() => setView("day")}
          >
            Day
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-header">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="calendar-body">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${day.month} ${
                selectedDay &&
                day.date === selectedDay.date &&
                day.month === selectedDay.month
                  ? "selected"
                  : ""
              }`}
              onClick={() => handleDayClick(day)}
            >
              <div className="day-number">{day.date}</div>
              <div className="day-events">
                {getBookingsForDay(day).map((booking) => (
                  <div
                    key={booking.id}
                    className="booking-item"
                    style={{
                      backgroundColor:
                        rooms.find((r) => r.id === booking.room)?.color ||
                        "#4285f4",
                    }}
                  >
                    {booking.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rooms-section">
        <h2>Rooms & Spaces</h2>
        <div className="rooms-grid">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="room-card"
              style={{ borderLeft: `4px solid ${room.color}` }}
            >
              <h3>{room.name}</h3>
              <p>Capacity: {room.capacity}</p>
            </div>
          ))}
        </div>
      </div>

      {showBookingForm && (
        <div className="booking-form-overlay">
          <div className="booking-form">
            <div className="form-header">
              <h2>Book Room</h2>
              <button className="close-btn" onClick={toggleBookingForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter booking title"
                  value={bookingFormData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Room/Space</label>
                <select
                  name="room"
                  value={bookingFormData.room}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={bookingFormData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={bookingFormData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Organizer</label>
                <input
                  type="text"
                  name="organizer"
                  placeholder="Your name"
                  value={bookingFormData.organizer}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Number of Attendees</label>
                <input
                  type="number"
                  name="attendees"
                  placeholder="Expected attendees"
                  value={bookingFormData.attendees}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Brief description of the event"
                  value={bookingFormData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Book Room
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={toggleBookingForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
