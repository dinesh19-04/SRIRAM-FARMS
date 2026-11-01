# 🌱 SRIRAM FARMS
### Farm Machinery Management & Planting Schedule System

SRIRAM FARMS is a web-based farm machinery management application designed to simplify agricultural operations, customer management, machinery scheduling, and payment tracking. It provides a shared platform for farm owners and managers to manage customers and planting activities from mobile phones, tablets, and computers.

## 🚀 Live Website

**Website:** https://sriram-farms.vercel.app

## 📌 Project Overview

The application helps agricultural machinery businesses maintain customer information, manage planting schedules, calculate machinery rental charges, and monitor payments through a centralized dashboard.

The Owner and Manager can work with the same business records while maintaining separate login identities and personal profiles.

## ✨ Key Features

### 1. Owner & Manager Authentication
- Separate Owner and Manager accounts.
- Email and password authentication through Firebase.
- Google sign-in support when configured and enabled.
- Role-based authorization to protect the dashboard.
- Separate personal profiles for Owner and Manager.

### 2. Customer Management
- Add, view, search, edit, and delete customer records.
- Store customer names, mobile numbers, village details, and other relevant information.
- Add customers directly or while creating a planting schedule.
- Avoid duplicate customer records.
- Maintain customer information after refreshing the website.
- Share customer records between authorized Owner and Manager accounts.

### 3. Planting Schedule Management
- Create and manage planting schedules.
- Associate each schedule with an existing customer.
- Select machinery, date, time slot, and cultivated area.
- Track schedule statuses, including Scheduled, Pending, In Progress, and Completed.
- Detect overlapping machinery bookings.
- Edit or delete schedules with appropriate confirmation.
- Synchronize schedule changes across devices.

### 4. Agricultural Machinery Pricing

| Machine Type | Rate per cent |
|---|---:|
| Small Planting Machine | ₹45 |
| Large Planting Machine | ₹40 |

**Pricing formula:**

Total Amount = Cultivated Area in Cents × Rate per Cent

Example:
- Small machine for 10 cents: ₹450.
- Large machine for 10 cents: ₹400.
- 1 acre = 100 cents.

The system calculates charges according to the selected machinery and cultivated area.

### 5. Payment Management
- Record actual customer payments.
- Track amounts paid and outstanding balances.
- Display payment summaries based on saved transaction records.
- Maintain historical transaction values.
- Update dashboard totals when transactions change.

### 6. Dashboard & Reports
- View customer and employee counts.
- Monitor planting schedules and machinery bookings.
- Review payment summaries.
- Display empty states when no business records exist.
- Download reports as PDF, CSV, or other supported formats.
- Provide separate Download and Share actions.

### 7. Cross-Device Synchronization
- Use Firebase Firestore as the shared database when configured.
- Synchronize customer, employee, schedule, and payment records between authorized accounts.
- Load saved records after refreshing or reopening the website.
- Use real-time database listeners where appropriate.
- Keep Owner and Manager profiles separate while sharing business data.

## 🛠️ Technology Stack

- **Frontend:** React.js
- **Programming Language:** TypeScript
- **Build Tool:** Vite
- **Authentication:** Firebase Authentication
- **Database:** Cloud Firestore
- **File Storage:** Firebase Storage, where configured
- **Version Control:** Git and GitHub
- **Hosting:** Vercel

## 📂 Project Structure

```text
sriramfarms/
├── public/                 # Static assets and public files
├── src/                    # Application source code
├── functions/              # Backend functions, if configured
├── scripts/                # Utility and development scripts
├── index.html              # Application entry HTML
├── package.json            # Dependencies and npm scripts
├── package-lock.json       # npm dependency lockfile
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── firestore.rules         # Firestore security rules, if present
├── storage.rules           # Firebase Storage rules, if present
├── .env.example            # Example environment configuration
└── README.md                # Project documentation
```

*The exact structure may vary depending on the current project configuration.*

## ⚙️ Installation & Local Setup

### Prerequisites

Install the following software:

- Node.js and npm
- Git
- Visual Studio Code

### Step 1: Clone the repository

```bash
git clone https://github.com/dinesh19-04/sriramfarms.git
cd sriramfarms
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure Firebase

1. Open the Firebase Console.
2. Select or create the Firebase project.
3. Configure Firebase Authentication.
4. Enable the required sign-in providers.
5. Configure Cloud Firestore and appropriate security rules.
6. Configure Firebase Storage if profile photo uploads are required.
7. Add any required environment variables using the project's existing configuration.

Never commit passwords, private keys, service-account credentials, or secret environment files to GitHub.

### Step 4: Start the development server

```bash
npm run dev
```

Open the local URL printed in the terminal.

### Step 5: Create a production build

```bash
npm run build
```

This generates the production build if the application compiles successfully.

## 🔐 Security

- Authenticate users before granting dashboard access.
- Authorize Owner and Manager roles securely.
- Keep personal profiles associated with their authenticated user IDs.
- Protect customer, employee, schedule, and payment records using appropriate Firebase security rules.
- Do not expose private credentials in frontend code.
- Do not enable unrestricted public database access.

## 🌐 Deployment

The application can be hosted using Vercel with GitHub integration.

1. Push the source code to the connected GitHub repository.
2. Import the repository into Vercel, or use the existing Vercel project.
3. Configure the necessary environment variables.
4. Verify the build command and output directory.
5. Deploy the application.
6. Test authentication, database access, and synchronization on desktop and mobile devices.

When automatic GitHub deployment is configured, pushes to the production branch can trigger a new Vercel deployment.

## 🎯 Project Objectives

- Digitize agricultural machinery rental operations.
- Simplify farmer and customer record management.
- Improve planting schedule coordination.
- Reduce duplicate data entry.
- Calculate machinery charges accurately.
- Maintain reliable payment records.
- Enable Owner and Manager collaboration across devices.

## 🔮 Future Enhancements

- Farmer booking portal.
- SMS and WhatsApp notifications.
- Advanced machinery availability calendar.
- Automated receipts and invoices.
- Multilingual support, including Tamil.
- Analytics and monthly revenue reports.
- Offline data-entry support with safe synchronization.

## 👨‍💻 Author

**Project:** SRIRAM FARMS  
**Domain:** Agriculture Technology / Farm Machinery Management  
**Application Type:** Web Application

## 📄 License

Choose and add an appropriate open-source license if you want others to reuse or modify this project. Without a specified license, do not assume others have permission to reuse the code.

---

*SRIRAM FARMS — Simplifying Farm Machinery Management Through Technology.*
