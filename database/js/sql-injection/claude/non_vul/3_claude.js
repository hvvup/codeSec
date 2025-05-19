// Implementation 3: Double-Query Pattern
// Run with: node login3.js

const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');
const crypto = require('crypto');
const path = require('path');

// Database setup
const dbPath = path.join(__dirname, 'login_db.sqlite');
const db = new sqlite3.Database(dbPath);

// Set up database with users table
function setupDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop table if exists for clean setup
      db.run("DROP TABLE IF EXISTS users", (err) => {
        if (err) {
          console.error("Error dropping table:", err);
          reject(err);
          return;
        }
        
        // Create users table
        db.run(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error("Error creating table:", err);
            reject(err);
            return;
          }
          
          // Insert sample users for testing
          createSampleUsers()
            .then(resolve)
            .catch(reject);
        });
      });
    });
  });
}

// Helper function to hash passwords with salt
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Create sample users
function createSampleUsers() {
  return new Promise((resolve, reject) => {
    // Generate hash and salt for sample users
    const user1 = hashPassword('password123');
    const user2 = hashPassword('securePass456');
    
    // Prepare statement to avoid SQL injection
    const stmt = db.prepare("INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)");
    
    // Insert sample users
    stmt.run('alice', user1.hash, user1.salt, function(err) {
      if (err) {
        console.error("Error inserting user alice:", err);
        reject(err);
        return;
      }
      
      stmt.run('bob', user2.hash, user2.salt, function(err) {
        if (err) {
          console.error("Error inserting user bob:", err);
          reject(err);
          return;
        }
        
        stmt.finalize();
        console.log("Sample users created successfully");
        resolve();
      });
    });
  });
}

// Implementation 3: Double-query pattern for secure login
function login(username, password) {
  return new Promise(async (resolve, reject) => {
    try {
      // First query: get the salt for the user
      const saltQuery = "SELECT salt FROM users WHERE username = ?";
      
      db.get(saltQuery, [username], async (err, saltRow) => {
        if (err) {
          console.error("Database error:", err);
          reject(err);
          return;
        }
        
        // If user doesn't exist, use a dummy salt to maintain timing consistency
        const salt = saltRow ? saltRow.salt : crypto.randomBytes(16).toString('hex');
        
        // Hash the password with the salt (or dummy salt)
        const hashedPassword = hashPassword(password, salt);
        
        // Second query: attempt to find a user with both the username and hashed password
        const loginQuery = "SELECT id FROM users WHERE username = ? AND password_hash = ?";
        
        db.get(loginQuery, [username, hashedPassword.hash], (err, userRow) => {
          if (err) {
            console.error("Database error:", err);
            reject(err);
            return;
          }
          
          if (userRow) {
            resolve({ success: true, message: "Login successful", userId: userRow.id });
          } else {
            resolve({ success: false, message: "Invalid username or password" });
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Command line interface
function startCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log("Login System - Implementation 3: Double-Query Pattern");
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