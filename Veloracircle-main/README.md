# Velora Circle

**Velora Circle** is a secure, privacy-focused communication and collaboration platform designed for organizations and teams.

It provides private messaging, group communication through Circles, real-time audio/video meetings, file sharing, notifications, and role-based administration. The system is built using a **React + TypeScript frontend** and a **Node.js microservices backend** with an **API Gateway**.

---

## 🚀 Features

* 🔐 Secure user authentication
* 🔑 JWT-based authentication and authorization
* 🔒 Password hashing
* 🛡️ Role-Based Access Control (RBAC)
* ✅ Request validation using Zod
* 🚦 Rate limiting
* 🔒 HTTPS/TLS support
* 💬 Private one-to-one messaging
* 👥 Circle-based group communication
* 🔏 Privacy-focused Circle member visibility
* 📹 Real-time audio/video meetings
* 🖥️ Screen sharing
* 🎤 Microphone and camera controls
* 📁 File sharing
* 🔔 Notification service
* ⚡ Real-time communication using Socket.IO
* 🌐 WebRTC-based peer-to-peer media communication
* 🚪 API Gateway for centralized backend access
* 🛑 API Gateway load shedding
* 🧩 Microservices-based backend architecture

---

## 🏗️ System Architecture

Velora Circle follows a microservices architecture.

```text
                         ┌──────────────────────┐
                         │      Frontend        │
                         │ React + TypeScript   │
                         │   TanStack Router   │
                         └──────────┬───────────┘
                                    │
                              HTTPS / TLS
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     API Gateway      │
                         │     Port: 4000       │
                         │ Express + TypeScript │
                         │    Load Shedding     │
                         └──────────┬───────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
 ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
 │ Auth Service   │       │ User Service   │       │Message Service │
 │    :5001       │       │    :5002       │       │    :5003       │
 └────────────────┘       └────────────────┘       └────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
 ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
 │ Circle Service │       │ Notification   │       │  Call Service  │
 │    :5004       │       │    Service     │       │    :5006       │
 └────────────────┘       │    :5005       │       └────────────────┘
                          └────────────────┘
```

---

## 🧩 Services

| Service              |   Port | Responsibility                                        |
| -------------------- | -----: | ----------------------------------------------------- |
| API Gateway          | `4000` | Central entry point, routing and load shedding        |
| Auth Service         | `5001` | Authentication, login, registration and authorization |
| User Service         | `5002` | User-related operations                               |
| Message Service      | `5003` | Conversations, messages and real-time messaging       |
| Circle Service       | `5004` | Circle/group management                               |
| Notification Service | `5005` | Notifications                                         |
| Call Service         | `5006` | Audio/video call signaling and meeting communication  |

---

## 💻 Technology Stack

### Frontend

* React
* TypeScript
* Vite
* TanStack Router
* Tailwind CSS
* Lucide React
* Socket.IO Client
* WebRTC

### Backend

* Node.js
* Express.js
* TypeScript
* Socket.IO
* MongoDB
* Mongoose
* Zod
* JWT
* Password hashing
* HTTP Proxy Middleware

### Security

* JWT Authentication
* Password Hashing
* HTTPS/TLS
* Zod Input Validation
* Role-Based Access Control
* Rate Limiting
* Secure environment variables

---

## 🔐 Security Architecture

Security is implemented at multiple layers.

```text
                    Velora Circle
                         │
                         ▼
                  HTTPS / TLS
                         │
                         ▼
                  API Gateway
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       Rate Limiting            Load Shedding
             │
             ▼
      JWT Authentication
             │
             ▼
       Input Validation
          (Zod)
             │
             ▼
            RBAC
             │
             ▼
       Protected Services
```

### Authentication

Users authenticate using JWT tokens. Protected API routes verify the token before allowing access to secured resources.

### Password Security

User passwords are stored using password hashing rather than plain text.

### Input Validation

**Zod** is used to validate incoming request data such as:

* User names
* Email addresses
* Passwords
* Message content
* Other API request fields

Invalid input is rejected before it reaches the main application logic.

### Role-Based Access Control

Different roles can have different permissions within the system.

For example, administrative operations are restricted to authorized users.

### Rate Limiting

Rate limiting helps prevent excessive requests, particularly against sensitive endpoints such as authentication.

### HTTPS/TLS

HTTPS/TLS is used to protect communication between the client and backend services during secure local development.

---

## 💬 Messaging

Velora Circle supports private communication between users.

The messaging system includes:

* One-to-one conversations
* Message sending and retrieval
* Message validation
* Real-time communication
* Conversation management
* Protected messaging endpoints

Messages are handled by the **Message Service**.

---

## 👥 Circles

Circles provide group-based communication.

The Circle system supports:

* Creating Circles
* Managing Circle information
* Adding members
* Circle conversations
* Privacy-focused member visibility
* Administrative Circle management

A key privacy requirement of Velora Circle is that **ordinary Circle members should not be able to browse the complete membership directory**, while authorized administrators can manage Circle membership.

---

## 📹 Real-Time Meetings

