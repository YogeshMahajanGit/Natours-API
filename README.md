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

## User Authenticatio Flow

```mermaid
%%{init: {'theme': 'neutral', 'themeVariables': { 'background': '#ffffff', 'primaryColor': '#000000', 'primaryTextColor': '#000000', 'noteTextColor': '#000000', 'actorTextColor': '#000000', 'signalTextColor': '#000000', 'lineColor': '#000000', 'altBackground': '#fef3c7', 'altTextColor': '#000000', 'noteBkgColor': '#ffedd5', 'activationBkgColor': '#e5e7eb', 'sequenceNumberColor': '#000000'}}}%%
sequenceDiagram
    actor U as User (Client)
    participant API as Express App
    participant Auth as authController
    participant DB as MongoDB (User collection)
    participant Mail as Email Service (Nodemailer)

    rect rgba(255, 255, 204, 1)
    Note over U,DB: 1. SIGNUP
    U->>API: POST /api/v1/users/signup {name,email,password,passwordConfirm}
    API->>Auth: signup(req,res,next)
    Auth->>DB: User.create({...})
    DB-->>DB: pre('save') hook: bcrypt.hash(password)
    DB-->>Auth: new user document
    Auth->>Auth: generateToken(user._id) via jwt.sign
    Auth-->>U: 201 + Set-Cookie: jwt + {token, user}
    end

    rect rgba(221, 238, 255, 1)
    Note over U,DB: 2. LOGIN
    U->>API: POST /api/v1/users/login {email,password}
    API->>Auth: login(req,res,next)
    Auth->>DB: User.findOne({email}).select('+password')
    DB-->>Auth: user (with hashed password)
    Auth->>Auth: user.correctPassword(candidate, hash) [bcrypt.compare]
    alt password invalid or user not found
        Auth-->>U: 401 Incorrect email or password
    else password valid
        Auth->>Auth: generateToken(user._id)
        Auth-->>U: 200 + Set-Cookie: jwt + {token, user}
    end
    end

    rect rgba(204, 255, 229, 1)
    Note over U,DB: 3. ACCESS PROTECTED ROUTE (e.g. PATCH /users/update-me)
    U->>API: Request with Authorization: Bearer <token>
    API->>Auth: protect(req,res,next)
    Auth->>Auth: jwt.verify(token, JWT_SECRET) [promisified]
    alt token missing / invalid / expired
        Auth-->>U: 401 Please login to get access
    else token valid
        Auth->>DB: User.findById(decoded.id)
        DB-->>Auth: currentUser
        alt user deleted since token issued
            Auth-->>U: 401 User no longer exists
        else user still exists
            Auth->>Auth: currentUser.changePasswordAfter(decoded.iat)
            alt password changed after token issued
                Auth-->>U: 401 Please login again
            else token still valid
                Auth->>Auth: req.user = currentUser
                Auth->>API: next() → restrictTo(roles) if required
                API-->>U: 200 + requested resource
            end
        end
    end
    end

    rect rgba(255, 204, 204, 1)
    Note over U,Mail: 4. FORGOT / RESET PASSWORD
    U->>API: POST /users/forgot-password {email}
    API->>Auth: forgotPassword(req,res,next)
    Auth->>DB: User.findOne({email})
    DB-->>Auth: user
    Auth->>Auth: createPasswordResetToken() [crypto random + sha256 hash]
    Auth->>DB: user.save({validateBeforeSave:false})
    Auth->>Mail: sendEmail({resetURL})
    Mail-->>U: Email with reset link (token valid 10 min)
    Auth-->>U: 200 Token sent to email

    U->>API: PATCH /users/reset-password/:token {password, passwordConfirm}
    API->>Auth: resetPassword(req,res,next)
    Auth->>DB: User.findOne({passwordResetToken: hash(token), passwordResetExpires: {$gt: now}})
    alt token invalid or expired
        DB-->>Auth: null
        Auth-->>U: 400 Token is invalid or expired
    else token valid
        DB-->>Auth: user
        Auth->>DB: set new password, clear reset fields, save()
        Auth->>Auth: generateToken(user._id)
        Auth-->>U: 200 + Set-Cookie: jwt (auto login)
    end
    end

```

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

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
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
