-- CampusBites Database Schema
CREATE DATABASE IF NOT EXISTS campusbites_db;
USE campusbites_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'staff', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_menu_name (name)
) ENGINE=InnoDB;

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'preparing', 'ready_for_pickup', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_status (status)
) ENGINE=InnoDB;

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    menu_item_id INT,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Cart Table
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_item (user_id, menu_item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_fav (user_id, menu_item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- SEED DATA (For development purposes)
-- Seed Categories
INSERT IGNORE INTO categories (id, name, description) VALUES
(1, 'Beverages', 'Hot and cold refreshments'),
(2, 'Fast Food', 'Burgers, fries, pizzas, and wraps'),
(3, 'Indian Mains', 'Traditional Indian curries, rotis, and rice'),
(4, 'Desserts', 'Sweet treats and ice creams'),
(5, 'Healthy Bites', 'Salads, bowls, and whole grain meals');

-- Seed Users (Passwords are 'password123' hashed using bcrypt)
-- Hashed value: $2a$10$7Z2vPjV2sD0Z7X0f7u7OeeGf1tWpP5lJjK/3/Vsp82.lOqA243q1u
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'Admin User', 'admin@campusbites.com', '$2a$10$7Z2vPjV2sD0Z7X0f7u7OeeGf1tWpP5lJjK/3/Vsp82.lOqA243q1u', 'admin'),
(2, 'Canteen Staff', 'staff@campusbites.com', '$2a$10$7Z2vPjV2sD0Z7X0f7u7OeeGf1tWpP5lJjK/3/Vsp82.lOqA243q1u', 'staff'),
(3, 'John Student', 'student@campusbites.com', '$2a$10$7Z2vPjV2sD0Z7X0f7u7OeeGf1tWpP5lJjK/3/Vsp82.lOqA243q1u', 'student');

-- Seed Menu Items
INSERT IGNORE INTO menu_items (id, name, description, price, category_id, image_url, is_available) VALUES
(1, 'Classic Cold Coffee', 'Chilled espresso blended with milk and vanilla ice cream', 80.00, 1, '', 1),
(2, 'Masala Chai', 'Traditional hot Indian tea infused with cardamom and ginger', 20.00, 1, '', 1),
(3, 'Paneer Tikka Burger', 'Crispy paneer patty with spicy tikka sauce and fresh greens', 120.00, 2, '', 1),
(4, 'Veg Cheese Pizza', '9-inch thin crust pizza loaded with mozzarella and seasonal vegetables', 180.00, 2, '', 1),
(5, 'Butter Paneer Masala Rice Bowl', 'Creamy butter paneer served over warm basmati jeera rice', 150.00, 3, '', 1),
(6, 'Chole Bhature', 'Spicy chickpea curry served with two puffed golden flatbreads', 110.00, 3, '', 1),
(7, 'Chocolate Fudge Brownie', 'Warm, gooey chocolate brownie topped with chocolate syrup', 90.00, 4, '', 1),
(8, 'Fruit Salad Bowl', 'Freshly sliced seasonal fruits with a dash of honey lime dressing', 75.00, 5, '', 1);
