# 🏥 Arogya X - Comprehensive Hospital Management System

<div align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-blue?style=for-the-badge" alt="MERN Stack">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
</div>

## 🌟 Overview

**Arogya X** is a state-of-the-art Hospital Management System designed to revolutionize healthcare operations. Built with the powerful MERN stack, this comprehensive solution streamlines every aspect of hospital management - from patient registration to billing, making healthcare delivery more efficient, secure, and patient-centered.

> *"Transforming Healthcare Through Technology"* - Arogya X bridges the gap between traditional healthcare and modern digital solutions.

## ✨ Core Features

### 👥 **Multi-Role Authentication System**
- **Patients**: Secure registration and login with profile management
- **Doctors**: Professional dashboard with appointment management
- **Administrators**: Complete system control and analytics
- **Staff Members**: Dedicated access for hospital staff operations

### 🗓️ **Smart Appointment Management**
- **Intelligent Scheduling**: Book appointments with preferred doctors
- **Real-time Availability**: Live doctor schedule updates
- **Flexible Rescheduling**: Easy modification and cancellation
- **Automated Notifications**: SMS and email reminders
- **Queue Management**: Efficient patient flow control

### 📋 **Comprehensive Patient Records**
- **Digital Health Records**: Complete medical history storage
- **Admission Management**: Streamlined patient admission process
- **Emergency Contact**: Quick access to patient emergency information
- **Medical History Tracking**: Comprehensive health timeline
- **Insurance Integration**: Seamless insurance claim processing

### 👨‍⚕️ **Doctor Dashboard**
- **Appointment Overview**: Daily schedule management
- **Patient Consultation**: Access to patient history during visits
- **Prescription Management**: Digital prescription generation
- **Availability Control**: Set working hours and availability
- **Earnings Tracking**: Financial overview and reports

### 🏥 **Advanced Hospital Operations**
- **Staff Management**: Complete employee lifecycle management
- **Room & Bed Management**: Real-time room availability tracking
- **Department Organization**: Multi-specialty department management
- **Equipment Tracking**: Medical equipment inventory
- **Visitor Management**: Secure visitor access control

### 💰 **Intelligent Billing System**
- **Automated Bill Generation**: Smart billing based on services
- **Multiple Payment Methods**: Cash, card, and online payments
- **Insurance Claims**: Direct insurance provider integration
- **Receipt Generation**: Professional PDF receipt creation
- **Payment Tracking**: Complete financial audit trail

### 📊 **Analytics & Reporting**
- **Dashboard Insights**: Real-time hospital metrics
- **Revenue Analytics**: Financial performance tracking
- **Patient Statistics**: Demographic and health analytics
- **Doctor Performance**: Appointment and patient metrics
- **Operational Reports**: Comprehensive system reports

### 🔒 **Security & Compliance**
- **HIPAA Compliance**: Healthcare data protection standards
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Granular permission system
- **Data Encryption**: End-to-end data protection
- **Audit Logging**: Complete activity tracking

## 🛠️ Technology Stack

### **Frontend Architecture**
```
🎨 User Interface
├── React.js 18+ (Modern Hooks & Context)
├── Vite (Lightning-fast development)
├── Tailwind CSS (Responsive design)
├── React Router (Client-side routing)
├── Axios (HTTP client)
└── React Toastify (User notifications)
```

### **Backend Infrastructure**
```
⚙️ Server Architecture
├── Node.js (Runtime environment)
├── Express.js (Web framework)
├── MongoDB (Document database)
├── Mongoose (ODM for MongoDB)
├── JWT (Authentication)
├── Bcrypt (Password hashing)
├── Multer (File uploads)
├── Cors (Cross-origin requests)
└── Cloudinary (Image storage)
```

### **Development Tools**
```
🔧 Development Setup
├── ESLint (Code linting)
├── Prettier (Code formatting)
├── PostCSS (CSS processing)
├── Nodemon (Development server)
└── Concurrently (Multi-process management)
```

## 🚀 System Architecture & Workflow

### **Application Structure**
```
🏥 Arogya X Hospital Management System
│
├── 👨‍💼 Admin Panel (Port: 5173)
│   ├── Dashboard & Analytics
│   ├── Staff Management
│   ├── Doctor Management
│   ├── Patient Management
│   ├── Billing System
│   ├── Admission Management
│   └── System Configuration
│
├── 👥 Patient Frontend (Port: 5174)
│   ├── Registration & Login
│   ├── Appointment Booking
│   ├── Medical Records
│   ├── Bill Payment
│   ├── Doctor Search
│   └── Profile Management
│
└── 🔧 Backend API (Port: 4000)
    ├── Authentication Services
    ├── Appointment Management
    ├── Patient Records API
    ├── Billing System API
    ├── File Upload Services
    └── Database Operations
```

### **User Journey Workflows**

