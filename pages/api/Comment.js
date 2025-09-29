import { pool } from "../../lib/database";
import {cors} from "../../lib/cors";

export default async function Comment(req,res){
    const handled = cors(req, res);
    if (handled) return;
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
          WHERE c.commentedby = $1 and c.status=1
          ORDER BY t.topicid ASC, c.commentid ASC
        `;
        const values = [commentedby];
        const result = await pool.query(query, values);
        res.status(200).json({ comments: result.rows });
      }
    }

      if(req.method === "DELETE"){
          if (action === "deleteby_comment_id") {
          const { commentid } = req.query;
          const values = [0, commentid];
          const deletecommentquery = `UPDATE "Comment" SET status=$1 WHERE commentid=$2`;
          await pool.query(deletecommentquery, values);
          res.status(200).json({ message: "Comment Deleted" });
        }
      }

      if(req.method === "PUT"){
        if(action === "updatecomment"){
          const {commentid} = req.query;
          const {comment} = req.body;
          const values =[commentid,comment];
          const updatecomment = `update "Comment" set comment=$2 where commentid=$1 `;
          await pool.query(updatecomment,values);
          res.status(200).json({message:"Updated Comment"})
        }
      }
}
