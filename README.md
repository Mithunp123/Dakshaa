# DaKshaa - Event Management System

A comprehensive event management platform built with React, Node.js, and Supabase for managing college technical fest registrations, payments, and attendance.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DaKshaa-login
```

2. **Install Frontend Dependencies**
```bash
cd Frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd Backend
npm install
```

4. **Configure Environment Variables**

**Frontend (.env)**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

**Backend (.env)**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
```

5. **Setup Database**

Run these SQL files in Supabase SQL Editor (in order):
```bash
database/schema.sql                    # Core database structure
database/seed.sql                      # Sample data
database/add_email_to_profiles.sql    # Profile enhancements
database/setup_profile_trigger.sql    # Auto profile creation
database/create_admin_stats_function.sql  # Admin statistics
```

6. **Enable Realtime** (Supabase Dashboard)
- Go to Database → Replication
- Enable for: `registrations`, `profiles`, `attendance`

### Running the Application

**Start Backend**
```bash
cd Backend
npm start
```

**Start Frontend**
```bash
cd Frontend
npm run dev
```

Access at: `http://localhost:5173`

## 📁 Project Structure

```
DaKshaa-login/
├── Frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── Pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── Components/   # Shared components
│   │   └── firebase.js   # Firebase config
│   └── public/           # Static assets
│
├── Backend/              # Node.js + Express backend
│   ├── server.js         # Main server file
│   ├── db.js            # Database connection
│   └── emailService.js  # Email functionality
│
├── database/            # Database scripts
│   ├── schema.sql       # Main database schema
│   ├── seed.sql         # Sample data
│   ├── migrations/      # Database migrations
│   └── archive/         # Historical scripts
│
├── docs/                # Documentation
│   ├── guides/          # User guides
│   └── fix-reports/     # Historical fix reports
│
└── scripts/            # Utility scripts
    └── archive/        # Archived PowerShell scripts
```

## 🎯 Features

### For Students
- ✅ User registration with email verification
- ✅ Event browsing and registration
- ✅ Combo package purchases
- ✅ Payment simulation (temporary)
- ✅ Real-time dashboard updates
- ✅ QR code for attendance
- ✅ Team creation and management
- ✅ Accommodation booking

### For Admins
- ✅ Real-time statistics dashboard
- ✅ User management
- ✅ Event configuration
- ✅ Registration management
- ✅ Payment tracking
- ✅ Attendance scanning
- ✅ Role-based access control
- ✅ Live stats monitoring

## 🔧 Key Technologies

- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Payments**: Simulation (ready for Razorpay/Stripe)

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with college details |
| `events` | Event information and capacity |
| `combos` | Combo package definitions |
| `registrations` | Event registrations with payment status |
| `teams` | Team information for team events |
| `attendance` | Attendance tracking |
| `accommodation` | Accommodation bookings |

## 🔐 User Roles

- **student**: Default role, can register for events
- **super_admin**: Full system access
- **registration_admin**: Manage registrations
- **event_coordinator**: Manage assigned events
- **volunteer**: Scan attendance

## 📖 Documentation

### Essential Guides
- [Profile Setup Guide](docs/guides/PROFILE_SETUP_GUIDE.md) - User profile configuration
- [Realtime Dashboard Guide](docs/guides/REALTIME_DASHBOARD_GUIDE.md) - Real-time features
- [Workflow Guide](docs/guides/WORKFLOW.md) - Development workflow

### Feature Guides
- [Event Registration](docs/guides/EVENT_REGISTRATION_GUIDE.md)
- [Combo Packages](docs/guides/COMBO_SYSTEM_GUIDE.md)
- [Admin Modules](docs/guides/ADMIN_MODULES_README.md)
- [Attendance System](docs/guides/ATTENDANCE_SYSTEM_GUIDE.md)
- [Database Setup](docs/guides/DATABASE_SETUP.md)

## 🚨 Common Issues

### Backend won't start
- Check if port 3000 is available
- Verify `.env` file exists with correct credentials

### Frontend connection errors
- Ensure backend is running
- Check `VITE_API_URL` in Frontend/.env

### Database errors
- Run migrations in correct order
- Check Supabase RLS policies
- Verify database connection

### Realtime not working
- Enable replication in Supabase
- Check WebSocket connection
- Verify RLS policies allow reads

## 🛠️ Development

### Adding New Features
1. Create feature branch
2. Implement frontend components
3. Add backend endpoints if needed
4. Update database schema
5. Test thoroughly
6. Submit PR

### Database Migrations
1. Create new SQL file in `database/migrations/`
2. Test in development
3. Document changes
4. Run in production

## 📝 Environment Configuration

### Production Deployment
1. Update environment variables
2. Build frontend: `npm run build`
3. Deploy to hosting service
4. Run production migrations
5. Test thoroughly

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

[Your License Here]

## 👥 Team

[Your Team Information]

## 📞 Support

For issues and questions:
- Create GitHub issue
- Contact: [Your Contact Info]

## 🎉 Acknowledgments

Built for college technical fest management with love ❤️
