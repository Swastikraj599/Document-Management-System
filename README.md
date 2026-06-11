# Document Management System

A full-stack, role-based document management web application built with React and Firebase. Designed for corporate environments where secure document storage, access control, and team collaboration are critical.

---

## Features

- **Role-Based Access Control (RBAC)** — Assign granular permissions per user (view, edit, delete, share)
- **Secure Document Storage** — Firebase Storage backend; no unauthorized access without explicit permissions
- **User Authentication** — Firebase Authentication for login, registration, and session management
- **Document Sharing** — Share documents with specific users or teams with configurable access levels
- **Dashboard with Analytics** — Visual document activity and usage stats via Recharts
- **Calendar View** — Track document deadlines and activity using React Calendar
- **Responsive UI** — FontAwesome icons with a clean, corporate-ready interface

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React.js                            |
| Backend     | Firebase (Firestore + Storage)      |
| Auth        | Firebase Authentication             |
| Charts      | Recharts                            |
| Calendar    | React Calendar                      |
| Icons       | Font Awesome 6                      |

---

# Project Structure

```text
Document-Management-System/
│
├── doc-manager-react/                # Main React frontend application
│   │
│   ├── public/                       # Static public assets
│   │
│   ├── src/                          # Application source code
│   │   │
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Navbar.js
│   │   │   ├── DocumentCard.js
│   │   │   └── UploadForm.js
│   │   │
│   │   ├── pages/                    # Route-level pages/screens
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── UploadDocument.js
│   │   │   └── Profile.js
│   │   │
│   │   ├── firebase/                 # Firebase configuration & services
│   │   │   ├── config.js
│   │   │   ├── auth.js
│   │   │   ├── firestore.js
│   │   │   └── storage.js
│   │   │
│   │   ├── assets/                   # Images, icons, and static resources
│   │   │
│   │   ├── styles/                   # CSS files and styling resources
│   │   │
│   │   ├── App.js                    # Root React component
│   │   └── index.js                  # Application entry point
│   │
│   ├── package.json                  # Frontend dependencies
│   └── README.md                     # Frontend documentation
│
├── package.json                      # Root project dependencies
│
└── README.md                         # Main project documentation
```

## Folder Description

### `components/`

Contains reusable UI elements used across multiple pages, such as navigation bars, document cards, buttons, and upload forms.

### `pages/`

Contains route-specific screens including login, dashboard, document upload, and profile pages.

### `firebase/`

Handles Firebase integration:

* Authentication
* Firestore database operations
* Cloud Storage management
* Firebase configuration

### `assets/`

Stores images, logos, icons, and other static resources.

### `styles/`

Contains CSS files and styling-related resources.

### `App.js`

Root component that manages routing and application layout.

### `index.js`

Application entry point that renders the React application into the DOM.


---

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn
- A Firebase project ([create one here](https://console.firebase.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/Swastikraj599/Document-Management-System.git
cd Document-Management-System
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Set Up the React App

```bash
cd doc-manager-react
npm install
```

### 4. Configure Firebase

Create a `.env` file inside `doc-manager-react/` with your Firebase project credentials:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

### 5. Run the Application

```bash
npm start
```

App runs at `http://localhost:3000`

---

## Firebase Setup

Enable the following in your Firebase project console:

- **Authentication** → Email/Password provider
- **Firestore Database** → Start in production mode, then configure security rules
- **Storage** → For document file uploads

---

## Environment Variables

| Variable | Description |
|---|---|
| `REACT_APP_FIREBASE_API_KEY` | Firebase API Key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firestore Project ID |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `REACT_APP_FIREBASE_APP_ID` | Firebase App ID |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## Author

**Swastik Raj**
[GitHub](https://github.com/Swastikraj599) · [LinkedIn](https://linkedin.com/in/swastikraj599)

---

## License

This project is open source and available under the [MIT License](LICENSE).
 
