# PennApps Full-Stack Application

A full-stack application built with Next.js frontend and FastAPI backend for PennApps.

## Project Structure

```
pennapps-test/
├── frontend/          # Next.js React application
│   ├── src/
│   │   └── app/      # App Router pages
│   ├── package.json
│   └── ...
├── backend/          # FastAPI Python application
│   ├── main.py       # FastAPI application
│   ├── requirements.txt
│   ├── venv/         # Python virtual environment
│   └── ...
└── README.md
```

## Quick Start

### Backend (FastAPI)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Activate the virtual environment:
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Run the FastAPI server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

### Frontend (Next.js)

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Features

- **Backend (FastAPI)**:
  - RESTful API with CRUD operations
  - Phone calling functionality with Twilio integration
  - CORS enabled for frontend communication
  - Interactive API documentation
  - In-memory data storage (replace with database for production)

- **Frontend (Next.js)**:
  - Modern React with TypeScript
  - Tailwind CSS for styling
  - Item management interface
  - Phone calling interface
  - Real-time API integration

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /items` - Get all items
- `GET /items/{item_id}` - Get specific item
- `POST /items` - Create new item
- `PUT /items/{item_id}` - Update item
- `DELETE /items/{item_id}` - Delete item
- `POST /call` - Make a phone call
- `GET /call/status/{call_sid}` - Check call status
- `POST /call/webhook` - Webhook for call updates

## Phone Calling Setup

To enable phone calling functionality, you need to set up Twilio:

1. Create a Twilio account at [twilio.com](https://www.twilio.com/)
2. Get your Account SID, Auth Token, and purchase a phone number
3. Update the credentials in `backend/config.env`:
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

The app is currently configured with a working Twilio account and ready to make calls!

See [PHONE_SETUP.md](PHONE_SETUP.md) for detailed setup instructions.

## Development

Both applications support hot reloading during development. Make sure both servers are running for full functionality.

## Production Deployment

For production deployment, consider:
- Adding a proper database (PostgreSQL, MongoDB, etc.)
- Environment variable configuration
- Docker containerization
- CI/CD pipeline setup
- Security enhancements (authentication, rate limiting, etc.)