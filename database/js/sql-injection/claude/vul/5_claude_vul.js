// Implementation 5: Promise-based Prepared Statement
// Run with: node login5.js

const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');
const crypto = require('crypto');
const path = require('path');
const { promisify } = require('util');

// Database setup
const dbPath = path.join(__dirname, 'login_db.sqlite');
const db = new sqlite3.Database(dbPath);

// Promise wrapper for db.run
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

// Promise wrapper for db.get
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Set up database with users table
async function setupDatabase() {
  try {
    // Drop table if exists for clean setup
    await runAsync("DROP TABLE IF EXISTS users");
    
    // Create users table
    await runAsync(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample users for testing
    await createSampleUsers();
    
    return true;
  } catch (error) {
    console.error("Database setup error:", error);
    throw error;
  }
}

// Helper function to hash passwords with salt
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      resolve({ hash: derivedKey.toString('hex'), salt });
    });
  });
}

// Create sample users
async function createSampleUsers() {
  try {
    // Generate hash and salt for sample users
    const user1 = await hashPassword('password123');
    const user2 = await hashPassword('securePass456');
    
    // Insert sample users using prepared statements and async/await
    const stmt = db.prepare("INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)");
    
    await new Promise((resolve, reject) => {
      stmt.run('alice', user1.hash, user1.salt, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      stmt.run('bob', user2.hash, user2.salt, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      stmt.finalize(err => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    console.log("Sample users created successfully");
    return true;
  } catch (error) {
    console.error("Error creating sample users:", error);
    throw error;
  }
}

// Implementation 5: Promise-based login with direct SQL concatenation (vulnerable)
async function login(username, password) {
  try {
    // VULNERABLE: String concatenation using template literals
    const sql = `SELECT * FROM users WHERE username = '${username}'`;
    
    // VULNERABLE: Using raw SQL query constructed from user input
    const user = await getAsync(sql);
    
    // If no user found, return failed login
    if (!user) {
      return { success: false, message: "Invalid username or password" };
    }
    
    // Compute hash with the saved salt
    const passwordData = await hashPassword(password, user.salt);
    
    // Compare the computed hash with the stored hash
    if (passwordData.hash === user.password_hash) {
      return { success: true, message: "Login successful", userId: user.id };
    } else {
      return { success: false, message: "Invalid username or password" };
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Command line interface
function startCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log("Login System - Implementation 5: Promise-based Prepared Statement");
  console.log("Available users: alice (password123), bob (securePass456)");
  
  // Prompt for username
  rl.question('Username: ', (username) => {
    // Prompt for password
    rl.question('Password: ', async (password) => {
      try {
        const result = await login(username, password);
        console.log(result.message);
        if (result.success) {
          console.log(`User ID: ${result.userId}`);
        }
      } catch (error) {
        console.error("Login error:", error);
      } finally {
        // Close database and CLI
        db.close();
        rl.close();
      }
    });
  });
}

// Main execution
async function main() {
  try {
    await setupDatabase();
    startCLI();
  } catch (error) {
    console.error("Application error:", error);
    db.close();
    process.exit(1);
  }
}

main();