# Full Stack Project - React + Spring Boot + PostgreSQL

A full-stack application with React frontend, Spring Boot backend, and PostgreSQL database.

## Project Structure

```
mvp/
├── frontend/          # React application with JavaScript
├── backend/           # Spring Boot application
├── docker-compose.yml # PostgreSQL database configuration
└── README.md
```

## Prerequisites

- **Node.js** (v18 or higher)
- **Java** (JDK 17 or higher)
- **Maven** (3.6 or higher)
- **Docker** and **Docker Compose**
- **PostgreSQL** (if not using Docker)

## Getting Started

### 1. Database Setup

Start PostgreSQL using Docker Compose:

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432 with:
- Database: `mvpdb`
- Username: `postgres`
- Password: `postgres`

To stop the database:
```bash
docker-compose down
```

### 2. Backend Setup

Navigate to the backend directory and run:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend will start on **http://localhost:8080**

#### Test Backend
Visit: http://localhost:8080/api/health

You should see:
```json
{
  "status": "UP",
  "message": "Backend is running successfully"
}
```

### 3. Frontend Setup

Navigate to the frontend directory and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**

## Configuration

### Backend Configuration
- **Port**: 8080
- **Database URL**: `jdbc:postgresql://localhost:5432/mvpdb`
- **CORS**: Configured for `http://localhost:5173` and `http://localhost:3000`

Configuration file: `backend/src/main/resources/application.properties`

### Frontend Configuration
The frontend is configured to work with Vite's default settings.

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if backend is running

## Tech Stack

### Frontend
- React 18
- Vite
- JavaScript

### Backend
- Spring Boot 3.2.1
- Spring Data JPA
- PostgreSQL Driver
- Lombok
- Maven

### Database
- PostgreSQL 15

## Development

### Frontend Development
```bash
cd frontend
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

### Backend Development
```bash
cd backend
mvn spring-boot:run  # Run application
mvn test            # Run tests
mvn clean install   # Build project
```

### Database Management
```bash
docker-compose up -d      # Start database
docker-compose down       # Stop database
docker-compose logs -f    # View logs
```

## Next Steps

1. Create your entities in `backend/src/main/java/com/example/demo/entity/`
2. Create repositories in `backend/src/main/java/com/example/demo/repository/`
3. Create services in `backend/src/main/java/com/example/demo/service/`
4. Create controllers in `backend/src/main/java/com/example/demo/controller/`
5. Build your React components in `frontend/src/components/`
6. Create API services in `frontend/src/services/`

## Troubleshooting

### Database Connection Issues
- Ensure Docker is running
- Check if PostgreSQL container is up: `docker ps`
- Verify port 5432 is not in use by another service

### Backend Port Conflict
- If port 8080 is in use, change it in `application.properties`
- Update CORS configuration if needed

### Frontend Connection Issues
- Verify backend is running on port 8080
- Check browser console for CORS errors
- Update API endpoint if backend port changed

## License

MIT
