import multer from 'multer';
import { cloudinary } from '../../lib/cloudinary'; // Ensure this uses process.env for config
import { pool } from '../../lib/database'; // Ensure this uses process.env.DATABASE_URL
import { cors } from '../../lib/cors'; // Your custom CORS from lib

export const config = {
  api: {
    bodyParser: false, // Required for multipart/form-data
  },
};

// Multer setup with limits and validation for Vercel/serverless (prevents OOM/timeouts)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max to avoid memory issues
  fileFilter: (req, file, cb) => {
    console.log('Multer: Checking file MIME:', file.mimetype);
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      console.error('Multer: Rejected non-media file:', file.mimetype);
      cb(new Error('Only images and videos allowed'), false);
    }
  },
});

// Async wrapper for middleware (e.g., Multer)
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        console.error('Multer middleware error:', result.message);
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
}

export default async function handler(req, res) {
  try {
    console.log('Handler: Started');

    // Apply CORS
    await cors(req, res);
    console.log('Handler: CORS applied');

    // Cloudinary Debug (focused - remove after fixing)
    console.log('=== CLOUINARY DEBUG START ===');
    console.log('Env vars present:', {
      cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: !!process.env.CLOUDINARY_API_KEY,
      apiSecret: !!process.env.CLOUDINARY_API_SECRET,
    });
    console.log('Lib config loaded:', {
      cloud_name: cloudinary.config?.cloud_name || 'MISSING',
      api_key: !!cloudinary.config?.api_key,
      api_secret: !!cloudinary.config?.api_secret,
    });
    const isCloudReady = !!cloudinary.config?.cloud_name && !!cloudinary.config?.api_key && !!cloudinary.config?.api_secret;
    console.log('Cloudinary fully ready:', isCloudReady);
    console.log('=== CLOUINARY DEBUG END ===');

    if (!isCloudReady) {
      console.error('Cloudinary not configured - check env vars in Vercel');
      return res.status(500).json({ error: 'Cloudinary configuration missing - check server logs' });
    }

    console.log('Handler: Invoked with', { method: req.method, action: req.query?.action });

    const { method } = req;
    const { action } = req.query;

    if (method === 'POST' && action === 'createpost') {
      console.log('POST: createpost flow started');

      // Multer parsing
      await runMiddleware(req, res, upload.single('file'));
      console.log('POST: Multer parsing complete');

      if (!req.file) {
        console.log('POST: No file provided');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('POST: File details', {
        name: req.file.originalname,
        mime: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer,
        bufferSize: req.file.buffer ? req.file.buffer.length : 0
      });

      if (!req.file.buffer || req.file.buffer.length === 0) {
        console.error('POST: Empty buffer - cannot upload');
        return res.status(400).json({ error: 'Invalid or empty file' });
      }

      // Extract fields
      const { caption = '' } = req.body;
      let userid = req.body.userid || req.query.userid;
      userid = parseInt(userid, 10); // Ensure int for DB
      console.log('POST: Fields', { caption: caption.trim(), userid });
      if (isNaN(userid)) {
        console.log('POST: Invalid userid');
        return res.status(400).json({ error: 'Valid numeric userid required' });
      }

      // Cloudinary upload (isolated with sub-logs)
      console.log('POST: Starting Cloudinary upload...');
      let uploaded;
      try {
        uploaded = await new Promise((resolve, reject) => {
          console.log('Cloudinary: Creating upload_stream...');
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              public_id: `post_${userid}_${Date.now()}`,
              folder: 'posts'
            },
            (error, result) => {
              console.log('Cloudinary: Callback invoked');
              if (error) {
                console.error('Cloudinary: Callback ERROR -', {
                  message: error.message,
                  http_code: error.http_code || 'N/A',
                  code: error.code || 'N/A',
                  details: error
                });
                reject(error);
              } else {
                console.log('Cloudinary: Callback SUCCESS - URL:', result.secure_url);
                resolve(result);
              }
            }
          );
          console.log('Cloudinary: Stream created, ending with buffer (size:', req.file.buffer.length, ')');
          stream.end(req.file.buffer);
        });
        console.log('Cloudinary: Promise resolved successfully');
      } catch (uploadErr) {
        console.error('Cloudinary: Top-level upload error:', uploadErr.message);
        return res.status(500).json({ error: `Cloudinary upload failed: ${uploadErr.message}` });
      }

      // Alternative non-stream upload (uncomment if stream fails - e.g., for testing)
      /*
      uploaded = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          resource_type: 'auto',
          public_id: `post_${userid}_${Date.now()}`,
          folder: 'posts'
        }
      );
      console.log('Cloudinary: Non-stream upload success:', uploaded.secure_url);
      */

      if (!uploaded?.secure_url) {
        console.error('Cloudinary: No URL returned');
        return res.status(500).json({ error: 'Cloudinary upload did not return a URL' });
      }

      console.log('POST: Cloudinary success, inserting to DB...');

      // DB insert (since other APIs work, this should be fine)
      const insertQuery = `
        INSERT INTO "Post" (caption, fileurl, postedby, status)
        VALUES ($1, $2, $3, $4)
        RETURNING postid
      `;
      const values = [caption.trim(), uploaded.secure_url, userid, 1];
      const dbResult = await pool.query(insertQuery, values);

      if (!dbResult?.rows?.length) {
        console.error('DB: Insert returned no rows');
        return res.status(500).json({ error: 'Failed to save post to database' });
      }

      const postId = dbResult.rows[0].postid;
      console.log('POST: Full success - Post ID:', postId);

      res.status(201).json({
        message: 'Post created successfully',
        postId,
        url: uploaded.secure_url,
      });

    } else if (method === 'GET' && action === 'fetchimages') {
      // Your working GET code (unchanged, minimal logs)
      const selectQuery = `
        SELECT p.postid, p.caption, p.fileurl, u.firstname, u.lastname
        FROM "Post" p
        JOIN "User  " u ON p.postedby = u.userid
        WHERE p.status = 1
        ORDER BY p.postid DESC
        LIMIT 50
      `;
      const dbResult = await pool.query(selectQuery);
      res.status(200).json({ images: dbResult.rows });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (err) {
    console.error('Handler: Top-level ERROR -', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
  } finally {
    if (!res.headersSent) res.end();
  }
}
