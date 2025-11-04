"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search,
  Event,
  MoreVert,
  Edit,
  Delete,
  Schedule,
  CalendarToday,
  AccessTime,
  PriorityHigh,
  Flag,
  Star,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";
import AppLayout from "../components/Layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { getUserEvents, deleteEvent, updateEvent } from "@/app/lib/firestore";

interface EventItem {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
  priority: "normal" | "important" | "critical";
}

const priorityColors = {
  normal: { bg: "#10b981", color: "#ffffff", label: "Звичайна" },
  important: { bg: "#f59e0b", color: "#ffffff", label: "Важлива" },
  critical: { bg: "#ef4444", color: "#ffffff", label: "Критична" },
};

const priorityIcons = {
  normal: <Flag />,
  important: <Star />,
  critical: <PriorityHigh />,
};

export default function EventListPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [eventBeingEdited, setEventBeingEdited] = useState<EventItem | null>(null); 
  const [eventBeingDeleted, setEventBeingDeleted] = useState<EventItem | null>(null); 
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState<{
    title: string;
    start: string;
    end: string;
    description: string;
    priority: "normal" | "important" | "critical";
  }>({
    title: "",
    start: "",
    end: "",
    description: "",
    priority: "normal",
  });

  const theme = useTheme();

  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userEvents = await getUserEvents(user.uid);
        setEvents(userEvents);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, eventItem: EventItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleEdit = () => {
    if (selectedEvent) {
      setEventBeingEdited(selectedEvent);
      
      const formatDateForInput = (dateString: string) => {
        try {
          if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            return dateString;
          }
          
          if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
            return dateString.substring(0, 16); 
          }
          
          const date = parseISO(dateString);
          return format(date, "yyyy-MM-dd'T'HH:mm");
        } catch (error) {
          console.error("Error formatting date for input:", dateString, error);
          return dateString;
        }
      };

      console.log("List: Editing event:", selectedEvent);
      console.log("List: Original start date:", selectedEvent.start);
      console.log("List: Original end date:", selectedEvent.end);

      const formattedStart = formatDateForInput(selectedEvent.start);
      const formattedEnd = formatDateForInput(selectedEvent.end || selectedEvent.start);
      
      console.log("List: Formatted start date:", formattedStart);
      console.log("List: Formatted end date:", formattedEnd);
      
      setEditingEvent({
        title: selectedEvent.title,
        start: formattedStart,
        end: formattedEnd,
        description: selectedEvent.description || "",
        priority: selectedEvent.priority as "normal" | "important" | "critical",
      });
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedEvent) {
      setEventBeingDeleted(selectedEvent);
      console.log("List: Setting event for deletion:", selectedEvent);
    }
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (eventBeingDeleted && user) {
      try {
        console.log("List: Deleting event:", eventBeingDeleted.id);
        console.log("List: User ID:", user.uid);
        
        await deleteEvent(user.uid, eventBeingDeleted.id);
        
        console.log("List: Event deleted successfully from Firestore");
        
        setEvents(prevEvents => {
          const newEvents = prevEvents.filter(event => event.id !== eventBeingDeleted.id);
          console.log("List: Updated events count after deletion:", newEvents.length);
          return newEvents;
        });
        
      } catch (error) {
        console.error("List: Error deleting event:", error);
        const errorMessage = error instanceof Error ? error.message : "Невідома помилка";
        alert("Помилка при видаленні події: " + errorMessage);
      }
    } else {
      console.error("List: Missing eventBeingDeleted or user:", { eventBeingDeleted, user });
    }
    setDeleteDialogOpen(false);
    setEventBeingDeleted(null);
  };

  const handleEditSave = async () => {
    if (eventBeingEdited && user) {
      console.log("List: Starting save process");
      console.log("List: Current editingEvent:", editingEvent);
      console.log("List: Event being edited:", eventBeingEdited);
      
      if (!editingEvent.title.trim()) {
        alert("Назва події є обов'язковою");
        return;
      }
      
      if (!editingEvent.start) {
        alert("Дата та час початку є обов'язковими");
        return;
      }
      
      try {
        const formatDateForFirestore = (dateString: string) => {
          if (!dateString) return undefined;
          
          if (dateString && !dateString.endsWith(':00')) {
            return `${dateString}:00`;
          }
          return dateString;
        };

        const updatedEventData = {
          title: editingEvent.title.trim(),
          start: formatDateForFirestore(editingEvent.start),
          end: editingEvent.end ? formatDateForFirestore(editingEvent.end) : undefined,
          description: editingEvent.description.trim(),
          priority: editingEvent.priority,
        };
        
        console.log("List: Updating event with data:", updatedEventData);
        console.log("List: Event being edited ID:", eventBeingEdited.id);
        console.log("List: User ID:", user.uid);
        
        await updateEvent(user.uid, eventBeingEdited.id, updatedEventData);
        
        console.log("List: Event updated successfully");
        
        setEvents(prevEvents => {
          const updatedEvents = prevEvents.map(event => 
            event.id === eventBeingEdited.id 
              ? { 
                  ...event, 
                  title: updatedEventData.title,
                  start: updatedEventData.start!,
                  end: updatedEventData.end,
                  description: updatedEventData.description,
                  priority: updatedEventData.priority
                }
              : event
          );
          console.log("List: Updated local events:", updatedEvents);
          return updatedEvents;
        });
        
        setEditDialogOpen(false);
        setEventBeingEdited(null);
        
        setEditingEvent({
          title: "",
          start: "",
          end: "",
          description: "",
          priority: "normal",
        });
        
        console.log("List: Save process completed successfully");
        
      } catch (error) {
        console.error("List: Error updating event:", error);
        const errorMessage = error instanceof Error ? error.message : "Невідома помилка";
        alert("Помилка при оновленні події: " + errorMessage);
      }
    } else {
      console.error("List: Missing eventBeingEdited or user:", { eventBeingEdited, user });
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEventBeingEdited(null);
    setEditingEvent({
      title: "",
      start: "",
      end: "",
      description: "",
      priority: "normal",
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === "all" || event.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const formatEventDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "d MMMM yyyy", { locale: uk });
    } catch {
      return "Невідома дата";
    }
  };

  const formatEventTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return "Невідомий час";
    }
  };

  const getEventDuration = (start: string, end?: string) => {
    if (!end) return "Весь день";
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      
      if (duration < 60) {
        return `${duration} хв`;
      } else {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return minutes > 0 ? `${hours}г ${minutes}хв` : `${hours}г`;
      }
    } catch {
      return "Невідома тривалість";
    }
  };

  return (
    <AppLayout title="Список подій" subtitle="Перегляд та управління подіями">
      <Box>
        {/* Filter Controls */}
        <Card
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Фільтри та пошук
          </Typography>
          
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center">
            <Box sx={{ flexGrow: 1, minWidth: { xs: "100%", md: "300px" } }}>
              <TextField
                fullWidth
                placeholder="Пошук подій..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "white" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha("#ffffff", 0.3),
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha("#ffffff", 0.5),
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "white",
                    },
                  },
                }}
                sx={{
                  "& .MuiInputLabel-root": {
                    color: alpha("#ffffff", 0.7),
                  },
                  "& input::placeholder": {
                    color: alpha("#ffffff", 0.7),
                    opacity: 1,
                  },
                }}
              />
            </Box>
            
            <Box sx={{ minWidth: { xs: "100%", md: "200px" } }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: alpha("#ffffff", 0.7) }}>Пріоритет</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Пріоритет"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  sx={{
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha("#ffffff", 0.3),
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha("#ffffff", 0.5),
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "white",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "white",
                    },
                  }}
                >
                  <MenuItem value="all">Всі події</MenuItem>
                  <MenuItem value="normal">Звичайні</MenuItem>
                  <MenuItem value="important">Важливі</MenuItem>
                  <MenuItem value="critical">Критичні</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box>
              <Chip
                icon={<Event />}
                label={`Знайдено: ${filteredEvents.length}`}
                sx={{
                  backgroundColor: alpha("#ffffff", 0.2),
                  color: "white",
                  border: `1px solid ${alpha("#ffffff", 0.3)}`,
                  fontWeight: 600,
                }}
              />
            </Box>
          </Stack>
        </Card>

        {/* Events List */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
          {filteredEvents.length === 0 ? (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Card sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
                <Event sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Події не знайдено
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Спробуйте змінити фільтри або створити нову подію
                </Typography>
              </Card>
            </Box>
          ) : (
            filteredEvents.map((event) => (
              <Card
                key={event.id}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar
                        sx={{
                          bgcolor: priorityColors[event.priority].bg,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {priorityIcons[event.priority]}
                      </Avatar>
                      <Chip
                        label={priorityColors[event.priority].label}
                        size="small"
                        sx={{
                          backgroundColor: priorityColors[event.priority].bg,
                          color: priorityColors[event.priority].color,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, event)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {/* Title */}
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {event.title}
                  </Typography>

                  {/* Description */}
                  {event.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Event Details */}
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatEventDate(event.start)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatEventTime(event.start)}
                        {event.end && ` - ${formatEventTime(event.end)}`}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <Schedule sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {getEventDuration(event.start, event.end)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Редагувати</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Видалити</ListItemText>
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          disableEnforceFocus={false}
          disableAutoFocus={false}
          disableRestoreFocus={false}
        >
          <DialogTitle component="div">Підтвердження видалення</DialogTitle>
          <DialogContent>
            <Typography>
              Ви впевнені, що хочете видалити подію &quot;{eventBeingDeleted?.title}&quot;?
              Цю дію неможливо скасувати.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setDeleteDialogOpen(false);
                setEventBeingDeleted(null);
              }} 
              color="inherit"
              type="button"
            >
              Скасувати
            </Button>
            <Button 
              onClick={confirmDelete} 
              color="error" 
              variant="contained"
              type="button"
            >
              Видалити
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleEditCancel}
          maxWidth="sm"
          fullWidth
          disableEnforceFocus={false}
          disableAutoFocus={false}
          disableRestoreFocus={false}
        >
          <DialogTitle component="div">Редагувати подію</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {eventBeingEdited && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Редагування події: {eventBeingEdited.title}
                </Alert>
              )}
              
              <Stack spacing={3}>
                <TextField
                  label="Назва події"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                />

                <TextField
                  label="Початок"
                  type="datetime-local"
                  value={editingEvent.start}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, start: e.target.value }))}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Завершення"
                  type="datetime-local"
                  value={editingEvent.end}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, end: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <FormControl fullWidth>
                  <InputLabel>Пріоритет</InputLabel>
                  <Select
                    value={editingEvent.priority}
                    label="Пріоритет"
                    onChange={(e) => setEditingEvent(prev => ({ 
                      ...prev, 
                      priority: e.target.value as "normal" | "important" | "critical" 
                    }))}
                  >
                    <MenuItem value="normal">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Flag sx={{ color: priorityColors.normal.bg }} />
                        {priorityColors.normal.label}
                      </Box>
                    </MenuItem>
                    <MenuItem value="important">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Star sx={{ color: priorityColors.important.bg }} />
                        {priorityColors.important.label}
                      </Box>
                    </MenuItem>
                    <MenuItem value="critical">
                      <Box display="flex" alignItems="center" gap={1}>
                        <PriorityHigh sx={{ color: priorityColors.critical.bg }} />
                        {priorityColors.critical.label}
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Опис"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleEditCancel} 
              color="inherit"
              type="button"
            >
              Скасувати
            </Button>
            <Button 
              onClick={handleEditSave} 
              variant="contained"
              disabled={!editingEvent.title.trim()}
              type="button"
              sx={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                },
              }}
            >
              Зберегти зміни
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
