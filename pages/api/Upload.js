import multer from "multer";
import { cloudinary } from "../../lib/cloudinary"; // your configured Cloudinary
import { cors } from "../../lib/cors";
import { pool } from "../../lib/database";

export const config = {
  api: { bodyParser: false }, // required for multer
};

// 1️⃣ Multer memory storage (works on Vercel)
const upload = multer({ storage: multer.memoryStorage() });

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query.action;

  // ------------------ POST: Create Post ------------------
  if (req.method === "POST") {
    if(action === "createpost"){

    
    try {
      // Upload file to memory
      const file = await new Promise((resolve, reject) => {
        upload.single("file")(req, res, (err) => {
          if (err) return reject(err);
          if (!req.file) return reject(new Error("No file uploaded"));
          resolve(req.file);
        });
      });

      const { caption } = req.body;
      const { userid } = req.query;

      // Upload directly to Cloudinary from memory buffer
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", public_id: `post_${Date.now()}` },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      // Insert post into database
      const insertQuery = `
        INSERT INTO "Post" (caption, fileurl, postedby)
        VALUES ($1, $2, $3) RETURNING postid
      `;
      const values = [caption, result.secure_url, userid];
      const dbResult = await pool.query(insertQuery, values);

      res.status(200).json({
        message: "File uploaded successfully",
        file: { url: result.secure_url, originalname: file.originalname },
        postid: dbResult.rows[0].postid,
      });
    
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
  }

  // ------------------ GET: Fetch Posts ------------------
  if (req.method === "GET" && action === "fetchimages") {
    try {
      const selectQuery = `
        SELECT p.postid, p.caption, p.fileurl, p.likescount, p.sharecount, p.commentscount,
               u.firstname, u.lastname
        FROM "Post" p
        INNER JOIN "User" u ON p.postedby = u.userid
        WHERE p.status = $1
        ORDER BY p.postid DESC
      `;
      const values = [1];
      const result = await pool.query(selectQuery, values);
      res.status(200).json({ images: result.rows });
    } catch (err) {
      console.error("Fetch Images Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
}
