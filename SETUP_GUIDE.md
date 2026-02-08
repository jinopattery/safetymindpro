# SafetyMindPro - Complete Setup Guide

## 🚀 Quick Start

### Backend Setup

1. **Navigate to project directory**
   ```powershell
   cd C:\Users\jinop\Documents\edna\safetymindpro
   ```

2. **Activate virtual environment**
   ```powershell
   .\venv\Scripts\Activate
   ```

3. **Pull latest code**
   ```powershell
   git pull origin main
   ```

4. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

5. **Start backend server**
   ```powershell
   python -m backend.app
   ```

   Backend will be available at: http://localhost:8000
   API docs: http://localhost:8000/docs

### Frontend Setup

1. **Open a new PowerShell window**

2. **Navigate to frontend directory**
   ```powershell
   cd C:\Users\jinop\Documents\edna\safetymindpro\frontend
   ```

3. **Install Node.js dependencies** (first time only)
   ```powershell
   npm install
   ```

4. **Start frontend development server**
   ```powershell
   npm start
   ```

   Frontend will open at: http://localhost:3000

## 📋 Features

### ✅ Backend API
- FMEA Analysis CRUD operations
- Fault Tree Analysis management
- File upload (Excel/CSV)
- Export to Excel/CSV
- Risk summary calculations
- Automatic RPN calculation
- SQLite database

### ✅ Frontend UI
- Interactive Dashboard
- FMEA creation and management
- Fault Tree visualization
- Risk Matrix
- Charts and graphs
- Export functionality

## 🧪 Testing the Application

### Create a Sample FMEA Analysis

1. Go to http://localhost:3000
2. Click "Create FMEA Analysis"
3. Fill in the form:
   - Name: "Brake System FMEA"
   - System: "Automotive Brakes"
   - Add failure modes with severity, occurrence, detection ratings
4. Submit and view the automatically calculated RPN

### View Risk Matrix

1. Navigate to "Risk Matrix" in the menu
2. Select an FMEA analysis
3. View the color-coded risk matrix

### Export Data

1. Open any FMEA analysis detail page
2. Click "Export to Excel"
3. Download the generated Excel file

## 📦 Project Structure

```
safetymindpro/
├── backend/
│   ├── app.py                 # Main FastAPI application
│   ├── database.py            # Database configuration
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   └── routers/
│       ├── fmea.py           # FMEA endpoints
│       ├── fta.py            # FTA endpoints
│       ├── upload.py         # File upload endpoints
│       └── export.py         # Export endpoints
├── frontend/
│   ├── public/
│   └── src/
│       ├── pages/            # React pages
│       │   ├── Dashboard.js
│       │   ├── FMEAList.js
│       │   ├── FMEACreate.js
│       │   ├── FMEADetail.js
│       │   ├── FTAList.js
│       │   ├── FTACreate.js
│       │   └── RiskMatrix.js
│       ├── App.js
│       └── index.js
├── requirements.txt
└── README.md
```

## 🔧 Troubleshooting

### Backend Issues

**Module not found error:**
```powershell
# Make sure to run as module
python -m backend.app
```

**Port already in use:**
```powershell
# Change port in backend/app.py or kill the process using port 8000
```

### Frontend Issues

**npm install fails:**
```powershell
# Clear cache and retry
npm cache clean --force
npm install
```

**Proxy errors:**
- Make sure backend is running on port 8000
- Check frontend/package.json has "proxy": "http://localhost:8000"

## 📚 API Documentation

Full interactive API documentation available at:
http://localhost:8000/docs

## 🎯 Next Steps

- Add user authentication
- Implement real-time collaboration
- Add more export formats (PDF, Word)
- Integrate with external systems
- Add advanced analytics and reporting

## 📞 Support

For issues or questions, check the repository issues page.