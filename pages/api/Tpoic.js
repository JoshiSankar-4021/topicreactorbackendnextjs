import { pool } from "../../lib/database";

export default async function handler(req, res) {
  const FRONTEND_URL = process.env.FRONTEND_URL;
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const { action } = req.query;

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
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
