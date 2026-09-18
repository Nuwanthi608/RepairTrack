const bcrypt = require("bcryptjs");
const db = require("../config/db");

// අකුරු 10ක්, capital එකක්, simple එකක්, ඉලක්කමක් අනිවාර්යයි
function checkPassword(password) {
  const problems = [];
  if (password.length < 10) problems.push("at least 10 characters");
  if (!/[A-Z]/.test(password)) problems.push("one uppercase letter");
  if (!/[a-z]/.test(password)) problems.push("one lowercase letter");
  if (!/[0-9]/.test(password)) problems.push("one number");
  return problems;
}

async function main() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.log('Usage: node scripts/createUser.js "Shop Owner" owner@example.com YourPassword');
    process.exit(1);
  }

  const problems = checkPassword(password);
  if (problems.length) {
    console.log("Password must have " + problems.join(", ") + ".");
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