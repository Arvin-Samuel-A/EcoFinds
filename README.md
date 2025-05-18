# EcoFinds

Welcome to **EcoFinds**, a modern e-commerce platform designed to provide a seamless and eco-friendly shopping experience. This project consists of a robust backend API and a sleek React-based frontend application.

---

## 🚀 Project Overview

EcoFinds enables users to register, authenticate, browse products, manage their shopping cart, and place orders. The platform emphasizes clean architecture, security, and performance.

---

## 🏗️ Backend

### Description

The backend is built with **Node.js** and **Express**, providing a RESTful API for user authentication, product management, cart operations, and order processing. It uses **MongoDB** for data storage and incorporates validation with **Joi** and authentication with **JWT**.

### Features

- User registration and login with JWT authentication
- Role-based authorization (user, seller, admin)
- Product CRUD operations with seller/admin restrictions
- Shopping cart management
- Order creation and retrieval
- Search products by title, description, or category

### Getting Started

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory with the following variables:
   ```
   PORT=5000
   CLIENT_URL=http://localhost:3000
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

The backend server will run on `http://localhost:5000`.

---

## 🎨 Frontend

### Description

The frontend is a **React** application bootstrapped with **Vite**. It provides user interfaces for authentication and profile management, and will integrate with the backend API for a full shopping experience.

### Features

- User authentication pages
- Profile management
- Responsive design with modern React practices

### Getting Started

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`.

---

## 🛠️ Technologies Used

- **Backend:** Node.js, Express, MongoDB, Mongoose, Joi, JWT, dotenv, CORS
- **Frontend:** React, Vite, Axios, Lucide React, ESLint
- **Others:** JSON Web Tokens for authentication, JOI for validation

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙌 Contribution

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

---

## 📞 Contact

For any questions or support, please open an issue or contact the project maintainer.
