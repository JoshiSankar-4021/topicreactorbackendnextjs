import { pool } from "../../lib/database";
async function User(req, res) {
const FRONTEND_URL = process.env.FRONTEND_URL;

res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if(req.method === "OPTIONS") {
return res.status(200).end(); // handle preflight
}

const action = req.query.action;

if(req.method === "POST") {
if(action === "registeruser") {
    const { firstname, lastname, email, password, address, education, phone, gender } = req.body;
    const query = `INSERT INTO "User" (firstname, lastname, email, password, address, education, phone, gender)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`;
    const values = [firstname, lastname, email, password, address, education, phone, gender];

    try {
    await pool.query(query, values);
    return res.status(200).json({ message: "Registration Successful" });
    } catch(err) {
    console.error("DB Insert Error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
    }
}

if(action === "login") {
    const { email, password } = req.body;
    const query = `SELECT "userid" FROM "User" WHERE email=$1 AND password=$2 AND status=1`;
    const values = [email, password];

    try {
    const result = await pool.query(query, values);
    if(result.rows.length > 0) {
        return res.status(200).json({ message: "Login successful", userid: result.rows[0].userid });
    } else {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    } catch(err) {
    console.error("DB Login Error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
    }
}

// If unknown action
return res.status(400).json({ message: "Invalid POST action" });
}

if(req.method === "GET") {
if(action === "geteducation") {
    try {
    const result = await pool.query(`SELECT * FROM "Education"`);
    return res.status(200).json({ data: result.rows });
    } catch(err) {
    console.error("DB Fetch Education Error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
    }
}

return res.status(400).json({ message: "Invalid GET action" });
}

// If unknown method
return res.status(405).json({ message: "Method not allowed" });
}

export default User;
