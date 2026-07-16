# CampusBites - OAC (Open Air Canteen) Management System

CampusBites is a production-quality, full-stack canteen management system designed for college campuses. It streamlines order management, menu administration, and user sessions. 

The project stands out by utilizing **custom, self-rolled Data Structures and Algorithms (DSA)** in pure JavaScript for core features like autocomplete search, order processing, menu undo systems, data caches, and popularity sorting.

---

## 🚀 Technical Architecture & Stack

### Frontend
- **React (Vite)**: Component-driven modular UI.
- **React Router DOM**: Declarative client-side routing with role-based auth guards.
- **Axios**: HTTP client configuration with header interceptors for JWT.
- **Tailwind CSS v4**: Modern utility stylesheet with dark mode and custom theme tokens.
- **React Icons & Chart.js**: Visual indicators and dashboard canvas renderings.

### Backend
- **Node.js & Express.js**: MVC-structured REST API.
- **JWT (JSON Web Tokens)**: Session management stored in client storage.
- **bcryptjs**: Cryptographic password hashing.

### Database
- **MySQL**: Relational database with transactional guarantees, foreign keys, and indexes.

---

## 📂 Project Structure

```
campusbites/
├── database/
│   └── schema.sql             # MySQL tables definitions and seeds
├── server/                    # Express Backend REST API
│   ├── config/                # Database pool connection configs
│   ├── controllers/           # MVC API controllers (Auth, Menu, Orders, Admin)
│   ├── middlewares/           # JWT protect and RBAC authorizers
│   ├── models/                # Schema structures
│   ├── routes/                # Endpoint routing (Auth, Menu, Orders, Admin)
│   ├── services/              # Global state managers (orderQueue, undoStack, menuTrie)
│   ├── utils/                 # Manual DSA structures (Trie, Stack, MaxHeap, Queue, HashMap)
│   ├── .env                   # Environment configurations
│   ├── index.js               # Express app entrypoint
│   └── package.json
├── client/                    # React Frontend Client (Vite)
│   ├── src/
│   │   ├── assets/            # Static assets
│   │   ├── components/        # ProtectedRoute and UI components
│   │   ├── context/           # AuthContext and ThemeContext state providers
│   │   ├── hooks/             # Custom utility hooks
│   │   ├── layouts/           # Page wrapping layouts
│   │   ├── pages/             # Dashboard and session views (Login, Register, Student, Staff, Admin)
│   │   ├── services/          # Axios wrappers (api, authService, menuService, orderService)
│   │   ├── App.jsx            # Router and base theme container
│   │   ├── main.jsx           # Mounting entrypoint
│   │   └── index.css          # Tailwind and scrollbar stylesheet
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🛠️ Installation & Local Setup

### Prerequisites
- Node.js (v16+)
- MySQL Server running locally

### Database Setup
1. Log in to your MySQL terminal:
   ```bash
   mysql -u root -p
   ```
2. Execute the schema script:
   ```sql
   SOURCE database/schema.sql;
   ```
   *Note: This creates `campusbites_db` and seeds categories, menu items, and default accounts.*

### Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Create `.env` file (based on `.env.example`) and adjust database credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=campusbites_db
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---

## 🔑 Recruiter Credentials (Quick Login)

The database is pre-seeded with sample accounts (password is `password123`):
- **Admin**: `admin@campusbites.com`
- **Canteen Staff**: `staff@campusbites.com`
- **Student**: `student@campusbites.com`

---

## 📊 REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Registers a new student, returns user & JWT. |
| `POST` | `/login` | Public | Validates email/password, returns user & JWT. |
| `GET` | `/profile` | Private | Fetches current logged-in user profile. |

### Canteen Menu (`/api/menu`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Public | Fetches list of all food categories. |
| `GET` | `/` | Public | Fetches menu items, optionally filtered by `category_id`. |
| `GET` | `/search` | Public | Autocomplete menu items using custom **Trie** search. |

### Carts & Orders (`/api/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart` | Private | Fetches active items in user's cart. |
| `POST` | `/cart` | Private | Adds an item to the cart (or increments quantity). |
| `PUT` | `/cart/:id` | Private | Updates quantity of a cart item. |
| `DELETE`| `/cart/:id` | Private | Removes an item from the cart. |
| `POST` | `/favorites/toggle` | Private | Toggles item bookmark in favorites. |
| `POST` | `/place` | Private | Places order (MySQL Transactions) and pushes to **FIFO Queue**. |
| `GET` | `/history` | Private | Fetches logged-in student's order history. |
| `GET` | `/staff` | Staff/Admin | Fetches active kitchen orders from the **FIFO Queue**. |
| `PUT` | `/:id/status`| Staff/Admin | Updates order status (updates DB & syncs Queue). |

### Administration (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/menu` | Admin | Creates menu item, adds to Trie, pushes to **Undo Stack**. |
| `PUT` | `/menu/:id` | Admin | Edits menu item, updates Trie, pushes to **Undo Stack**. |
| `DELETE`| `/menu/:id` | Admin | Deletes menu item, updates Trie, pushes to **Undo Stack**. |
| `POST` | `/menu/undo` | Admin | Pops from **Undo Stack** to revert last database menu mutation. |
| `GET` | `/analytics` | Admin | Fetches revenue aggregates, using **HashMap** for optimization. |
| `GET` | `/popular` | Admin | Extracts top-selling foods using a **Max Heap**. |

