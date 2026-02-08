# SafetyMindPro Installation Guide

## Prerequisites

Before installing SafetyMindPro, ensure you have:

- **Python 3.9 or higher** - [Download Python](https://www.python.org/downloads/)
- **Git** - [Download Git](https://git-scm.com/downloads)
- **pip** (comes with Python)

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/jinopattery/safetymindpro.git
cd safetymindpro
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Set Up Environment

**Windows:**
```bash
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

### Step 5: Run the Application

```bash
python backend/app.py
```

Or:
```bash
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Access the Application

- API Documentation: http://localhost:8000/docs
- API: http://localhost:8000/api/v1

## Testing

```bash
pytest tests/
```

## Common Issues

- **Python not found:** Add Python to PATH
- **Port in use:** Change PORT in .env file
- **Permission denied:** Run as administrator (Windows) or use sudo (Mac/Linux)

## Next Steps

1. Check API docs at http://localhost:8000/docs
2. Load sample data: `python scripts/load_sample_data.py`
3. Read documentation in /docs folder