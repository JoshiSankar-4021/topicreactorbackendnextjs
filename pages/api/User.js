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

if(action==="getprofile"){
    try{
    const { userid } = req.query;
    const query=`SELECT * FROM "User" where userid=$1`;
    const values=[userid];
    const result = await pool.query(query,values);
    if(result.rowCount===1){
        return res.status(200).json({ data: result.rows[0] });
    }else{
        return res.status(400).json("User Not Found");
    }
    }catch(err){
    console.error("DB Fetch Education Error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
    }

}

    if(action === "getallusers"){
        const query = `SELECT u.userid,u.firstname,u.lastname,u.email  FROM "User" u`
        const result = await pool.query(query);
        if(result.rowCount>0){
            return res.status(200).json({users:result.rows});
        }else{
            return res.status(400).json("NO USERS FOUND");
        }
    }

return res.status(400).json({ message: "Invalid GET action" });
}

if (req.method === "PUT") {
if (action === "updateprofile") {
const { userid } = req.query;
const {
    firstname,
    lastname,
    email,
    password,
    retypepassword,
    address,
    gender,
    phone,
    education
} = req.body;

// Build dynamic query to update only provided fields
let fields = [];
let values = [];
let idx = 1;

if (firstname !== undefined) { fields.push(`firstname=$${idx++}`); values.push(firstname); }
if (lastname !== undefined) { fields.push(`lastname=$${idx++}`); values.push(lastname); }
if (email !== undefined) { fields.push(`email=$${idx++}`); values.push(email); }
if (password !== undefined) { fields.push(`password=$${idx++}`); values.push(password); }
if (retypepassword !== undefined) { fields.push(`retypepassword=$${idx++}`); values.push(retypepassword); }
if (address !== undefined) { fields.push(`address=$${idx++}`); values.push(address); }
if (gender !== undefined) { fields.push(`gender=$${idx++}`); values.push(gender); }
if (phone !== undefined) { fields.push(`phone=$${idx++}`); values.push(phone); }
if (education !== undefined) { fields.push(`education=$${idx++}`); values.push(education); }

if (fields.length === 0) {
    return res.status(400).json({ message: "No fields to update" });
}

const query = `UPDATE "User" SET ${fields.join(", ")} WHERE userid=$${idx}`;
values.push(userid);

try {
    const result = await pool.query(query, values);
    return res.status(200).json({ message: "Profile updated", data: result.rows[0] });
} catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error updating profile" });
}
}
}

// If unknown method
return res.status(405).json({ message: "Method not allowed" });
}

export default User;
