import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

function App() {
  // States for calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [originalemployeeID, setOriginalemployeeID] = useState("");

  // States for reservation modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    date: "",
    timeStart: "09:00",
    timeEnd: "10:00",
    attendees: 1,
    organizer: "",
    facility: "Activity Center A",
    employeeID: "",
  });

  // Filter state
  const [facilityFilter, setFacilityFilter] = useState("all");

  // List of available facilities
  const facilities = [
    "Activity Center A",
    "Activity Center B",
    "Conference Room 1",
    "Conference Room 2",
    "Conference Room 3",
    "Conference Room 4",
    "Conference Room 5",
    "Conference Room 6",
  ];

  // Initialize and fetch data
  useEffect(() => {
    generateCalendarDays(currentDate);
    fetchReservations();
  }, [currentDate]);

  // Generate calendar days for the current month view
  const generateCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of the week (0-6, 0 is Sunday)
    const startingDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Calendar rows need 42 blocks (6 rows x 7 days) for consistency
    const calendarCells = [];

    // Previous month's days to fill the first row
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      calendarCells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        currentMonth: false,
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      calendarCells.push({
        date: new Date(year, month, i),
        currentMonth: true,
      });
    }

    // Next month's days to fill the remaining cells
    const remainingCells = 42 - calendarCells.length;
    for (let i = 1; i <= remainingCells; i++) {
      calendarCells.push({
        date: new Date(year, month + 1, i),
        currentMonth: false,
      });
    }

    setCalendarDays(calendarCells);
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fetch all reservations from Firestore
  const fetchReservations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "reservations"));
      const reservationData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().date),
      }));
      setReservations(reservationData);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  // Handle day click to create a new reservation
  const handleDayClick = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cannot book past dates
    if (day.date < today) {
      alert("Cannot book dates in the past");
      return;
    }

    setSelectedDate(day.date);

    setFormData({
      ...formData,
      date: formatDate(day.date),
    });

    setModalMode("create");
    setShowModal(true);
  };

  // Handle reservation click to edit or view details
  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setOriginalemployeeID(reservation.employeeID || "");
    setFormData({
      date: formatDate(reservation.date),
      timeStart: reservation.timeStart,
      timeEnd: reservation.timeEnd,
      attendees: reservation.attendees,
      organizer: reservation.organizer,
      facility: reservation.facility,
      employeeID: "",
    });
    setModalMode("edit");
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "attendees" ? parseInt(value, 10) || 0 : value,
    });
  };

  // Check if time is available for booking
  const isTimeSlotAvailable = async () => {
    const { date, timeStart, timeEnd, facility } = formData;

    // If editing, exclude the current reservation
    const reservationsToCheck = reservations.filter((res) => {
      if (modalMode === "edit" && selectedReservation) {
        return res.id !== selectedReservation.id;
      }
      return true;
    });

    // Check for conflicts
    const conflicts = reservationsToCheck.filter((res) => {
      const sameDate = formatDate(res.date) === date;
      const sameFacility = res.facility === facility;

      if (!sameDate || !sameFacility) return false;

      const startA = timeStart;
      const endA = timeEnd;
      const startB = res.timeStart;
      const endB = res.timeEnd;

      // Check if time ranges overlap
      return startA < endB && endA > startB;
    });

    return conflicts.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // For edits, require employee ID to match original
    if (modalMode === "edit") {
      if (formData.employeeID !== originalemployeeID) {
        alert("Employee ID does not match the original reservation");
        return;
      }
    }

    // Validate time format
    const timeStartParts = formData.timeStart.split(":");
    const timeEndParts = formData.timeEnd.split(":");
    const startTime = new Date();
    startTime.setHours(
      parseInt(timeStartParts[0], 10),
      parseInt(timeStartParts[1], 10)
    );
    const endTime = new Date();
    endTime.setHours(
      parseInt(timeEndParts[0], 10),
      parseInt(timeEndParts[1], 10)
    );

    if (endTime <= startTime) {
      alert("End time must be after start time");
      return;
    }

    // Check for conflicts
    const isAvailable = await isTimeSlotAvailable();
    if (!isAvailable) {
      alert("This time slot is already booked for the selected facility");
      return;
    }

    try {
      if (modalMode === "create") {
        // Add new reservation with employee ID
        const docRef = await addDoc(collection(db, "reservations"), {
          ...formData,
          date: formData.date,
          attendees: parseInt(formData.attendees, 10) || 1,
          employeeID: formData.employeeID, // Include employee ID
        });

        // Update local state
        setReservations([
          ...reservations,
          {
            id: docRef.id,
            ...formData,
            date: new Date(formData.date),
            attendees: parseInt(formData.attendees, 10) || 1,
          },
        ]);
      } else if (modalMode === "edit" && selectedReservation) {
        // Update existing reservation
        await updateDoc(doc(db, "reservations", selectedReservation.id), {
          ...formData,
          date: formData.date,
          attendees: parseInt(formData.attendees, 10) || 1,
          employeeID: originalemployeeID, // Keep original employee ID
        });

        // Update local state
        setReservations(
          reservations.map((res) =>
            res.id === selectedReservation.id
              ? {
                  ...res,
                  ...formData,
                  date: new Date(formData.date),
                  attendees: parseInt(formData.attendees, 10) || 1,
                  employeeID: originalemployeeID, // Keep original
                }
              : res
          )
        );
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving reservation:", error);
      alert("Error saving reservation. Please try again.");
    }
  };

  // Handle reservation deletion
  const handleDelete = async () => {
    if (!selectedReservation) return;

    // Require employee ID to match before deletion
    if (formData.employeeID !== originalemployeeID) {
      alert("Employee ID does not match the original reservation");
      return;
    }

    if (window.confirm("Are you sure you want to delete this reservation?")) {
      try {
        await deleteDoc(doc(db, "reservations", selectedReservation.id));

        // Update local state
        setReservations(
          reservations.filter((res) => res.id !== selectedReservation.id)
        );

        setShowModal(false);
        resetForm();
      } catch (error) {
        console.error("Error deleting reservation:", error);
        alert("Error deleting reservation. Please try again.");
      }
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      date: selectedDate ? formatDate(selectedDate) : "",
      timeStart: "09:00",
      timeEnd: "10:00",
      attendees: 1,
      organizer: "",
      facility: "Activity Center A",
    });
    setSelectedReservation(null);
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a date has reservations
  const getDateReservations = (date) => {
    const dateStr = formatDate(date);
    return reservations.filter((res) => formatDate(res.date) === dateStr);
  };

  // Filter reservations by facility
  const getFilteredReservations = (date) => {
    const dateReservations = getDateReservations(date);

    if (facilityFilter === "all") {
      return dateReservations;
    }

    return dateReservations.filter((res) => res.facility === facilityFilter);
  };

  // Get color based on facility for visual differentiation
  const getFacilityColor = (facility) => {
    const colors = {
      "Activity Center A": "#4285F4", // Google blue
      "Activity Center B": "#EA4335", // Google red
      "Conference Room 1": "#FBBC05", // Google yellow
      "Conference Room 2": "#34A853", // Google green
      "Conference Room 3": "#8E24AA", // Purple
      "Conference Room 4": "#FB8C00", // Orange
      "Conference Room 5": "#0097A7", // Cyan
      "Conference Room 6": "#607D8B", // Blue grey
    };

    return colors[facility] || "#9E9E9E"; // Default gray
  };

  // Render a single calendar day
  const renderDay = (day) => {
    const isToday = formatDate(new Date()) === formatDate(day.date);
    const isSelected =
      selectedDate && formatDate(selectedDate) === formatDate(day.date);
    const dayReservations = getFilteredReservations(day.date);

    return (
      <div
        key={day.date.toString()}
        className="calendar-day"
        style={{
          ...styles.calendarDay,
          opacity: day.currentMonth ? 1 : 0.3,
          background: isToday ? "#f5f5f5" : isSelected ? "#e3f2fd" : "white",
          cursor: day.date < new Date() && !isToday ? "not-allowed" : "pointer",
        }}
        onClick={() => handleDayClick(day)}
      >
        <div style={styles.dayHeader}>
          <span style={isToday ? styles.todayCircle : null}>
            {day.date.getDate()}
          </span>
        </div>
        <div style={styles.dayContent}>
          {dayReservations.map((reservation) => (
            <div
              key={reservation.id}
              style={{
                ...styles.reservation,
                backgroundColor: getFacilityColor(reservation.facility),
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleReservationClick(reservation);
              }}
            >
              <div style={styles.reservationTime}>
                {reservation.timeStart} - {reservation.timeEnd}
              </div>
              <div style={styles.reservationTitle}>{reservation.facility}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render the calendar header with weekday names
  const renderCalendarHeader = () => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div style={styles.calendarHeader}>
        {weekdays.map((day) => (
          <div key={day} style={styles.weekdayHeader}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  // Render the reservation form modal
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h2>
              {modalMode === "create"
                ? "Create Reservation"
                : "Edit Reservation"}
            </h2>
            <button
              style={styles.closeButton}
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="date" style={styles.label}>
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={modalMode === "edit"} // Can't change date when editing
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="timeStart" style={styles.label}>
                  Start Time
                </label>
                <input
                  type="time"
                  id="timeStart"
                  name="timeStart"
                  value={formData.timeStart}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="timeEnd" style={styles.label}>
                  End Time
                </label>
                <input
                  type="time"
                  id="timeEnd"
                  name="timeEnd"
                  value={formData.timeEnd}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="facility" style={styles.label}>
                Facility
              </label>
              <select
                id="facility"
                name="facility"
                value={formData.facility}
                onChange={handleInputChange}
                style={styles.select}
                required
              >
                {facilities.map((facility) => (
                  <option key={facility} value={facility}>
                    {facility}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="attendees" style={styles.label}>
                  Number of Attendees
                </label>
                <input
                  type="number"
                  id="attendees"
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleInputChange}
                  style={styles.input}
                  min="1"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="organizer" style={styles.label}>
                  Organizer Name
                </label>
                <input
                  type="text"
                  id="organizer"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="employeeID" style={styles.label}>
                Employee ID
                {modalMode === "edit" && (
                  <span style={{ color: "red", marginLeft: "5px" }}>
                    (required for changes)
                  </span>
                )}
              </label>
              <input
                type="text"
                id="employeeID"
                name="employeeID"
                value={formData.employeeID}
                onChange={handleInputChange}
                style={styles.input}
                required={modalMode === "create"}
                placeholder={
                  modalMode === "edit" ? "Enter original Employee ID" : ""
                }
              />
            </div>

            <div style={styles.formActions}>
              {modalMode === "edit" && (
                <button
                  type="button"
                  style={styles.deleteButton}
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
              <button type="submit" style={styles.submitButton}>
                {modalMode === "create" ? "Create" : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <h1 style={styles.title}>Reservation System</h1>
        </div>

        <div style={styles.navigation}>
          <button style={styles.todayButton} onClick={goToToday}>
            Today
          </button>
          <div style={styles.monthNavigation}>
            <button style={styles.navButton} onClick={prevMonth}>
              &lt;
            </button>
            <h2 style={styles.currentMonth}>
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button style={styles.navButton} onClick={nextMonth}>
              &gt;
            </button>
          </div>
        </div>

        <div style={styles.filterSection}>
          <h3 style={styles.filterTitle}>Filter by Facility</h3>
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Facilities</option>
            {facilities.map((facility) => (
              <option key={facility} value={facility}>
                {facility}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.legendSection}>
          <h3 style={styles.legendTitle}>Facilities</h3>
          <div style={styles.legend}>
            {facilities.map((facility) => (
              <div key={facility} style={styles.legendItem}>
                <div
                  style={{
                    ...styles.legendColor,
                    backgroundColor: getFacilityColor(facility),
                  }}
                ></div>
                <span style={styles.legendText}>{facility}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.calendarContainer}>
        {renderCalendarHeader()}
        <div style={styles.calendarGrid}>
          {calendarDays.map((day) => renderDay(day))}
        </div>
      </div>

      {renderModal()}
    </div>
  );
}

// Styles using React inline styling (CSS-in-JS)
const styles = {
  app: {
    display: "flex",
    height: "100vh",
    width: "100vw", // Add this to ensure full width
    fontFamily: "Roboto, Arial, sans-serif",
    color: "#333",
    overflow: "hidden", // Prevent scrolling on the main container
  },
  sidebar: {
    width: "280px",
    borderRight: "1px solid #e0e0e0",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
  },
  logo: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "500",
    color: "#5f6368",
    margin: "0",
  },
  navigation: {
    marginBottom: "24px",
  },
  todayButton: {
    backgroundColor: "#1a73e8",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "16px",
    width: "100%",
  },
  monthNavigation: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#5f6368",
    padding: "8px",
    borderRadius: "50%",
  },
  currentMonth: {
    margin: "0",
    fontSize: "18px",
    fontWeight: "500",
    color: "#3c4043",
  },
  filterSection: {
    marginBottom: "24px",
  },
  filterTitle: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#3c4043",
    marginBottom: "8px",
  },
  filterSelect: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #dadce0",
    fontSize: "14px",
  },
  legendSection: {
    marginTop: "auto",
  },
  legendTitle: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#3c4043",
    marginBottom: "8px",
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  legendColor: {
    width: "12px",
    height: "12px",
    borderRadius: "2px",
  },
  legendText: {
    fontSize: "14px",
    color: "#5f6368",
  },
  calendarContainer: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    overflow: "auto",
    minWidth: 0, // Add this to prevent flex overflow issues
  },
  calendarHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    borderBottom: "1px solid #e0e0e0",
  },
  weekdayHeader: {
    padding: "12px 0",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "500",
    color: "#70757a",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gridAutoRows: "minmax(120px, 1fr)",
    flex: "1",
  },
  calendarDay: {
    border: "1px solid #e0e0e0",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: "120px",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "4px",
    fontSize: "14px",
    color: "#70757a",
  },
  todayCircle: {
    backgroundColor: "#1a73e8",
    color: "white",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "500",
  },
  dayContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    overflow: "auto",
    flex: "1",
    minHeight: 0,
  },
  reservation: {
    borderRadius: "4px",
    padding: "4px 6px",
    fontSize: "12px",
    color: "white",
    cursor: "pointer",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  reservationTime: {
    fontWeight: "500",
    marginBottom: "2px",
  },
  reservationTitle: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  modalOverlay: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "1000",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "500px",
    maxWidth: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  modalHeader: {
    padding: "16px 24px",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#5f6368",
  },
  form: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "16px",
    width: "100%",
  },
  formRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#3c4043",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #dadce0",
    fontSize: "14px",
  },
  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #dadce0",
    fontSize: "14px",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
  submitButton: {
    backgroundColor: "#1a73e8",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  deleteButton: {
    backgroundColor: "#ea4335",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
};

export default App;
