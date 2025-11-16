# 📅 My Calendar App

A web application for managing events and calendar with features for editing, deleting, and filtering events.

## 🚀 Features

- **Calendar View**: Display events in calendar format (month, week, day views)
- **Event List**: View all events in card format with detailed information
- **Filtering**: Search by event name and filter by priority level
- **CRUD Operations**: 
  - Create new events
  - Edit existing events
  - Delete events
- **Priority Levels**: Normal, Important, Critical
- **Authentication**: Sign in via Firebase
- **Responsive Design**: Adaptive interface for all devices
- **Real-time Sync**: All changes sync immediately with Firestore

## 📋 Requirements

- Node.js 18 or higher
- npm or yarn package manager
- Firebase account (for database setup)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd my-calendar
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Firebase**
   - Create a project on [Firebase Console](https://console.firebase.google.com)
   - Copy your configuration and add it to `src/app/firebase/config.ts`
   - Enable Firestore Database and Authentication (Email/Password)

4. **Start the development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Main page (Calendar view)
│   ├── list/page.tsx                 # Events list page
│   ├── auth/login/page.tsx            # Login page
│   ├── components/
│   │   ├── Calendar/
│   │   │   └── CalendarComponent.tsx  # Calendar component
│   │   └── Layout/
│   │       └── AppLayout.tsx          # App layout wrapper
│   ├── firebase/
│   │   └── config.ts                 # Firebase configuration
│   ├── lib/
│   │   └── firestore.ts              # Firestore database functions
│   └── context/
│       └── AuthContext.tsx            # Authentication context
├── theme.ts                           # Material-UI theme configuration
└── globals.css                        # Global styles
```

## 🎨 Key Components

### CalendarComponent
Main calendar view component with event management
- FullCalendar library integration
- Three view modes: Month, Week, Day
- Quick event creation by clicking on a date
- Event editing and deletion via context menu

### EventListPage
Event list view with filtering capabilities
- Search by event name and description
- Filter by priority level
- Card-based event display
- Edit and delete options via menu

## 🔧 Usage Guide

### Creating Events
1. **On Calendar**: Click on any date to quickly create an event
2. **Using FAB Button**: Click the "+" button at the bottom right
3. **In Dialog**: Fill in event details and click "Create"

### Editing Events
1. **On Calendar**: Click on event → Select "Edit" from menu
2. **In List**: Click three dots on event card → Select "Edit"
3. **In Dialog**: Modify event details and click "Save Changes"

### Deleting Events
1. **On Calendar**: Click on event → Select "Delete" from menu
2. **In List**: Click three dots on event card → Select "Delete"
3. **Confirmation**: Confirm deletion in the dialog

### Filtering in List View
- Use the search field to find events by name or description
- Select priority from the dropdown to filter by importance level

## 📦 Technology Stack

### Frontend
- **React 18+**: UI library
- **Next.js 16+**: React framework with SSR
- **Material-UI (MUI)**: Component library
- **FullCalendar**: Calendar functionality
- **date-fns**: Date manipulation utilities
- **TypeScript**: Type safety

### Backend
- **Firebase Firestore**: Cloud database
- **Firebase Authentication**: User authentication

### Tools & Build
- **ESLint**: Code linting
- **Tailwind CSS**: Utility-first CSS (via MUI)
- **Webpack**: Module bundler (built-in with Next.js)

## 🔐 Security Features

- Firebase Authentication for user security
- Firestore Security Rules to protect user data
- End-to-end encryption for data transmission
- User-specific data isolation

## 🚀 Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📝 API Reference

### Firestore Functions

#### `addEvent(userId: string, eventData: EventData)`
Creates a new event for the user
```typescript
await addEvent(userId, {
  title: "Meeting",
  start: "2025-11-15T10:00:00",
  end: "2025-11-15T11:00:00",
  description: "Team sync",
  priority: "important"
})
```

#### `getUserEvents(userId: string)`
Fetches all events for a user
```typescript
const events = await getUserEvents(userId);
```

#### `updateEvent(userId: string, eventId: string, updateData: Partial<EventData>)`
Updates an existing event
```typescript
await updateEvent(userId, eventId, {
  title: "Updated Meeting",
  priority: "critical"
})
```

#### `deleteEvent(userId: string, eventId: string)`
Deletes an event
```typescript
await deleteEvent(userId, eventId);
```

## 🎯 Priority Levels

- **Normal** (🟢): Regular events
- **Important** (🟡): Events that need attention
- **Critical** (🔴): Urgent, high-priority events

## 🐛 Known Issues

- Some accessibility warnings with dialog components (planned for fix)
- Google Analytics requests blocked on local development
- Minor focus management issues in modals

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [FullCalendar Documentation](https://fullcalendar.io/docs)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - Feel free to use and modify this project.

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Last Updated**: November 17, 2025
**Version**: 1.0.0
