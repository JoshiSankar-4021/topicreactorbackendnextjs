import { pool } from "../../lib/database";

export default async function handler(req, res) {
  const FRONTEND_URL = process.env.FRONTEND_URL;
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { action } = req.query;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    if (action === "createtopic") {
      const { topic, reason, createdby } = req.body;
      try {
        await pool.query(
          `INSERT INTO "Topic" (topic, reason, createdby) VALUES ($1, $2, $3)`,
          [topic, reason, createdby]
        );
        return res.status(200).json({ message: "Topic Posted" });
      } catch (err) {
        console.error("Error inserting topic:", err);
        return res.status(500).json({ message: "Error posting topic" });
      }
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
      }
      if (req.method === "GET") {
      if (action === "getalltopics") {
        try {
          const selectquery = `
            SELECT 
              t.topicid,
              t.topic,
              t.reason,
              COALESCE(json_agg(c.comment) FILTER (WHERE c.comment IS NOT NULL), '[]') AS comments
            FROM "Topic" t
            LEFT JOIN "Comment" c ON t.topicid = c.topicid
            GROUP BY t.topicid, t.topic, t.reason
            ORDER BY t.topicid DESC;
          `;
          const result = await pool.query(selectquery);
          res.status(200).json({ topics: result.rows });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Failed to fetch Topics" });
        }

      }
      if(action === "gettopicbyuserid"){
          const {createdby}=req.query;
          const selectquery = `select t.topicid,t.topic,t.reason from "Topic" t where createdby=$1`;
          const values=[createdby];
          const result = await pool.query(selectquery,values);
          res.status(200).json({topics:result.rows});
        }
      else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
}