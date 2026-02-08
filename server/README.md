# Smart Dustbin Backend

This is the Node.js/Express backend for the Smart Dustbin application.

## Setup

1.  **Install Dependencies**
    ```bash
    cd server
    npm install
    ```

2.  **Environment Variables**
    - Copy `.env.example` to `.env`
    - Update `MONGO_URI` with your MongoDB Atlas connection string.
    - Update `JWT_SECRET` with a secure random string.

3.  **Run Server**
    ```bash
    # Development mode (restarts on changes)
    npm run dev

    # Production mode
    npm start
    ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### specific for Workers Management (Admin Only)
- `GET /api/auth/workers` - Get all workers
- `PUT /api/auth/workers/:id` - Update a worker
- `DELETE /api/auth/workers/:id` - Delete a worker

### Dustbins
- `GET /api/dustbins` - Get all dustbins
- `POST /api/dustbins` - Create a dustbin (Admin)
- `GET /api/dustbins/:id` - Get a single dustbin
- `PUT /api/dustbins/:id` - Update a dustbin (Worker/Admin)
- `DELETE /api/dustbins/:id` - Delete a dustbin (Admin)

## Postman Collection
(You can import this to test APIs)