---

## 🧠 Data Structures & Algorithms (DSA) Implementation

CampusBites avoids third-party utility libraries, implementing core algorithms manually to demonstrate software engineering fundamentals.

### 1. Trie Data Structure (Autocomplete Search)
- **File**: `server/utils/Trie.js`
- **Application**: Indexes menu item names on server startup.
- **Why it matters**: Autocomplete searches require instant lookup. Instead of running expensive SQL `LIKE %q%` searches that trigger database table scans ($O(N)$), the Trie searches strings by letter prefix.
- **Enhancement**: To support multi-word search (e.g., typing "Burger" finds "Paneer Tikka Burger"), the Trie indexes full strings and suffix sub-phrases. It runs a depth-first search (DFS) starting from the prefix node.
- **Complexity**: Search: $O(L)$ where $L$ is query length.

### 2. Stack Data Structure (Menu Action Undo)
- **File**: `server/utils/Stack.js`
- **Application**: Tracks Admin menu mutations (`ADD`, `EDIT`, `DELETE`).
- **Why it matters**: Admins need to undo accidental actions. We push details of the action onto a LIFO (Last-In, First-Out) Stack. 
- **Undo Operation**: Popping from the stack runs corresponding inverse queries (e.g., deleting an added item, inserting a deleted item, or restoring prior edit properties) and updates Trie mapping references.
- **Complexity**: Push/Pop: $O(1)$ time complexity.

### 3. FIFO Queue Data Structure (Kitchen Scheduling)
- **File**: `server/utils/Queue.js`
- **Application**: Organizes incoming active kitchen orders.
- **Why it matters**: Canteens must process orders in the exact sequence they were placed (First-In, First-Out).
- **Implementation**: Written using front and rear integer pointers mapped to a hash object. This prevents array element re-indexing overhead ($O(N)$) during dequeues.
- **Complexity**: Enqueue/Dequeue: $O(1)$ time complexity.

### 4. Max Heap Data Structure (Popular Items)
- **File**: `server/utils/MaxHeap.js`
- **Application**: Dynamically tracks and extracts top-selling food items.
- **Why it matters**: Finding top sellers by sorting arrays runs in $O(N \log N)$ time. 
- **Implementation**: The Max Heap inserts items as binary nodes compared by their total quantity sold. Extracting the root node returns the maximum sales item and runs heapify-down.
- **Complexity**: Insertion/Extraction: $O(\log N)$. Fetching Top $K$ items runs in $O(K \log N)$ time.

### 5. HashMap Data Structure (Analytics Lookups)
- **File**: `server/utils/HashMap.js`
- **Application**: Optimizes category key-value resolution during analytics aggregations.
- **Why it matters**: When gathering category sales volumes, order items must resolve category IDs to category names. Running nested loops results in $O(C \cdot M)$ complexity. 
- **Implementation**: We load category names into a custom bucket-chained HashMap (handling collisions via singly linked list nodes). Resolving names then runs in constant time.
- **Complexity**: Lookup: $O(1)$ average time complexity.

---

## 💼 Resume Bullet Points (GitHub & Interview Showcases)

- **Engineered a production-quality Canteen Management Web App** using React, Node.js, and MySQL. Handled end-to-end routing, JWT authorization, and responsive CSS dashboards.
- **Optimized search query latency to O(L)** by manually implementing an in-memory Trie data structure with suffix-indexing, providing instant autocomplete suggestions for food menu queries.
- **Implemented a transaction-safe checkout system** in MySQL using ACID transactions. Safeguarded order headers, item lists, and cart deletions under atomic execution blocks, resolving race conditions.
- **Developed a pointer-based FIFO Queue scheduler** in pure JavaScript. Organized canteen food orders in arrival sequence, achieving O(1) enqueue/dequeue time complexity.
- **Integrated a LIFO Stack rollback service** on the Express backend to track administrative menu updates, enabling admins to revert database modifications and Trie mappings.
- **Improved analytical query performance** by designing a custom bucket-chained HashMap, reducing category name resolution times during sales aggregations to O(1) average time complexity.
