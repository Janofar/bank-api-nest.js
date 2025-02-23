# Bank API

## Overview
The **Bank API** is a RESTful API built using **NestJS** and **MongoDB** to manage user accounts, transactions, and authentication securely. The API supports user registration, login, account creation, and transaction processing with features such as rate limiting and session-based transactions.

## Features
- **User Authentication**: Register and login with JWT-based authentication.
- **Account Management**: Create unique bank accounts linked to users.
- **Transactions**: Perform deposits, withdrawals, and transfers between accounts.
- **Rate Limiting**: Prevent excessive API calls using NestJS **ThrottlerModule**.
- **MongoDB Transactions**: Ensure consistency when creating users and accounts.
- **Docker Support**: Easily run the application in a containerized environment.

## Technologies Used
- **NestJS** - Backend framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Passport.js** - Authentication
- **JWT (JSON Web Token)** - Secure user authentication
- **Rate Limiting** - ThrottlerModule for API security
- **Docker** - Containerized deployment

## Installation
### Prerequisites
- **Node.js** (v16 or later)
- **MongoDB** (Local or MongoDB Atlas)
- **Docker** (Optional for containerized setup)

### Setup & Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/bank-api.git
   cd bank-api
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add:
   ```env
   PORT=3000
   MONGO_URI=MONGODB_URL
   JWT_SECRET=your_secret_key
   ```
4. Run the application:
   ```sh
   npm run start
   ```

## API Endpoints
### Authentication
| Method | Endpoint          | Description          |
|--------|------------------|----------------------|
| POST   | `/auth/register` | Register a new user |
| POST   | `/auth/login`    | User login          |

### Accounts
| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/accounts/balance`    | Get user account balance           |

### Transactions
| Method | Endpoint                  | Description                                      |
|--------|---------------------------|--------------------------------------------------|
| POST   | `/transactions/credit`    | Deposit money into an account                    |
| POST   | `/transactions/debit`     | Withdraw money from an account                   |
| GET    | `/transactions/history`   | History of transaction based on date or type     |

## 🏃 Running the Application

### **Run in Development Mode**
```sh
npm run start:dev
```

### **Run in Production Mode**
```sh
npm run build
npm run start
```


## 🐳 Running with Docker

### **1️⃣ Build & Run with Docker Compose**
```sh
docker-compose up --build -d
```
This will:
- Build the Docker image.
- Start the container in detached mode (`-d`).
- Load environment variables from `.env`.

### **2️⃣ Stop the Container**
```sh
docker-compose down
```

### **3️⃣ Run Without Docker Compose** *(Alternative)*
```sh
docker build -t bank-api .
docker run -p 3000:3000 --env-file .env --name bank-api-container bank-api
```

## License
This project is licensed under the **MIT License**.

## Contact
For any questions or issues, reach out to Janofar Jahan at janofarjahan2000@gmail.com.

