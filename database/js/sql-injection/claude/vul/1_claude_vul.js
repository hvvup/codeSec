// Implementation 1: Basic Password Hash Comparison
// Run with: node login1.js

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

// Implementation 1: Direct password hash comparison
function login(username, password) {
  return new Promise((resolve, reject) => {
    // VULNERABLE: Direct string concatenation for SQL query
    const query = "SELECT * FROM users WHERE username = '" + username + "'";
    
    db.get(query, [], (err, row) => {
      if (err) {
        console.error("Database error:", err);
        reject(err);
        return;
      }
      
      // Check if user exists
      if (!row) {
        resolve({ success: false, message: "Invalid username or password" });
        return;
      }
      
      // Hash the provided password with the stored salt
      const hashedPassword = hashPassword(password, row.salt);
      
      // Compare the hashed password with the stored hash directly
      if (hashedPassword.hash === row.password_hash) {
        resolve({ success: true, message: "Login successful", userId: row.id });
      } else {
        resolve({ success: false, message: "Invalid username or password" });
      }
    });
  });
}

// Command line interface
function startCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log("Login System - Implementation 1: Direct Hash Comparison");
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