#### 🩺 **Patient Workflow**
```mermaid
Patient Registration → Profile Setup → Doctor Search → 
Appointment Booking → Visit Hospital → Consultation → 
Bill Payment → Medical Records Access → Follow-up
```

#### 👨‍⚕️ **Doctor Workflow**
```mermaid
Doctor Login → Dashboard Access → Appointment Review → 
Patient Consultation → Prescription Writing → 
Medical Records Update → Availability Management
```

#### 👨‍💼 **Admin Workflow**
```mermaid
Admin Login → Dashboard Overview → Staff Management → 
Patient Admissions → Billing Operations → 
Report Generation → System Monitoring
```

## 📁 Project Structure

```
arogyax/
│
├── 📱 admin/                    # Admin Panel (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx     # Navigation bar
│   │   │   └── Sidebar.jsx    # Admin sidebar
│   │   ├── pages/             # Page components
│   │   │   ├── Admin/         # Admin-specific pages
│   │   │   └── Doctor/        # Doctor dashboard pages
│   │   ├── context/           # React context providers
│   │   ├── assets/            # Images and icons
│   │   └── App.jsx           # Main app component
│   └── package.json
│
├── 🌐 frontend/                 # Patient Portal (React + Vite)
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── Banner.jsx     # Landing page banner
│   │   │   ├── Footer.jsx     # Site footer
│   │   │   └── Navbar.jsx     # Main navigation
│   │   ├── pages/             # Page components
│   │   │   ├── About.jsx      # About page
│   │   │   ├── Appointment.jsx # Booking page
│   │   │   ├── MyProfile.jsx  # User profile
│   │   │   └── MyBills.jsx    # Patient bills
│   │   ├── context/           # State management
│   │   └── assets/            # Static resources
│   └── package.json
│
└── ⚙️ backend/                  # API Server (Node.js + Express)
    ├── controllers/            # Business logic
    │   ├── adminController.js  # Admin operations
    │   ├── doctorController.js # Doctor operations
    │   └── userController.js   # Patient operations
    ├── models/                 # Database schemas
    │   ├── appointmentModel.js # Appointment schema
    │   ├── doctorModel.js     # Doctor schema
    │   ├── userModel.js       # Patient schema
    │   ├── admissionModel.js  # Hospital admission
    │   └── billingModel.js    # Billing records
    ├── routes/                 # API endpoints
    │   ├── adminRoute.js      # Admin routes
    │   ├── doctorRoute.js     # Doctor routes
    │   └── userRoute.js       # Patient routes
    ├── middleware/             # Custom middleware
    │   ├── authAdmin.js       # Admin authentication
    │   ├── authDoctor.js      # Doctor authentication
    │   ├── authUser.js        # Patient authentication
    │   └── multer.js          # File upload handling
    ├── config/                 # Configuration files
    │   ├── mongodb.js         # Database connection
    │   └── cloudinary.js      # Image storage config
    └── server.js              # Main server file
```

## 🔧 Installation & Setup

### **Prerequisites**
```bash
# Required Software
✅ Node.js (v16+ recommended)
✅ MongoDB (Local or Atlas)
✅ Git
✅ npm or yarn
```

### **Quick Start Guide**

#### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/Aritra203/arogyax.git
cd arogyax
```

#### 2️⃣ **Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your .env file
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secure_jwt_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key

# Start the backend server
npm start
# Server runs on http://localhost:4000
```

#### 3️⃣ **Admin Panel Setup**
```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Create environment file
echo "VITE_BACKEND_URL=http://localhost:4000" > .env

# Start admin panel
npm run dev
# Admin panel runs on http://localhost:5173
```

#### 4️⃣ **Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_BACKEND_URL=http://localhost:4000" > .env

# Start frontend application
npm run dev
# Frontend runs on http://localhost:5174
```

### **🐳 Docker Setup (Optional)**
```bash
# Build and run with Docker Compose
docker-compose up --build