Velora Circle provides real-time audio/video communication using **WebRTC**.

Meeting functionality includes:

* Camera
* Microphone
* Audio/video communication
* Screen sharing
* Multi-user meeting support
* Call signaling through Socket.IO

### WebRTC Architecture

```text
             User A
                │
                │ WebRTC
                │
                ▼
             User B

        Socket.IO is used for
          signaling:

   Offer → Signaling → Answer
   ICE Candidate ↔ ICE Candidate

        WebRTC handles the
        actual media stream.
```

The **Call Service** manages signaling, while WebRTC handles peer-to-peer media communication.

---

## 🖥️ Screen Sharing

Users can share their screen during meetings using the browser's `getDisplayMedia()` API.

The screen-sharing track can replace the camera video track during an active meeting.

When screen sharing stops, the camera stream can be restored.

---

## ⚡ Real-Time Communication

Velora Circle uses **Socket.IO** for real-time events.

Socket communication is used for areas such as:

* Messaging
* Call signaling
* Meeting events
* Call invitations
* Call acceptance/rejection
* ICE candidates
* Real-time call updates

---

## 🌐 API Gateway

The API Gateway provides a centralized entry point for frontend requests.

```text
Frontend
   │
   ▼
API Gateway :4000
   │
   ├── /auth       → Auth Service
   ├── /users      → User Service
   ├── /messages   → Message Service
   ├── /circles    → Circle Service
   ├── /notifications → Notification Service
   └── /calls      → Call Service
```

The gateway also includes **load shedding**, which helps protect backend services when the system receives excessive traffic.

---

## 📁 Project Structure

```text
Veloracircle-main/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── gateway/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── services/
│   │
│   ├── auth-service/
│   ├── user-service/
│   ├── message-service/
│   ├── circle-service/
│   ├── notification-service/
│   └── call-service/
│
├── docs/
│
├── .gitignore
└── README.md
```

---

## ⚙️ Local Development

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB
* Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/PURNIMASHAH12/Veloracircle-main.git
cd Veloracircle-main
```

---

### 2. Install Dependencies

Install dependencies for the frontend, gateway, and individual services.

Example:

```bash
cd frontend
npm install
```

Then install dependencies for the gateway and services:

```bash
cd ../gateway
npm install
```

Repeat for each service:

```text
services/auth-service
services/user-service
services/message-service
services/circle-service
services/notification-service
services/call-service
```

---

### 3. Environment Variables

Each service should use its own environment configuration where required.

Example:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do **not** commit real credentials, JWT secrets, database passwords, or private TLS keys to GitHub.

Use `.env.example` files to document required environment variables.

---

## ▶️ Running the Application

Start the services individually during development.

Example:

```bash
cd services/auth-service
npm run dev
```

Run the other services in their respective directories.

Start the API Gateway:

```bash
cd gateway
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

The frontend runs on the Vite development server and communicates with the backend through the API Gateway.

---

## 🧪 Testing

Velora Circle's backend development included testing of important authentication and authorization flows, including:

* User registration
* User login
* JWT authentication
* `/auth/me`
* Invalid token handling
* Expired token handling
* Input validation
* Access control
* Rate limiting
* Circle creation
* Circle member access
* Direct conversation creation
* Message sending
* Message retrieval

---

## 🔄 Application Flow

A typical authenticated request follows this path:

```text
User
 │
 ▼
React Frontend
 │
 │ HTTPS
 ▼
API Gateway
 │
 ▼
JWT Verification
 │
 ▼
Target Microservice
 │
 ▼
Validation / Authorization
 │
 ▼
Database
 │
 ▼
Response
 │
 ▼
Frontend
```

---

## 🛡️ Privacy Design

Privacy is an important part of Velora Circle.

The system is designed around principles such as:

* Protected authentication
* Private conversations
* Role-based access
* Restricted Circle membership visibility
* Secure communication
* Environment-based secret management
* HTTPS/TLS
* Controlled API access

The application avoids exposing unnecessary participant information to ordinary users.

---

## 🎯 Project Objectives

The main objectives of Velora Circle are:

1. Build a secure communication platform.
2. Implement a scalable microservices architecture.
3. Provide private messaging and group communication.
4. Support real-time audio/video meetings.
5. Implement authentication and authorization.
6. Protect sensitive user and communication data.
7. Provide privacy-focused Circle management.
8. Demonstrate modern full-stack development practices.

---

## 📚 Academic Project

**Project Name:** Velora Circle
**Program:** BSc CSIT
**Project Type:** Full-Stack Web Application
**Architecture:** Microservices
**Frontend:** React + TypeScript
**Backend:** Node.js + Express + TypeScript
**Database:** MongoDB

---

## 👩‍💻 Author

**Purnima Shah**

BSc CSIT Student

---

## 📄 License

This project was developed as an academic/software development project.

---

## ⭐ Acknowledgement

Velora Circle was developed to explore secure web application development, microservices architecture, real-time communication, WebRTC, authentication, authorization, and privacy-focused system design.
