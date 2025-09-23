import { pool } from "../../lib/database";

export default async function Comment(req,res){
    const FRONTEND_URL = process.env.FRONTEND_URL;
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const { action } = req.query;

    if (req.method === "OPTIONS") {
    return res.status(200).end();
    }

    if(req.method === "POST"){
        try{
            if(action === "createcomment"){
                const {topicid,comment,commentedby}=req.body;
                const query = `Insert into "Comment" (topicid,comment,commentedby) values($1,$2,$3)`;
                const values=[topicid,comment,commentedby];
                await pool.query(query,values);
                res.status(200).json({message:"Comment Sucessful"})
            }
        }catch(err){
                res.status(400).json({message:err})
        }
    }

    if (req.method === "GET") {
  if (action === "comments_by_commentedby") {
    const { commentedby } = req.query;

    const query = `
      SELECT
        c.commentid,
        c.comment,
        t.topic
      FROM "Comment" c
      JOIN "Topic" t ON c.topicid = t.topicid
      WHERE c.commentedby = $1
      ORDER BY t.topicid ASC, c.commentid ASC
    `;

    const values = [commentedby];
    const result = await pool.query(query, values);

    res.status(200).json({ comments: result.rows });
  }
}

}
