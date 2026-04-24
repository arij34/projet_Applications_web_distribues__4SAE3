<p align="center">
  <img src="https://img.shields.io/badge/Angular-Frontend-red?logo=angular&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Spring%20Boot-Backend-6DB33F?logo=springboot&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Keycloak-Auth-blue?logo=keycloak&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Docker-DevOps-2496ED?logo=docker&style=for-the-badge" />
  <img src="https://img.shields.io/badge/MySQL-Database-orange?logo=mysql&style=for-the-badge" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&style=for-the-badge" />
</p>

<h1 align="center">🚀 Freelancy – Freelance Management Platform</h1>

<p align="center">
  <strong>A distributed web application connecting freelancers with clients through intelligent project management, secure contracts, and premium subscriptions.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Academic%20Year-2025--2026-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Institution-Esprit%20School%20of%20Engineering-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/Module-PIDEV%204th%20Year-green?style=flat-square" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture-globale--technique)
- [Microservices](#-microservices)
  - [User Management](#1--user-management)
  - [Skill Management](#2--skill-management)
  - [Project Management](#3--project-management)
  - [Smart Contract Management](#4--smart-contract-management)
  - [Event Management](#5--event-management)
  - [Planning](#6--planning)
  - [Blog Management](#7--blog-management)
  - [Blog Analytics](#8--blog-analytics)
  - [Challenge Management](#9--challenge-management)
  - [ExamQuiz Service](#10--examquiz-service)
  - [Subscription](#11--subscription)
  - [Payment](#12--payment)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Contributors](#-contributors)
- [Academic Context](#-academic-context)

---

## 🌐 Overview

**Freelancy** is a full-stack distributed web application built on a **microservices architecture**, developed as part of the **PIDEV – 4th Year Engineering Program** at **Esprit School of Engineering** (Academic Year 2025–2026).

The platform is designed to connect **freelancers** with **clients** through a rich ecosystem of features:

- 🤝 Intelligent project management and collaboration
- 📄 AI-powered smart contract generation (via Claude API)
- 🏆 Technical challenges to boost freelancer visibility
- 📝 Blog publishing for knowledge sharing
- 🔐 Anti-cheat exam & quiz system for skill certification
- 💳 Subscription-based premium services (FREE / VIP)
- 📅 Event & planning management with AI suggestions
- 📊 Real-time blog analytics

---

## 🏗 Architecture Globale / Technique

Freelancy is built on a **microservices architecture** with the following infrastructure:

```
┌──────────────────────────────────────────────────────────┐
│                        Docker                            │
│                                                          │
│   Web Browser         WEB APP CON                        │
│   (Angular) ────────►                                    │
│        │               API GATEWAY ──────────────────┐   │
│        │                    │                        │   │
│        └── KEYCLOAK ────────┘                        │   │
│                                                      ▼   │
│                             ┌────────────────────────────┤
│                             │  Microservices             │
│                             │  ├── User Mgmt   → MySQL   │
│                             │  ├── Skill Mgmt  → PgSQL   │
│                             │  ├── Project     → MySQL   │
│                             │  ├── Challenges  → MySQL   │
│                             │  ├── Blog        → MySQL   │
│                             │  ├── Events      → MySQL   │
│                             │  └── Matching    → MongoDB │
│                             └────────────────────────────┤
└──────────────────────────────────────────────────────────┘
```

| Component | Role |
|---|---|
| **API Gateway** | Single entry point routing all requests to microservices |
| **Eureka Server** | Service discovery and registration |
| **Keycloak** | Authentication & Authorization (JWT / OAuth2) |
| **Angular Frontend** | Unified SPA consuming all microservices via the API Gateway |
| **MySQL / PostgreSQL / MongoDB** | Relational and NoSQL databases per microservice |

> All microservices register with **Eureka** and expose their APIs through the **API Gateway**. The Angular frontend communicates exclusively via the Gateway, secured with **JWT tokens** issued by **Keycloak**.

---

## ⚙️ Microservices

### 1. 👤 User Management

Handles user authentication, roles, and profile data. Serves as the **identity backbone** consumed by all other microservices via `userId`.

**Roles:** `Admin` / `Client` / `Freelancer`

**Integration:** Identity provider for all microservices via `userId`.

---

### 2. 🧠 Skill Management

Manages freelancer competencies, experience levels, and availability. Provides the core data feed for other services.

**Features:**
- Add, update, and delete skills per freelancer
- Skill levels: `Beginner` / `Intermediate` / `Expert`
- Experience years and availability tracking
- Skill association via `userId`

**Integration:**
- Exposes skill data to other services
- Communicates with User Service via `userId`
- Available for AI profile analysis

**Database:** PostgreSQL

---

### 3. 📁 Project Management

Enables clients to post and manage project offers. Acts as the central hub for client-freelancer collaboration.

**Features:**
- Create, update, and delete project listings
- Project requirements definition
- Status tracking throughout the project lifecycle

**Integration:**
- Consumed by Smart Contract Service after proposal acceptance
- Communicates with User Service for client identification
- Registered in Eureka, exposed via API Gateway

---

### 4. 📝 Smart Contract Management

Automates the full contract lifecycle using **AI generation** (Claude API) after a client accepts a freelancer proposal.

**Contract Lifecycle:**

```
Auto-Generation → Smart Summary → Validation & Notification
      ↓
Collaborative Editing → Client Decision
      ├── ✅ Accepted → Both Sign → Active → Milestone Execution
      └── ❌ Refused  → Contract Closed
```

**Features:**
- **AI Auto-generation** — Full contract with clauses, duration, scope, complexity, and milestone breakdown
- **Smart Summary** — Plain-language summary generated for both parties
- **Validation & Notification** — Client validates; freelancer receives contract + summary by email
- **Collaborative Editing** — Freelancer proposes modifications; each change is logged and sent to the client
- **PDF Export** — Signed contract exported as a downloadable PDF
- **Milestone Execution** — Project runs phase by phase; each milestone triggers payment and status update
- **Audit Trail** — Full modification history for transparency and dispute resolution

---

### 5. 📅 Event Management

Manages standalone user events with automated email notifications and AI-based timing suggestions.

**Features:**
- Create, update, and delete personal/professional events
- Event statuses: `SUCCESS` / `LATE` / `PENDING`
- Automated email notifications on: creation, completion, and late detection
- AI-powered optimal timing suggestions

**Integration:**
- Communicates with User Service for identification
- Email delivery via SMTP
- APIs exposed for Project Service and AI modules

---

### 6. 🗓️ Planning

Manages global planners and associated tasks, displayed as a **calendar** with quick access via **QR code**.

**Features:**
- Create and manage plannings with linked tasks
- Task statuses: `DONE` / `LATE` / `TODO`
- QR code generation for instant planning access
- Email notifications for completed or overdue tasks
- AI integration for delay prediction

> **Note:** Events = one-off occurrences; Planning = global recurring agenda.

**Integration:**
- Exposes calendar + QR code APIs to the Angular frontend
- Communicates with User Service
- Complements the Event module

---

### 7. ✍️ Blog Management

Manages platform publications (posts): creation, editing, retrieval, and deletion.

**Features:**
- Create posts with title, content, and author info
- Full CRUD on posts
- Author association via `authorId`
- Post metadata: creation date, title, content

**Integration:**
- Communicates with User Service to resolve author details
- APIs exposed through API Gateway
- Registered in Eureka

---

### 8. 📊 Blog Analytics

Tracks and measures the performance of blog posts through **real-time metrics**.

**Tracked Metrics:**

| Metric | Description |
|---|---|
| `total_posts` | Total number of published posts |
| `views` | Number of times a post was viewed |
| `likes` | Number of likes per post |
| Custom indicators | Configurable engagement KPIs |

**Features:**
- Upsert metrics on user actions (post viewed, liked, etc.)
- Retrieve all statistics or a specific metric
- Real-time availability via API

**Integration:**
- Consumes Blog Management Service data
- Exposed via API Gateway and registered in Eureka

---

### 9. 🏆 Challenge Management

Hosts **technical challenges** for freelancers to improve their skills and increase their visibility on the platform.

**Features:**
- Challenge creation and management by administrators
- Freelancer participation and score tracking
- Challenge results integrated into profile evaluation

---

### 10. 📋 ExamQuiz Service

A dedicated Spring Boot microservice responsible for managing the **full exam and quiz lifecycle**, including real-time proctoring and anti-cheat enforcement.

**Features:**

| Area | Details |
|---|---|
| **Exam Management** | Create, update, and manage exams with configurable settings: duration, passing score, maximum attempts, scheduling, and exam type |
| **Question & Answer** | Supports multiple question types and manages answer submissions per attempt |
| **Attempt Tracking** | Records candidate exam attempts, submitted answers, and session statuses |
| **Scoring & Results** | Automatically evaluates submissions and generates detailed result reports per candidate |
| **Anti-Cheat & Proctoring** | Detects violations: tab switching, phone detection, looking away — configurable thresholds, auto-submission on breach |
| **Admin Monitoring** | Real-time dashboard for administrators to track active exam sessions and candidate behavior |
| **Access Control** | Controls which candidates can access specific exams and tracks participation status |

**Technical Details:**

| Property | Value |
|---|---|
| Framework | Spring Boot |
| Database | MySQL (`exam_quiz_db`) |
| Port | `8150` |
| Service Discovery | Eureka Client |
| API Docs | Swagger UI (`/swagger-ui.html`) |
| Inter-service | Feign Client → User Service |

---

### 11. 💳 Subscription

Controls user access levels and monetization via **subscription plans**.

**Plans:** `FREE` / `VIP`  
**Statuses:** `ACTIVE` / `EXPIRED`

**Lifecycle:**

```
Subscription Creation → Payment Trigger → Activation
         ↓
  Automatic Expiration (based on endDate)
         ↓
  Admin-managed modification or renewal
```

**Features:**
- Subscription creation and activation after successful payment
- Automatic expiration based on `endDate`
- Admin-managed modification or deletion
- VIP access check APIs exposed to other modules

**Integration:**
- Verifies users with User Service
- Triggered by Payment Service upon successful transaction
- Provides VIP access check APIs to Project, and AI modules

---

### 12. 💰 Payment

Handles all payment operations for subscription upgrades (`FREE` → `VIP`).

**Features:**
- Payment processing and transaction recording
- Payment statuses: `SUCCESS` / `FAILED`
- User association via `userId`

**Payment Flow:**

```
User requests VIP upgrade
       ↓
Payment processed
       ↓
On success: Payment Service → Subscription Service (VIP activated)
       ↓
Confirmation email sent (amount, subscription type, expiration date)
```

**Integration:**
- Communicates with Subscription Service
- Uses Keycloak JWT for user identification
- Email delivery via SMTP

---

## 🛠 Tech Stack

### Frontend

| Technology | Usage |
|---|---|
| Angular + TypeScript | SPA Framework |
| HTML5 / CSS3 | Markup & Styling |
| Bootstrap + Tailwind CSS | UI Components & Utility Styling |

### Backend

| Technology | Usage |
|---|---|
| Spring Boot (Java) | Microservices Framework |
| Spring Security | Security Layer |
| JPA / Hibernate | ORM |
| MySQL / PostgreSQL / MongoDB | Databases per microservice |
| Keycloak (OAuth2 / JWT) | Authentication & Authorization |
| OpenFeign | Inter-service communication |

### Infrastructure & DevOps

| Technology | Usage |
|---|---|
| Eureka Server | Service Discovery & Registration |
| API Gateway | Centralized routing |
| Docker + Docker Compose | Containerization |
| GitHub Actions | CI/CD Pipeline |
| Nginx | Reverse Proxy |

---

## 🚀 Getting Started

### Prerequisites

- Java 17+
- Node.js 18+ / Angular CLI
- Docker & Docker Compose
- Keycloak instance running

### Clone the Repository

```bash
git clone https://github.com/username/Esprit-PIDEV-4SAE3-2026-Freelancy.git
cd Esprit-PIDEV-4SAE3-2026-Freelancy
```

### Run with Docker Compose

```bash
docker-compose up --build
```

### Run a Backend Microservice Individually

```bash
cd <microservice-folder>
mvn clean install
mvn spring-boot:run
```

### Run the Frontend

```bash
cd frontend
npm install
ng serve
```

### Application URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| API Gateway | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |
| Keycloak Admin | http://localhost:8180 |
| Skill Management | http://localhost:8086 |
| ExamQuiz Service | http://localhost:8150 |
| ExamQuiz Swagger | http://localhost:8150/swagger-ui.html |

---

## 👥 Contributors

| Name | Modules |
|---|---|
| **Arij Achach** | Skill Management |
| **Sirine Bouden** | Project Management · Smart Contract Management |
| **Ameni Benzaghdene** | Challenge Management · ExamQuiz Service |
| **Mohamed Jaffel** | Event Management · Planning |
| **Malek Ben Said** | User Management · Payment · Subscription |
| **Mohamed Wahebi** | Blog Management · Blog Analytics |

**Supervisors:**  
Ms. Leila Bendhief – PIDEV Module  
Ms. Nadine Maazoun – PIDEV Module

---

## 🎓 Academic Context

> Developed at **Esprit School of Engineering – Tunisia**  
> Module: **PIDEV** | Level: **4th Year Engineering** | Academic Year: **2025–2026**

This project applies full-stack development, microservices architecture, DevOps practices, secure authentication (OAuth2/JWT), AI integration (Claude API), and modern software engineering methodologies in a real-world distributed system context.

---

<p align="center">
  <em>Esprit School of Engineering – PIDEV 4SAE3 | 2025–2026</em>
</p>
