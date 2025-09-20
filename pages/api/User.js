import { pool } from "../../lib/database";
async function User(req,res){
    const action = req.query.action;
    if(req.method==="POST"){
        if(action==="registeruser"){
            const {name,email,password,address,education,phone,gender}=req.body;
            const query=`Insert into "User" (name,email,password,address,education,phone,gender)
            values($1,$2,$3,$4,$5,$6,$7)`;
            const values=[name,email,password,address,education,phone,gender];
            await pool.query(query,values)
            res.status(200).json({message:"Registration Sucessful"})
        }

        if(action==="login"){
            const{email,password}=req.body;
            const query=`select "userid" from "User" where email=$1 and password=$2 and status=1`;
            const values=[email,password];
            const result=await pool.query(query,values);
            res.status(200).json({ message: "Login successful", userId: result.rows[0].userid });
        }
    }
}
export default User;