# Access applications
# Admin: http://localhost:5173
# Frontend: http://localhost:5174
# Backend: http://localhost:4000
```

## 🎯 Key Features Deep Dive

### **🔐 Advanced Authentication System**
- **Multi-tier Security**: Role-based access control (RBAC)
- **JWT Implementation**: Secure token-based authentication
- **Password Encryption**: Bcrypt hashing for password security
- **Session Management**: Automatic token refresh and logout
- **Account Recovery**: Secure password reset functionality

### **📅 Smart Appointment Management**
- **Real-time Scheduling**: Live doctor availability updates
- **Conflict Prevention**: Automatic double-booking prevention
- **Flexible Booking**: Multiple appointment types (consultation, follow-up, emergency)
- **Automated Reminders**: Email and SMS notifications
- **Cancellation Policy**: Grace period and penalty management

### **🏥 Hospital Operations**
- **Admission Management**: Complete patient admission workflow
- **Room Allocation**: Smart room assignment based on availability
- **Staff Scheduling**: Shift management and duty rosters
- **Equipment Tracking**: Medical equipment inventory and maintenance
- **Vendor Management**: Supplier and procurement tracking

### **💰 Comprehensive Billing System**
- **Service-based Billing**: Automatic charge calculation
- **Insurance Integration**: Direct claim processing
- **Payment Gateway**: Multiple payment options
- **Invoice Generation**: Professional PDF invoices
- **Financial Reports**: Revenue and expense analytics

### **📊 Advanced Analytics**
- **Real-time Dashboards**: Live hospital metrics
- **Patient Analytics**: Demographics and health trends
- **Revenue Tracking**: Financial performance insights
- **Staff Performance**: Productivity and efficiency metrics
- **Predictive Analytics**: Forecasting and trend analysis

## 🔌 API Endpoints

### **Authentication Endpoints**
```javascript
POST   /api/user/register        # Patient registration
POST   /api/user/login          # Patient login
POST   /api/doctor/login        # Doctor login
POST   /api/admin/login         # Admin login
```

### **Appointment Management**
```javascript
GET    /api/user/appointments    # Get user appointments
POST   /api/user/book-appointment # Book new appointment
PUT    /api/user/cancel-appointment # Cancel appointment
GET    /api/doctor/appointments  # Get doctor appointments
```

### **Patient Management**
```javascript
GET    /api/admin/all-users      # Get all patients
POST   /api/admin/add-patient    # Add new patient
PUT    /api/admin/update-patient # Update patient info
GET    /api/user/profile         # Get patient profile
```

### **Billing System**
```javascript
GET    /api/admin/billing-list   # Get all bills
POST   /api/admin/billing-create # Create new bill
PUT    /api/admin/billing-payment # Process payment
GET    /api/user/bills          # Get patient bills
POST   /api/user/pay-bill       # Patient bill payment
```

## 🚀 Deployment Guide

### **Production Environment Setup**

#### **Backend Deployment (Render/Heroku)**
```bash
# Environment Variables
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
PORT=4000
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_secret_key
```

#### **Frontend Deployment (Vercel/Netlify)**
```bash
# Build command
npm run build

# Environment Variables
VITE_BACKEND_URL=https://your-backend-url.com
```

#### **Database Setup (MongoDB Atlas)**
```javascript
// Connection string format
mongodb+srv://<username>:<password>@cluster.mongodb.net/arogyax
```

## 🔧 Development Guidelines

### **Code Standards**
- **ES6+ Syntax**: Modern JavaScript features
- **Component Structure**: Functional components with hooks
- **Error Handling**: Comprehensive try-catch blocks
- **Code Comments**: Detailed documentation
- **Testing**: Unit and integration tests

### **Git Workflow**
```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Bug fixes
git checkout -b fix/bug-description
git commit -m "fix: resolve bug description"
git push origin fix/bug-description
```

### **Environment Configuration**
```bash
# Development
NODE_ENV=development
DEBUG=true

# Staging
NODE_ENV=staging
DEBUG=false

# Production
NODE_ENV=production
DEBUG=false
```

## 📈 Performance Optimization

### **Frontend Optimization**
- **Code Splitting**: Lazy loading for better performance
- **Image Optimization**: WebP format and lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **Caching Strategy**: Browser and CDN caching

### **Backend Optimization**
- **Database Indexing**: Optimized MongoDB queries
- **Caching Layer**: Redis for session management
- **API Rate Limiting**: Prevent abuse and ensure stability
- **Load Balancing**: Horizontal scaling support

## 🛡️ Security Features

### **Data Protection**
- **HTTPS Encryption**: SSL/TLS certificate implementation
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

### **HIPAA Compliance**
- **Data Encryption**: At rest and in transit
- **Access Logging**: Complete audit trail
- **User Permissions**: Granular access control
- **Data Backup**: Regular automated backups

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### **Contribution Areas**
- 🐛 Bug fixes and improvements
- ✨ New feature development
- 📚 Documentation updates
- 🧪 Test coverage improvement
- 🎨 UI/UX enhancements

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/Aritra203/arogyax/issues)
- **Documentation**: [Wiki and guides](https://github.com/Aritra203/arogyax/wiki)
- **Community**: [Discussions and Q&A](https://github.com/Aritra203/arogyax/discussions)

## 🏷️ Keywords & Tags

`Hospital Management` • `MERN Stack` • `Healthcare Technology` • `MongoDB` • `Express.js` • `React.js` • `Node.js` • `Patient Records` • `Appointment Booking` • `Medical Billing` • `Healthcare Analytics` • `HIPAA Compliance` • `JWT Authentication` • `Medical Software` • `Digital Health`

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <h3>🌟 Made with ❤️ for Better Healthcare 🌟</h3>
  <p><strong>Arogya X</strong> - Empowering Healthcare Through Technology</p>
  
  <a href="https://github.com/Aritra203/arogyax">⭐ Star this repository if you found it helpful!</a>
</div>
