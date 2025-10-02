import multer from 'multer';
import { cloudinary } from '../../lib/cloudinary';
import { pool } from '../../lib/database';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

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
    console.log('Handler started:', { method: req.method, action: req.query.action });

    const { method } = req;
    const { action } = req.query;

    if (method === 'POST' && action === 'createpost') {
      await runMiddleware(req, res, upload.single('file'));

      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { caption } = req.body; // userid from body (multipart field)
      // Fallback if sent as query: const userid = req.body.userid || req.query.userid;
      const {userid}=req.query;
      if (!userid) {
        console.log('Missing userid');
        return res.status(400).json({ error: 'Missing userid' });
      }

      console.log('Uploading to Cloudinary...');
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', public_id: `post_${Date.now()}` },
          (error, result) => {
            if (error) {
              console.error('Cloudinary error:', error);
              reject(error);
            } else {
              console.log('Cloudinary success:', result.secure_url);
              resolve(result);
            }
          }
        );
        stream.end(req.file.buffer);
      });

      console.log('Inserting to DB...');
      const insertQuery = `
        INSERT INTO "Post" (caption, fileurl, postedby)
        VALUES ($1, $2, $3)
        RETURNING postid
      `;
      const values = [caption || '', uploaded.secure_url, userid];
      const result = await pool.query(insertQuery, values);
      const postId = result.rows[0].postid;

      console.log('Post created:', postId);
      res.status(200).json({
        message: 'Post created successfully',
        postId,
        url: uploaded.secure_url,
      });
    } else if (method === 'GET' && action === 'fetchimages') {
      console.log('Fetching posts...');
      const result = await pool.query(`
        SELECT p.postid, p.caption, p.fileurl, u.firstname, u.lastname
        FROM "Post" p
        JOIN "User " u ON p.postedby = u.userid
        WHERE p.status = 1
        ORDER BY p.postid DESC
      `);
      console.log('Fetched posts:', result.rows.length);
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
