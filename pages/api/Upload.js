import multer from "multer";
import { cloudinary } from "../../lib/cloudinary"; // your configured Cloudinary
import { cors } from "../../lib/cors";
import { pool } from "../../lib/database";

export const config = {
  api: { bodyParser: false }, // Disable Next.js body parser
};

// Multer with memory storage (needed for Vercel)
const upload = multer({ storage: multer.memoryStorage() });

// Helper to promisify multer upload
function uploadSingle(req, res, fieldName) {
  return new Promise((resolve, reject) => {
    const uploadMiddleware = upload.single(fieldName);
    uploadMiddleware(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default async function handler(req, res) {
  if (cors(req, res)) return; // Handle CORS

  const action = req.query.action;
  console.log("👉 Incoming request:", req.method, "action:", action);

  // ------------------ POST: Create Post ------------------
  if (req.method === "POST" && action === "createpost") {
    try {
      // Use multer to handle file upload
      await uploadSingle(req, res, "file");

      // Log to verify
      console.log("req.file:", req.file);
      console.log("req.body:", req.body);

      if (!req.file) {
        throw new Error("File not received");
      }

      // Extract fields from req.body
      const { caption } = req.body || {};
      const { userid } = req.query;

      if (!userid) {
        throw new Error("No userid provided");
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", public_id: `post_${Date.now()}` },
          (err, result) => {
            if (err) {
              console.error("❌ Cloudinary upload error:", err);
              reject(err);
            } else {
              console.log("✅ Cloudinary upload success:", result.secure_url);
              resolve(result);
            }
          }
        );
        stream.end(req.file.buffer);
      });

      // Insert post data into database
      const insertQuery = `
        INSERT INTO "Post" (caption, fileurl, postedby)
        VALUES ($1, $2, $3) RETURNING postid
      `;
      const values = [caption || "", result.secure_url, userid];

      const dbResult = await pool.query(insertQuery, values);
      console.log("✅ Database insert success. PostID:", dbResult.rows[0].postid);

      res.status(200).json({
        message: "File uploaded successfully",
        file: {
          url: result.secure_url,
          originalname: req.file.originalname,
        },
        postid: dbResult.rows[0].postid,
      });
    } catch (err) {
      console.error("❌ Upload Error:", err.message, err.stack);
      res.status(500).json({ error: err.message });
    }
  }

  // ------------------ GET: Fetch Images ------------------
  if (req.method === "GET" && action === "fetchimages") {
    try {
      console.log("📌 Fetching images from DB...");
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
      console.log("✅ Fetched", result.rows.length, "images");
      res.status(200).json({ images: result.rows });
    } catch (err) {
      console.error("❌ Fetch Images Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
}