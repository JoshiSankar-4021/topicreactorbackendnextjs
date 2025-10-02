import multer from 'multer';
import { cloudinary } from '../../lib/cloudinary';
import { pool } from '../../lib/database';
import {cors} from '../../lib/cors';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos allowed'), false);
    }
  },
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
  await cors(req, res);

  try {
    console.log('Handler invoked:', {
      method: req.method,
      action: req.query?.action,
      url: req.url
    });

    console.log('Cloudinary ready:', !!cloudinary.config?.cloud_name);
    console.log('DB pool active:', pool.totalCount > 0 || 'N/A');

    
    const { method } = req;
    const { action } = req.query;

    if (method === 'POST' && action === 'createpost') {
      await runMiddleware(req, res, upload.single('file'));

      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const { caption } = req.body;
      const {userid} = req.query;
      if (!userid || typeof userid !== 'string' || userid.trim() === '') {
        console.log('Invalid or missing userid:', userid);
        return res.status(400).json({ error: 'Valid userid required (as form field)' });
      }

      console.log('Processing upload:', { 
        filename: req.file.originalname, 
        size: req.file.size, 
        userid 
      });

      // Upload to Cloudinary
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            resource_type: 'auto', 
            public_id: `post_${userid}_${Date.now()}`, // Unique ID to avoid collisions
            folder: `media_user/${userid}` // Optional: Organize assets in Cloudinary
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload failed:', error.message);
              reject(error);
            } else {
              console.log('Cloudinary upload success:', result.secure_url);
              resolve(result);
            }
          }
        );
        stream.end(req.file.buffer);
      });

      if (!uploaded?.secure_url) {
        console.error('No secure_url from Cloudinary');
        return res.status(500).json({ error: 'Upload to Cloudinary failed' });
      }

      // Insert into database (added status=1; assumes SERIAL postid)
      console.log('Inserting post into DB...');
      const insertQuery = `
        INSERT INTO "Post" (caption, fileurl, postedby)
        VALUES ($1, $2, $3)
        RETURNING postid
      `;
      const values = [caption.trim(), uploaded.secure_url, userid]; // Trim caption, set status
      const dbResult = await pool.query(insertQuery, values);

      if (!dbResult || !dbResult.rows || !dbResult.rows.length) {
        console.error('DB insert failed - no rows returned');
        return res.status(500).json({ error: 'Failed to save post to database' });
      }

      const postId = dbResult.rows[0].postid;
      console.log('Post created successfully:', postId);

      res.status(201).json({ // 201 for resource created
        message: 'Post created successfully',
        postId,
        url: uploaded.secure_url,
      });

    } else if (method === 'GET' && action === 'fetchimages') {
      console.log('Fetching images/posts from DB...');

      const selectQuery = `
        SELECT p.postid, p.caption, p.fileurl,p.likescount,p.sharecount,p.dislikescount,p.commentscount,u.firstname,u.lastname
        FROM "Post" p
        JOIN "User" u ON p.postedby = u.userid  -- Fixed: No extra space in table name
        WHERE p.status = 1
        ORDER BY p.postid DESC
        LIMIT 50  -- Pagination to prevent overload on large datasets
      `;
      const dbResult = await pool.query(selectQuery);

      if (!dbResult || !dbResult.rows) {
        console.error('DB select failed');
        return res.status(500).json({ error: 'Failed to fetch posts' });
      }

      console.log(`Fetched ${dbResult.rows.length} posts`);
      res.status(200).json({ images: dbResult.rows });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (err) {
    console.error('Handler error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code // e.g., for DB errors
    });

    // In production, hide sensitive details
    const errorMsg = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message;

    res.status(500).json({ error: errorMsg });
  } finally {
    // Ensure response is ended if not already
    if (!res.headersSent) {
      res.end();
    }
  }
}
