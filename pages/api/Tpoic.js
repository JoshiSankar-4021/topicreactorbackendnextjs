import { pool } from "../../lib/database";
async function Topic(req,res){
    const action=req.query.action;
    if(req.method === "POST"){
        if(action==="createtopic"){
            const {topic,reason,createdby}=req.body;
            const query=`INSERT INTO "Topic" (topic,reason,createdby) values($1,$2,$3)`;
            const values=[topic,reason,createdby];
            await pool.query(query,values)
            res.status(200).json({message:"Topic Posted"})
        }
    }
}
export default Topic;