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

## User Authentication Flow

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

## Application Flow Diagram

```mermaid
    ---
config:
  theme: base
  themeVariables:
    background: "#ffffff"
    primaryTextColor: "#000000"
    lineColor: "#000000"
    textColor: "#000000"
    clusterBkg: "#ffffff"
    clusterBorder: "#000000"
---
flowchart TB
    Client["Client Apps<br/>(Postman / React Frontend / Mobile)"]
    Razorpay["Razorpay<br/>(Payment Gateway)"]

    subgraph Server["Node.js + Express Server (server.js / app.js)"]
        direction TB

        subgraph MW["Global Middleware Pipeline"]
            direction TB
            Helmet["helmet<br/>(secure HTTP headers)"]
            RateLimit["express-rate-limit<br/>(100 req/hr per IP on /api)"]
            WebhookRoute["POST /api/v1/webhook-razorpay<br/>(express.raw, registered BEFORE<br/>json parser for signature check)"]
            BodyParser["express.json<br/>(body parsing, 10kb limit)"]
            Sanitize["express-mongo-sanitize + xss-clean<br/>(NoSQL injection / XSS defense)"]
            HPP["hpp<br/>(param pollution guard)"]
            Static["express.static<br/>(serves /public)"]
            Helmet --> RateLimit --> WebhookRoute --> BodyParser --> Sanitize --> HPP --> Static
        end

        subgraph Routers["Routers (/api/v1/*)"]
            direction TB
            TourRouter["tourRouter"]
            UserRouter["userRouter"]
            ReviewRouter["reviewRouter"]
            BookingRouter["bookingRouter<br/>(checkout-session, verify-payment,<br/>my-bookings, admin CRUD)"]
            TourRouter -. "nested: /:tourId/reviews" .-> ReviewRouter
        end

        subgraph Auth["Auth Middleware (authController)"]
            direction TB
            Protect["protect<br/>(verify JWT, attach req.user)"]
            Restrict["restrictTo(...roles)<br/>(role-based access control)"]
            Protect --> Restrict
        end

        subgraph Controllers["Controllers"]
            direction TB
            TourCtrl["tourController<br/>(aliasTopTours, geo queries,<br/>aggregations)"]
            UserCtrl["userController<br/>(getMe, updateMe, deleteMe)"]
            ReviewCtrl["reviewController<br/>(setTourUserIds)"]
            AuthCtrl["authController<br/>(signup, login, forgot/reset<br/>password, updatePassword)"]
            BookingCtrl["bookingController<br/>(checkoutSession, verifyPaymentAndBook,<br/>razorpayWebhook, getMyBookings)"]
            Factory["handleFactory<br/>(generic createOne/getAll/<br/>getOne/updateOne/deleteOne)"]

            TourCtrl -. uses .-> Factory
            UserCtrl -. uses .-> Factory
            ReviewCtrl -. uses .-> Factory
            BookingCtrl -. uses .-> Factory
        end

        subgraph Utils["Cross-cutting Utils"]
            direction TB
            APIFeatures["APIFeatures<br/>(filter/sort/limit/paginate)"]
            AppError["AppError"]
            CatchAsync["catchAsync<br/>(async error wrapper)"]
            ErrorHandler["globalErrorHandler<br/>(errors.js)"]
            Email["email.js<br/>(nodemailer)"]
            SignatureUtil["verifyRazorpaySignature<br/>(HMAC SHA256 check)"]
        end

        subgraph Models["Mongoose Models"]
            direction TB
            TourModel["Tour<br/>(geo index, slug,<br/>virtual populate: reviews)"]
            UserModel["User<br/>(bcrypt hash, password reset<br/>token, active flag)"]
            ReviewModel["Review<br/>(unique tour+user index,<br/>post-save avgRating calc)"]
            BookingModel["Booking<br/>(unique+sparse razorpayPaymentId,<br/>paid flag, tour+user refs)"]
        end
    end

    DB[("MongoDB Atlas<br/>(Tours / Users / Reviews / Bookings)")]
    SMTP["Email Service<br/>(SMTP via nodemailer)"]

    Client -->|HTTPS request| MW
    MW --> Routers
    Routers -->|protected routes| Auth
    Routers -->|public routes| Controllers
    Auth --> Controllers
    Controllers --> Utils
    Controllers --> Models
    Models -->|Mongoose ODM| DB
    AuthCtrl -->|password reset /<br/>welcome email| Email
    Email --> SMTP
    Controllers -. errors .-> ErrorHandler
    ErrorHandler -->|JSON error response| Client
    Controllers -->|JSON success response| Client
    BookingCtrl -->|create order / verify signature| Razorpay
    BookingCtrl -. uses .-> SignatureUtil
    Razorpay -.->|signed webhook payload,<br/>bypasses Client + Auth| WebhookRoute
    WebhookRoute -->|payment.captured event| BookingCtrl

    classDef default fill:#ffffff,stroke:#000000,color:#000000,stroke-width:2px;
    classDef external fill:#e6f0ff,stroke:#003b8f,color:#000000,stroke-width:3px;
    classDef db fill:#fff4cc,stroke:#7a4f00,color:#000000,stroke-width:3px;
    classDef payment fill:#ffe0e0,stroke:#990000,color:#000000,stroke-width:3px;
    classDef server fill:#f2f2f2,stroke:#000000,color:#000000,stroke-width:2px;
    classDef middleware fill:#e6f7f5,stroke:#005a55,color:#000000,stroke-width:2px;
    classDef auth fill:#eee8ff,stroke:#3b1f7a,color:#000000,stroke-width:2px;
    classDef controller fill:#e8f1ff,stroke:#003b8f,color:#000000,stroke-width:2px;
    classDef utility fill:#fff0d9,stroke:#7a3e00,color:#000000,stroke-width:2px;
    classDef model fill:#e8f7e8,stroke:#145214,color:#000000,stroke-width:2px;

    class Client,SMTP external;
    class DB db;
    class Razorpay payment;
    class Server server;
    class Helmet,RateLimit,WebhookRoute,BodyParser,Sanitize,HPP,Static middleware;
    class Protect,Restrict auth;
    class TourCtrl,UserCtrl,ReviewCtrl,AuthCtrl,BookingCtrl,Factory controller;
    class APIFeatures,AppError,CatchAsync,ErrorHandler,Email,SignatureUtil utility;
    class TourModel,UserModel,ReviewModel,BookingModel model;

    linkStyle default stroke:#000000,stroke-width:2px;

```

## Installation

### **1. Clone the repository**

```sh
git clone https://github.com/YogeshMahajanGit/Natours-API.git
cd Natours-API
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

## **5. Running Tests**

```sh
npm test
```

Tests use `mongodb-memory-server` for an isolated in-memory database and Supertest for HTTP integration testing.

[![Run Tests](https://github.com/YogeshMahajanGit/Natours-API/actions/workflows/test.yaml/badge.svg)](https://github.com/YogeshMahajanGit/Natours-API/actions/workflows/test.yaml)

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
- **Jest/Supertest**(Testing)

## Contact

For any inquiries, reach out via email: **mahajanyogesh443@gmail.com**

---

🚀 **Happy Coding!** If you like this project, don't forget to ⭐ the repo!
