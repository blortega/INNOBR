import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
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
  const [maxBookingsToShow, setMaxBookingsToShow] = useState(5);

  // States for reservation modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedReservation, setSelectedReservation] = useState(null);

  // States for facilities
  const [locations, setLocations] = useState([]);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [newFacility, setNewFacility] = useState({
    facility: "",
    employeeID: "",
  });
  const [facilityError, setFacilityError] = useState("");

  // States for edit/delete facility
  const [showEditFacilityModal, setShowEditFacilityModal] = useState(false);
  const [showDeleteFacilityModal, setShowDeleteFacilityModal] = useState(false);
  const [currentFacility, setCurrentFacility] = useState(null);
  const [facilityAuth, setFacilityAuth] = useState({
    employeeID: "",
    error: "",
  });

  // States for upcoming booking
  const [upcomingBookingsOpen, setUpcomingBookingsOpen] = useState(false);
  const [bookings, setBookings] = useState([]);

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
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "facilities"));
        // Extract the "facility" field from each document
        const facilities = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            facility: doc.data().facility,
          }))
          .sort((a, b) => a.facility.localeCompare(b.facility));
        setLocations(facilities);
      } catch (error) {
        console.error("Error fetching facilities:", error);
      }
    };
    fetchFacilities();
  }, []);

  const toggleBookings = async () => {
    const newState = !upcomingBookingsOpen;
    setUpcomingBookingsOpen(newState);

    if (newState) {
      const snapshot = await getDocs(collection(db, "reservations"));
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter out past reservations
      const now = new Date();
      const upcomingReservations = fetched.filter((booking) => {
        // Parse the date string (format: "2025-05-23")
        const [year, month, day] = booking.date.split("-").map(Number);

        // Parse the time string (format: "10:00")
        const [endHour, endMinute] = booking.timeEnd.split(":").map(Number);

        // Create date object for the end time of the reservation
        const reservationEndTime = new Date(
          year,
          month - 1,
          day,
          endHour,
          endMinute
        );

        // Only include reservations that haven't ended yet
        return reservationEndTime > now;
      });

      // Sort upcoming bookings by date and time
      const sortedBookings = upcomingReservations.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.timeStart}:00`);
        const dateB = new Date(`${b.date}T${b.timeStart}:00`);
        return dateA - dateB;
      });

      setBookings(sortedBookings);
    }
  };

  const handleEditFacility = (facility) => {
    setCurrentFacility(facility);
    setFacilityAuth({ employeeID: "", error: "" });
    setShowEditFacilityModal(true);
  };

  const handleEditFacilitySubmit = async (e) => {
    e.preventDefault();

    if (!facilityAuth.employeeID) {
      setFacilityAuth({ ...facilityAuth, error: "Employee ID is required" });
      return;
    }

    try {
      // Verify employee ID against admin collection
      const adminRef = collection(db, "admin");
      const q = query(
        adminRef,
        where("employeeID", "==", facilityAuth.employeeID)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setFacilityAuth({
          ...facilityAuth,
          error: "Invalid Employee ID. No matching admin found.",
        });
        return;
      }

      // Update the facility in Firestore
      await updateDoc(doc(db, "facilities", currentFacility.id), {
        facility: currentFacility.facility,
      });

      // Update local state
      setLocations(
        locations.map((f) =>
          f.id === currentFacility.id ? currentFacility : f
        )
      );

      // Close modal and reset
      setShowEditFacilityModal(false);
      setCurrentFacility(null);
      setFacilityAuth({ employeeID: "", error: "" });
    } catch (error) {
      console.error("Error updating facility:", error);
      setFacilityAuth({
        ...facilityAuth,
        error: "Error updating facility. Please try again.",
      });
    }
  };

  const handleDeleteFacility = (facility) => {
    setCurrentFacility(facility);
    setFacilityAuth({ employeeID: "", error: "" });
    setShowDeleteFacilityModal(true);
  };

  const handleDeleteFacilityConfirm = async () => {
    if (!facilityAuth.employeeID) {
      setFacilityAuth({ ...facilityAuth, error: "Employee ID is required" });
      return;
    }

    try {
      // Verify employee ID against admin collection
      const adminRef = collection(db, "admin");
      const q = query(
        adminRef,
        where("employeeID", "==", facilityAuth.employeeID)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setFacilityAuth({
          ...facilityAuth,
          error: "Invalid Employee ID. No matching admin found.",
        });
        return;
      }

      // Delete the facility from Firestore
      await deleteDoc(doc(db, "facilities", currentFacility.id));

      // Update local state
      setLocations(locations.filter((f) => f.id !== currentFacility.id));

      // Close modal and reset
      setShowDeleteFacilityModal(false);
      setCurrentFacility(null);
      setFacilityAuth({ employeeID: "", error: "" });
    } catch (error) {
      console.error("Error deleting facility:", error);
      setFacilityAuth({
        ...facilityAuth,
        error: "Error deleting facility. Please try again.",
      });
    }
  };

  const facilityColorMap = locations.reduce((map, facility) => {
    map[facility.id] = getFacilityColorByName(facility.facility);
    return map;
  }, {});

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
      [name]:
        name === "employeeID"
          ? value.toUpperCase()
          : name === "attendees"
          ? parseInt(value, 10) || 0
          : value,
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
          employeeID: formData.employeeID,
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
          employeeID: originalemployeeID,
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
                  employeeID: originalemployeeID,
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
      employeeID: "",
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
  const getFacilityColor = (facilityId) =>
    facilityColorMap[facilityId] || "#9E9E9E";
  function getFacilityColorByName(facility) {
    const colors = {
      "Activity Center A": "#4285F4",
      "Activity Room B": "#EA4335",
      "Conference Room 1": "#FBBC05",
      "Conference Room 2": "#34A853",
      "Conference Room 3": "#8E24AA",
      "Conference Room 4": "#FB8C00",
      "Conference Room 5": "#0097A7",
      "Conference Room 6": "#607D8B",
      "Test Facility": "#9E9E9E",
    };

    return colors[facility] || "#9E9E9E";
  }

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
                backgroundColor: getFacilityColorByName(reservation.facility),
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

  // Render facility modal
  const renderAddFacilityModal = () => {
    if (!showAddFacilityModal) return null;

    const handleFacilityInputChange = (e) => {
      const { name, value } = e.target;
      setNewFacility({
        ...newFacility,
        [name]: name === "employeeID" ? value.toUpperCase() : value,
      });
    };

    const handleAddFacilitySubmit = async (e) => {
      e.preventDefault();
      setFacilityError("");

      // Validate inputs
      if (!newFacility.facility.trim()) {
        setFacilityError("Facility name is required");
        return;
      }

      if (!newFacility.employeeID.trim()) {
        setFacilityError("Employee ID is required");
        return;
      }

      try {
        // Check if employee ID exists in admin collection
        const adminRef = collection(db, "admin");
        const q = query(
          adminRef,
          where("employeeID", "==", newFacility.employeeID)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setFacilityError("Invalid Employee ID. No matching admin found.");
          return;
        }

        // Create facility ID by removing spaces from facility name
        const facilityId = newFacility.facility.replace(/\s+/g, "");

        // Check if facility already exists
        const facilityDoc = await getDoc(doc(db, "facilities", facilityId));
        if (facilityDoc.exists()) {
          setFacilityError("A facility with this name already exists");
          return;
        }

        // Add new facility to Firestore
        await setDoc(doc(db, "facilities", facilityId), {
          facility: newFacility.facility,
        });

        // Refresh facilities list
        const querySnapshotFacilities = await getDocs(
          collection(db, "facilities")
        );
        const updatedFacilities = querySnapshotFacilities.docs
          .map((doc) => ({
            id: doc.id,
            facility: doc.data().facility,
          }))
          .sort((a, b) => a.facility.localeCompare(b.facility));

        setLocations(updatedFacilities);
        setShowAddFacilityModal(false);
        setNewFacility({ facility: "", employeeID: "" });
      } catch (error) {
        console.error("Error adding facility:", error);
        setFacilityError("Error adding facility. Please try again.");
      }
    };

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h2>Add Facility</h2>
            <button
              style={styles.closeButton}
              onClick={() => {
                setShowAddFacilityModal(false);
                setNewFacility({ facility: "", employeeID: "" });
                setFacilityError("");
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleAddFacilitySubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="facilityName" style={styles.label}>
                Facility Name
              </label>
              <input
                type="text"
                id="facilityName"
                name="facility"
                value={newFacility.facility}
                onChange={handleFacilityInputChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="facilityEmployeeID" style={styles.label}>
                Your Employee ID
                <span style={{ color: "red", marginLeft: "5px" }}>
                  (required for changes)
                </span>
              </label>
              <input
                type="text"
                id="facilityEmployeeID"
                name="employeeID"
                value={newFacility.employeeID}
                onChange={handleFacilityInputChange}
                style={styles.input}
                required
                placeholder="Must match admin collection"
              />
            </div>

            {facilityError && (
              <div style={{ color: "red", marginBottom: "15px" }}>
                {facilityError}
              </div>
            )}

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => {
                  setShowAddFacilityModal(false);
                  setNewFacility({ facility: "", employeeID: "" });
                  setFacilityError("");
                }}
              >
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                Add Facility
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render edit facility modal
  const renderEditFacilityModal = () => {
    if (!showEditFacilityModal || !currentFacility) return null;

    const handleAuthEmployeeIDChange = (e) => {
      setFacilityAuth({
        ...facilityAuth,
        employeeID: e.target.value.toUpperCase(),
        error: "",
      });
    };

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h2>Edit Facility</h2>
            <button
              style={styles.closeButton}
              onClick={() => {
                setShowEditFacilityModal(false);
                setCurrentFacility(null);
                setFacilityAuth({ employeeID: "", error: "" });
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleEditFacilitySubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="facilityName" style={styles.label}>
                Facility Name
              </label>
              <input
                type="text"
                id="facilityName"
                name="facility"
                value={currentFacility.facility}
                onChange={(e) =>
                  setCurrentFacility({
                    ...currentFacility,
                    facility: e.target.value,
                  })
                }
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="employeeID" style={styles.label}>
                Your Employee ID
                <span style={{ color: "red", marginLeft: "5px" }}>
                  (required for changes)
                </span>
              </label>
              <input
                type="text"
                id="employeeID"
                name="employeeID"
                value={facilityAuth.employeeID}
                onChange={handleAuthEmployeeIDChange}
                style={styles.input}
                required
                placeholder="Must match admin collection"
              />
            </div>

            {facilityAuth.error && (
              <div style={{ color: "red", marginBottom: "15px" }}>
                {facilityAuth.error}
              </div>
            )}

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => {
                  setShowEditFacilityModal(false);
                  setCurrentFacility(null);
                  setFacilityAuth({ employeeID: "", error: "" });
                }}
              >
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                Update Facility
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render delete facility modal
  const renderDeleteFacilityModal = () => {
    if (!showDeleteFacilityModal || !currentFacility) return null;

    const handleAuthEmployeeIDChange = (e) => {
      setFacilityAuth({
        ...facilityAuth,
        employeeID: e.target.value.toUpperCase(),
        error: "",
      });
    };

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h2>Delete Facility</h2>
            <button
              style={styles.closeButton}
              onClick={() => {
                setShowDeleteFacilityModal(false);
                setCurrentFacility(null);
                setFacilityAuth({ employeeID: "", error: "" });
              }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: "24px" }}>
            <p>
              Are you sure you want to delete the facility "
              {currentFacility.facility}"? This action cannot be undone.
            </p>

            <div style={styles.formGroup}>
              <label htmlFor="employeeID" style={styles.label}>
                Your Employee ID
                <span style={{ color: "red", marginLeft: "5px" }}>
                  (required for changes)
                </span>
              </label>
              <input
                type="text"
                id="employeeID"
                name="employeeID"
                value={facilityAuth.employeeID}
                onChange={handleAuthEmployeeIDChange}
                style={styles.input}
                required
                placeholder="Must match admin collection"
              />
            </div>
            {facilityAuth.error && (
              <div style={{ color: "red", marginBottom: "15px" }}>
                {facilityAuth.error}
              </div>
            )}
            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => {
                  setShowDeleteFacilityModal(false);
                  setCurrentFacility(null);
                  setFacilityAuth({ employeeID: "", error: "" });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.deleteButton}
                onClick={handleDeleteFacilityConfirm}
              >
                Delete Facility
              </button>
            </div>
          </div>
        </div>
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
                disabled={modalMode === "edit"}
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
                <option value="">Select a facility</option>
                {locations.map((facility) => (
                  <option key={facility.id} value={facility.facility}>
                    {facility.facility}
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
                  modalMode === "edit"
                    ? "Enter original employee ID"
                    : "Enter your employee ID"
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
          <div style={styles.bookingsHeader}>
            <h3 style={styles.filterTitle}>Upcoming Bookings</h3>
            <div style={styles.bookingsControls}>
              <input
                type="number"
                min="1"
                max="20"
                value={maxBookingsToShow}
                onChange={(e) =>
                  setMaxBookingsToShow(parseInt(e.target.value) || 5)
                }
                style={styles.limitInput}
                title="Max bookings to show"
              />
              <button
                onClick={toggleBookings}
                style={styles.upcomingBookingsButton}
              >
                {upcomingBookingsOpen ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {upcomingBookingsOpen && (
            <div style={styles.bookingsContainer}>
              {bookings.length === 0 ? (
                <div style={styles.noBookingsMessage}>
                  No upcoming bookings found.
                </div>
              ) : (
                bookings
                  .filter((booking) => {
                    if (facilityFilter === "all") return true;
                    return booking.facility === facilityFilter;
                  })
                  .slice(0, maxBookingsToShow)
                  .map((booking) => (
                    <div
                      key={booking.id}
                      style={{
                        ...styles.bookingItem,
                        backgroundColor: getFacilityColorByName(
                          booking.facility
                        ),
                      }}
                    >
                      <div style={styles.bookingTime}>
                        {booking.timeStart} - {booking.timeEnd}
                      </div>
                      <div style={styles.bookingTitle}>{booking.organizer}</div>
                      <div style={styles.bookingDetails}>
                        {booking.facility} • {booking.attendees} people
                      </div>
                      <div style={styles.bookingDate}>{booking.date}</div>
                    </div>
                  ))
              )}
              {bookings.length > maxBookingsToShow && (
                <div style={styles.moreBookingsIndicator}>
                  +{bookings.length - maxBookingsToShow} more bookings
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.legendSection}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={styles.legendTitle}>Facilities</h3>
            <button
              onClick={() => setShowAddFacilityModal(true)}
              style={styles.addButton}
              title="Add new facility"
            >
              <span style={{ fontSize: "18px" }}>+</span>
            </button>
          </div>
          <div style={styles.legend}>
            {locations.map((facility) => (
              <div
                key={facility.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={styles.legendItem}>
                  <div
                    style={{
                      ...styles.legendColor,
                      backgroundColor: getFacilityColorByName(
                        facility.facility
                      ),
                    }}
                  ></div>
                  <span style={styles.legendText}>{facility.facility}</span>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    style={{ ...styles.actionButton, fontSize: "14px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditFacility(facility);
                    }}
                    title="Edit facility"
                  >
                    ✏️
                  </button>
                  <button
                    style={{ ...styles.actionButton, fontSize: "14px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFacility(facility);
                    }}
                    title="Delete facility"
                  >
                    🗑️
                  </button>
                </div>
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
      {renderAddFacilityModal()}
      {renderEditFacilityModal()}
      {renderDeleteFacilityModal()}
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    fontFamily: "Roboto, Arial, sans-serif",
    color: "#333",
    overflow: "hidden",
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
    minWidth: 0,
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
  addButton: {
    background: "#4285F4",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "10px",
  },
  cancelButton: {
    padding: "8px 16px",
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "10px",
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
  facilityItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  facilityActions: {
    display: "flex",
    gap: "4px",
  },
  actionButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px",
    fontSize: "14px",
    color: "#5f6368",
    "&:hover": {
      color: "#1a73e8",
    },
  },
  bookingsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  bookingsControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  limitInput: {
    width: "50px",
    padding: "4px 6px",
    borderRadius: "4px",
    border: "1px solid #dadce0",
    fontSize: "12px",
    textAlign: "center",
  },
  upcomingBookingsButton: {
    backgroundColor: "#1a73e8",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
  },
  bookingsContainer: {
    maxHeight: "300px", // Prevents pushing down Facilities section
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  },
  bookingItem: {
    borderRadius: "4px",
    padding: "8px",
    color: "white",
    fontSize: "12px",
    cursor: "pointer",
    transition: "opacity 0.2s ease",
  },
  bookingTime: {
    fontWeight: "600",
    fontSize: "11px",
    marginBottom: "2px",
  },
  bookingTitle: {
    fontWeight: "500",
    fontSize: "12px",
    marginBottom: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  bookingDetails: {
    fontSize: "10px",
    opacity: "0.9",
    marginBottom: "2px",
  },
  bookingDate: {
    fontSize: "10px",
    opacity: "0.8",
  },
  noBookingsMessage: {
    textAlign: "center",
    color: "#70757a",
    fontSize: "12px",
    padding: "16px 8px",
    fontStyle: "italic",
  },
  moreBookingsIndicator: {
    textAlign: "center",
    color: "#70757a",
    fontSize: "11px",
    padding: "4px",
    fontStyle: "italic",
  },
};

export default App;
