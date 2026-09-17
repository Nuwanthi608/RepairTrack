const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function main() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.log('Usage: node scripts/createUser.js "Shop Owner" owner@example.com YourPassword');
    process.exit(1);
  }
  if (password.length < 8) {
    console.log("Password must be at least 8 characters");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'owner')",
    [name, email.trim().toLowerCase(), hash]
  );
  console.log(`✅ User created: ${email}`);
}

main()
  .catch((err) => {
    console.error("❌", err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());