"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Paper,
  Typography,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  useTheme,
  alpha,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  CalendarViewDay,
  CalendarViewWeek,
  CalendarViewMonth,
  Event,
  Edit,
  Delete,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { addEvent, getUserEvents, deleteEvent, updateEvent, FirestoreEvent } from "@/app/lib/firestore";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
  priority: "normal" | "important" | "critical";
  backgroundColor?: string;
  borderColor?: string;
}

const priorityColors = {
  normal: { bg: "#10b981", border: "#059669" },
  important: { bg: "#f59e0b", border: "#d97706" },
  critical: { bg: "#ef4444", border: "#dc2626" },
};

const priorityLabels = {
  normal: "Звичайна",
  important: "Важлива",
  critical: "Критична",
};

export default function CalendarComponent() {
  const { user } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [calendarView, setCalendarView] = useState("dayGridMonth");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedEventForAction, setSelectedEventForAction] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState<{
    title: string;
    description: string;
    priority: "normal" | "important" | "critical";
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }>({
    title: "",
    description: "",
    priority: "normal",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  const theme = useTheme();

  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userEvents = await getUserEvents(user.uid);
        const formattedEvents = userEvents.map((event: FirestoreEvent) => ({
          ...event,
          backgroundColor: priorityColors[event.priority]?.bg || priorityColors.normal.bg,
          borderColor: priorityColors[event.priority]?.border || priorityColors.normal.border,
        }));
        setEvents(formattedEvents);
        setError("");
      } catch (err) {
        setError("Помилка завантаження подій");
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user]);

  const handleDateSelect = (selectInfo: { start: Date }) => {
    setEventForm({
      ...eventForm,
      startDate: format(selectInfo.start, "yyyy-MM-dd"),
      startTime: "09:00",
      endDate: format(selectInfo.start, "yyyy-MM-dd"),
      endTime: "10:00",
    });
    setDialogOpen(true);
  };

  const handleEventClick = async (clickInfo: { event: { id: string; title: string } }) => {
    if (!user) return;
    
    const eventId = clickInfo.event.id;
    const eventToEdit = events.find(e => e.id === eventId);
    
    if (eventToEdit) {
      setSelectedEventForAction(eventToEdit);
      setActionDialogOpen(true);
    }
  };

  const handleEditAction = () => {
    if (selectedEventForAction) {
      setEditingEvent(selectedEventForAction);
      setEventForm({
        title: selectedEventForAction.title,
        description: selectedEventForAction.description || "",
        priority: selectedEventForAction.priority,
        startDate: selectedEventForAction.start.split('T')[0],
        startTime: selectedEventForAction.start.split('T')[1]?.substring(0, 5) || "09:00",
        endDate: selectedEventForAction.end?.split('T')[0] || selectedEventForAction.start.split('T')[0],
        endTime: selectedEventForAction.end?.split('T')[1]?.substring(0, 5) || "10:00",
      });
      setActionDialogOpen(false);
      setDialogOpen(true);
    }
  };

  const handleDeleteAction = async () => {
    if (selectedEventForAction && user) {
      try {
        await deleteEvent(user.uid, selectedEventForAction.id);
        setEvents(events.filter(e => e.id !== selectedEventForAction.id));
        setActionDialogOpen(false);
        setSelectedEventForAction(null);
      } catch (error) {
        setError("Помилка видалення події");
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleActionDialogClose = () => {
    setActionDialogOpen(false);
    setSelectedEventForAction(null);
  };

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: string) => {
    if (newView !== null) {
      setCalendarView(newView);
      if (calendarRef.current) {
        calendarRef.current.getApi().changeView(newView);
      }
    }
  };

  const handleCreateEvent = async () => {
    if (!user) return;
    
    const { title, description, priority, startDate, startTime, endDate, endTime } = eventForm;
    
    if (!title || !startDate || !startTime) return;

    try {
      const startDateTime = `${startDate}T${startTime}:00`;
      const endDateTime = endDate && endTime ? `${endDate}T${endTime}:00` : undefined;

      const eventData = {
        title,
        start: startDateTime,
        end: endDateTime,
        description,
        priority,
      };

      if (editingEvent) {
        // Оновлюємо існуючу подію
        await updateEvent(user.uid, editingEvent.id, eventData);
        
        // Оновлюємо локальний стан
        const updatedEvent: CalendarEvent = {
          ...editingEvent,
          ...eventData,
          backgroundColor: priorityColors[priority].bg,
          borderColor: priorityColors[priority].border,
        };
        
        setEvents(events.map(e => e.id === editingEvent.id ? updatedEvent : e));
        setEditingEvent(null);
      } else {
        // Створюємо нову подію
        const newEvent = await addEvent(user.uid, eventData);
        
        const formattedEvent: CalendarEvent = {
          ...newEvent,
          backgroundColor: priorityColors[priority].bg,
          borderColor: priorityColors[priority].border,
        };

        setEvents([...events, formattedEvent]);
      }

      setDialogOpen(false);
      setEventForm({
        title: "",
        description: "",
        priority: "normal",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
      });
    } catch (error) {
      setError(editingEvent ? "Помилка оновлення події" : "Помилка створення події");
      console.error("Error saving event:", error);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setEventForm({
      title: "",
      description: "",
      priority: "normal",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
    });
  };

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Header Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: 3,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Календар подій
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Плануйте та керуйте своїми подіями
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {/* View Selector */}
            <ToggleButtonGroup
              value={calendarView}
              exclusive
              onChange={handleViewChange}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  color: "white",
                  borderColor: alpha("#ffffff", 0.3),
                  "&.Mui-selected": {
                    backgroundColor: alpha("#ffffff", 0.2),
                    color: "white",
                  },
                },
              }}
            >
              <ToggleButton value="dayGridMonth">
                <Tooltip title="Місяць">
                  <CalendarViewMonth />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="timeGridWeek">
                <Tooltip title="Тиждень">
                  <CalendarViewWeek />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="timeGridDay">
                <Tooltip title="День">
                  <CalendarViewDay />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Event Count */}
            <Chip
              icon={<Event />}
              label={`${events.length} подій`}
              sx={{
                backgroundColor: alpha("#ffffff", 0.2),
                color: "white",
                border: `1px solid ${alpha("#ffffff", 0.3)}`,
              }}
            />
          </Stack>
        </Box>
      </Paper>

      {/* Calendar */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: `1px solid ${theme.palette.divider}`,
          position: "relative",
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: alpha("#ffffff", 0.8),
              zIndex: 1,
              borderRadius: 3,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={calendarView}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          locale="uk"
          height="auto"
          aspectRatio={1.8}
          eventDisplay="block"
          dayHeaderClassNames="custom-day-header"
          viewClassNames="custom-calendar-view"
          buttonText={{
            today: "Сьогодні",
            month: "Місяць",
            week: "Тиждень",
            day: "День",
          }}
        />
      </Paper>

      {/* Add Event FAB */}
      <Fab
        color="primary"
        aria-label="add event"
        onClick={() => setDialogOpen(true)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Create Event Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        {/* Render DialogTitle as div to avoid nesting headings (h6) inside an h2 which causes hydration errors */}
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              {editingEvent ? "Редагувати подію" : "Створити подію"}
            </Typography>
            <IconButton onClick={handleDialogClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {editingEvent && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Редагування події: {editingEvent.title}
            </Alert>
          )}
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Назва події"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Опис"
              multiline
              rows={3}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              variant="outlined"
            />

            <FormControl fullWidth>
              <InputLabel>Пріоритет</InputLabel>
              <Select
                value={eventForm.priority}
                label="Пріоритет"
                onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value as "normal" | "important" | "critical" })}
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: priorityColors[value as keyof typeof priorityColors].bg,
                        }}
                      />
                      {label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Дата початку"
                type="date"
                value={eventForm.startDate}
                onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Час початку"
                type="time"
                value={eventForm.startTime}
                onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Дата закінчення"
                type="date"
                value={eventForm.endDate}
                onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Час закінчення"
                type="time"
                value={eventForm.endTime}
                onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleDialogClose} color="inherit">
            Скасувати
          </Button>
          <Button
            onClick={handleCreateEvent}
            variant="contained"
            disabled={!eventForm.title || !eventForm.startDate || !eventForm.startTime}
            sx={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              },
            }}
          >
            {editingEvent ? "Оновити" : "Створити"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Модалка вибору дії */}
      <Dialog
        open={actionDialogOpen}
        onClose={handleActionDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          },
        }}
      >
        {/* Render DialogTitle as div to avoid invalid nested heading structure */}
        <DialogTitle component="div" sx={{ textAlign: "center", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {selectedEventForAction?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Оберіть дію
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          <Stack spacing={2}>
            <Button
              onClick={handleEditAction}
              variant="outlined"
              fullWidth
              startIcon={<Edit />}
              sx={{
                py: 1.5,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  borderColor: theme.palette.primary.dark,
                },
              }}
            >
              Редагувати подію
            </Button>
            <Button
              onClick={handleDeleteAction}
              variant="outlined"
              fullWidth
              startIcon={<Delete />}
              sx={{
                py: 1.5,
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.error.main, 0.04),
                  borderColor: theme.palette.error.dark,
                },
              }}
            >
              Видалити подію
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleActionDialogClose} color="inherit" fullWidth>
            Скасувати
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}