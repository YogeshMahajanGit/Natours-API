# Tour Booking API </>

This is a **RESTful API** for a Tour Booking application, allowing users to browse tours, book trips, leave reviews, and manage their accounts. The API is built using **Node.js** and **Express**, with MongoDB as the database.

## Features
- **User Authentication** (Sign up, Login, Forgot Password, etc.)
- **Tour Management** (List, Filter, and Get Tour Details)
- **Booking System** (Book and Manage Reservations)
- **Reviews and Ratings**
- **Geolocation:** Get distances to tours from a given location.
- **Email Notifications:** Automated emails for booking confirmation and password resets.

## API Documentation
For a complete list of available endpoints and request examples, visit the **Postman API Documentation:**  
👉 [API Documentation](https://documenter.getpostman.com/view/37294382/2sAYkKHHhd)

## Installation

### **1. Clone the repository**
```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/tour-booking-api.git
cd tour-booking-api
```

### **2. Install dependencies**
```sh
npm install
```

### **3. Configure environment variables**
Create a `.env` file in the project root and add the following:
```env
NODE_ENV=development or production
PORT=5000
DATABASE_CONNECT_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=20d
JWT_COOKIE_EXPIRES_IN=20
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_HOST=your_email_host
EMAIL_PORT=your_email_port
```

### **4. Start the server**
```sh
npm start
```
For development mode with live reload:
```sh
npm run dev
```

## Deployment
To deploy the API, set up the `.env` variables and use a hosting service like **Vercel, Render, or AWS**.

## Technologies Used
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

- **Node.js & Express** (Backend Framework)
- **MongoDB & Mongoose** (Database & ORM)
- **JWT & Bcrypt** (Authentication & Security)
- **Nodemailer** (Email Services)


## Currently Working On Frontend 🚀

A **React.js** frontend is being developed to provide a user-friendly interface for the API. The frontend will feature:
- A modern UI with **React components**.
- **Tours Page** with filtering options.
- **Single Tour Page** with details, images, guides, reviews, and an interactive map.
- **User Authentication** including signup, login, and profile management.
- **Booking System** integrated with the backend.
- **Admin Dashboard** (future scope).

## Contact
For any inquiries, reach out via email: **mahajanyogesh443@gmail.com**

---
🚀 **Happy Coding!** If you like this project, don't forget to ⭐ the repo!
