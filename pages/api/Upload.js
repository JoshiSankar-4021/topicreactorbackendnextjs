// pages/api/Upload.js
import multer from "multer";
import { cloudinary } from "../../lib/cloudinary"; // config already in lib
import { cors } from "../../lib/cors";
import { pool } from "../../lib/database";

export const config = {
  api: { bodyParser: false }, // disable default parser
};

// Multer memory storage (works in Vercel)
const upload = multer({ storage: multer.memoryStorage() });

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query.action;

  try {
    // -------------- POST: CREATE POST ----------------
    if (req.method === "POST" && action === "createpost") {
      // 1. Parse file
      const file = await new Promise((resolve, reject) => {
        upload.single("file")(req, res, (err) => {
          if (err) return reject(err);
          if (!req.file) return reject(new Error("❌ No file uploaded"));
          resolve(req.file);
        });
      });

      console.log("📂 Received file:", file.originalname, file.mimetype);

      // 2. Upload to Cloudinary
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

      console.log("☁️ Cloudinary Upload:", result.secure_url);

      // 3. Save to DB
      const { caption } = req.body || {};
      const { userid } = req.query || {};
      const insertQuery = `
        INSERT INTO "Post" (caption, fileurl, postedby)
        VALUES ($1, $2, $3) RETURNING postid
      `;
      const values = [caption, result.secure_url, userid];
      const dbResult = await pool.query(insertQuery, values);

      return res.status(200).json({
        message: "✅ File uploaded successfully",
        file: { url: result.secure_url, originalname: file.originalname },
        postid: dbResult.rows[0].postid,
      });
    }

    // -------------- GET: FETCH POSTS ----------------
    if (req.method === "GET" && action === "fetchimages") {
      const selectQuery = `
        SELECT p.postid, p.caption, p.fileurl, p.likescount, p.sharecount, p.commentscount,
               u.firstname, u.lastname
        FROM "Post" p
        INNER JOIN "User" u ON p.postedby = u.userid
        WHERE p.status = $1
        ORDER BY p.postid DESC
      `;
      const result = await pool.query(selectQuery, [1]);
      return res.status(200).json({ images: result.rows });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
