import { pool } from "../../lib/database";
import {cors} from "../../lib/cors";
async function User(req, res) {

const handled = cors(req, res);
if (handled) return;
const action = req.query.action;
const method=req.method;
if(method === "POST") {
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
    const query = `SELECT "userid" FROM "User" WHERE email=$1 AND password=$2 AND status=$3`;
    const values = [email, password,1];

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
        const query = `SELECT u.userid, u.firstname, u.lastname, u.email
                FROM "User" u 
                ORDER BY u.userid ASC`;
        const result = await pool.query(query);
        if(result.rowCount>0){ 
            return res.status(200).json({users:result.rows});
        }else{
            return res.status(400).json("NO USERS FOUND");
        }
    }

return res.status(400).json({ message: "Invalid GET action" });
}

if(req.method === "DELETE"){
    if(action === "delete_user"){
        const {userid} = req.query;
        
        const values = [0,parseInt(userid)];
        
        //DELETE User
        const deleteuserquery = `UPDATE "User" SET status=$1 WHERE userid=$2`;
        await pool.query(deleteuserquery,values);

        // //DELETE Topics
        const deletetopics = `UPDATE "Topic" SET status=$1 WHERE createdby=$2`;
        await pool.query(deletetopics,values);

        //DELETE Comments
        const userIdInt =parseInt(userid)
        const valuearr=[0,userIdInt]
        const deleteCommentsQuery = `UPDATE "Comment" SET status = $1 WHERE topicid IN (SELECT topicid FROM "Topic" WHERE commentedby=$2)`;
        await pool.query(deleteCommentsQuery,valuearr);

        res.status(200).json({message:"Deleted User"})
    }
}

    if(req.method === "PUT"){
        if(action === "update_profile"){
            const {userid} = req.query;
            const {firstname,lastname,email,address,education,phone,gender} = req.body;
            const updatequery = `UPDATE "User" SET firstname=$1,lastname=$2,email=$3,address=$4,education=$5,phone=$6,gender=$7 where userid=$8`;
            const values=[firstname,lastname,email,address,education,phone,gender,userid];
            await pool.query(updatequery,values);
            res.status(200).json({message:"User details Updated"});
        }
    }

return res.status(405).json({ message: "Method not allowed" });
}

export default User;
