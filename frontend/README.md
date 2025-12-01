# Nolofication Frontend

Beautiful, modern React frontend for the Nolofication notification service, built with Vite and TailwindCSS v4.

## 🎨 Features

- **Modern Tech Stack**: React 19 + Vite 7 + TailwindCSS v4.1
- **Nolo Branding**: Custom green/cyan color scheme with dark theme
- **Responsive Design**: Mobile-first, works beautifully on all devices
- **Smooth Animations**: Polished interactions and transitions
- **Clean Architecture**: Component-based structure with React Router

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:5173`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.jsx   # Main layout with navigation
│   │   ├── Button.jsx   # Button component
│   │   ├── Card.jsx     # Card component with variants
│   │   ├── Toggle.jsx   # Toggle switch
│   │   ├── Input.jsx    # Input field
│   │   └── Modal.jsx    # Modal dialog
│   ├── pages/           # Page components
│   │   ├── Home.jsx     # Landing page
│   │   ├── Preferences.jsx  # Global preferences
│   │   ├── SitePreferences.jsx  # Site-specific settings
│   │   └── Notifications.jsx  # Notification history
│   ├── App.jsx          # App router
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles with TailwindCSS
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## 🎨 Design System

### Colors

```css
--color-nolo-green: #00c853      /* Primary brand color */
--color-electric-cyan: #2ee9ff   /* Accent color */
--color-dark-bg: #0b0f10         /* Main background */
--color-dark-surface: #13181a    /* Card/surface background */
--color-border-gray: #2a2f31     /* Borders */
--color-text-white: #f3f7f7      /* Text color */
```

### Components

- **Button**: Primary, secondary, outline, ghost, danger variants
- **Card**: Modular card with header, body, footer
- **Toggle**: Smooth animated toggle switch
- **Input**: Styled input with label and error states
- **Modal**: Overlay modal with backdrop blur

## 🔌 API Integration

The frontend proxies API requests to the backend:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

All `/api/*` requests are forwarded to the Flask backend.

## 📄 Pages

### Home
- Hero section with branding
- Feature showcase
- Active sites list
- Quick actions

### Global Preferences
- Email notifications toggle
- Web push toggle
- Discord configuration
- Custom webhook setup
- Save functionality

### Site Preferences
- Site-specific overrides
- Visual indication of overridden settings
- Reset to global defaults
- Per-channel customization

### Notifications
- Notification list with pagination
- Filter by read/unread
- Filter by site
- Type badges (info, success, warning, error)
- Channel indicators
- Relative timestamps

## 🎯 Routes

- `/` - Home page
- `/preferences` - Global notification preferences
- `/sites/:siteId/preferences` - Site-specific preferences
- `/notifications` - Notification history

## 🛠️ Development

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Layout.jsx`

### Adding a New Component

1. Create component in `src/components/`
2. Export and import where needed
3. Follow existing patterns for styling

### TailwindCSS v4 Custom Theme

Custom colors are defined in `src/index.css`:

```css
@theme {
  --color-nolo-green: #00c853;
  --color-electric-cyan: #2ee9ff;
  /* ... */
}
```

Use in components:

```jsx
<div className="bg-nolo-green text-text-white border-border-gray">
```

## 📦 Dependencies

### Core
- `react` - UI library
- `react-dom` - DOM rendering
- `react-router-dom` - Routing

### Styling
- `tailwindcss` - Utility-first CSS
- `@tailwindcss/vite` - TailwindCSS Vite plugin

### Icons
- `lucide-react` - Beautiful icon set

### Build
- `vite` - Fast build tool
- `@vitejs/plugin-react` - React plugin for Vite

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The `dist/` folder contains the production build.

### Serve with Nginx

```nginx
server {
    listen 80;
    server_name nolofication.bynolo.ca;
    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment Variables

Create `.env` for environment-specific config:

```bash
VITE_API_BASE_URL=https://nolofication.bynolo.ca
```

Access in code:

```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

## 🎨 Screenshots

*Coming soon - the UI features:*
- Dark theme with green/cyan accents
- Smooth hover effects and transitions
- Responsive mobile layout
- Clean, modern card-based design
- Beautiful notification cards with type indicators

## 📝 TODO

- [ ] Connect to real backend API
- [ ] Implement KeyN OAuth login
- [ ] Add web push subscription UI
- [ ] Implement real-time updates
- [ ] Add notification sounds/animations
- [ ] Add user avatar/profile
- [ ] Implement pagination
- [ ] Add search functionality
- [ ] Add notification filters by date
- [ ] Implement dark/light mode toggle (currently dark only)

## 🔗 Related

- **Backend**: `/backend` - Flask API server
- **Docs**: Project documentation in `/docs`

## 📄 License

Part of the byNolo ecosystem.
