import multer from 'multer';
import { cloudinary } from '../../lib/cloudinary'; // your cloudinary config
import { pool } from '../../lib/database';

export const config = {
  api: {
    bodyParser: false, // disable Next.js default parser
  },
};

// Set up multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Wrap multer middleware in a promise for async/await
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}

export default async function handler(req, res) {
  try {
    // Handle CORS if needed
    // if (cors(req, res)) return; // Uncomment if you have CORS middleware

    // Check method and action
    const { method } = req;
    const { action } = req.query;

    if (method === 'POST' && action === 'createpost') {
      // Run multer middleware to parse multipart/form-data
      await runMiddleware(req, res, upload.single('file'));

      // Verify file exists
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Get additional data
      const { caption } = req.body;
      const { userid } = req.query;

      if (!userid) {
        return res.status(400).json({ error: 'Missing userid' });
      }

      // Upload to Cloudinary
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', public_id: `post_${Date.now()}` },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      // Insert into database
      const insertQuery = `
        INSERT INTO "Post" (caption, fileurl, postedby)
        VALUES ($1, $2, $3)
        RETURNING postid
      `;
      const values = [caption || '', uploaded.secure_url, userid];
      const result = await pool.query(insertQuery, values);
      const postId = result.rows[0].postid;

      // Respond success
      res.status(200).json({
        message: 'Post created successfully',
        postId,
        url: uploaded.secure_url,
      });
    } else if (method === 'GET' && action === 'fetchimages') {
      const result = await pool.query(`
        SELECT p.postid, p.caption, p.fileurl, u.firstname, u.lastname
        FROM "Post" p
        JOIN "User" u ON p.postedby = u.userid
        WHERE p.status = 1
        ORDER BY p.postid DESC
      `);
      res.status(200).json({ images: result.rows });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    console.error('Error in handler:', err);
    res.status(500).json({ error: err.message });
  }
}