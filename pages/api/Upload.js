import { upload } from "../../lib/cloudinary";
import { cors } from "../../lib/cors";
import {pool} from "../../lib/database";

export const config = {
  api: { bodyParser: false }, // Crucial for Multer
};

function uploadFile(req, res) {
  return new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) return reject(err);
      if (!req.file) return reject(new Error("No file uploaded"));
      resolve(req.file);
    });
  });
}

export default async function handler(req, res) {
  const handled = cors(req, res);
  if (handled) return;

  const action = req.query.action;
  if (req.method === "POST"){

    if(action === "createpost")
    {
  try {
    const file = await uploadFile(req, res);
    const { caption } = req.body;
    const {userid} = req.query;
    const fileurl=file.path;
    const insertquery=`INSERT INTO "Post" (caption,fileurl,postedby) values($1,$2,$3)`;
    const values=[caption,fileurl,userid];
    await pool.query(insertquery,values);
    res.status(200).json({
      message: "File uploaded successfully",
      file: {
        path: file.path,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      caption,
      userid,
    });
  } catch (err) {
    console.error("Safe Upload Error:", err);
    res.status(400).json({ error: err.message });
  }
}
}
if(req.method === "GET"){
  if(action === "fetchimages"){
    const selectquery = `SELECT
        p.postid,
        p.caption,
        p.fileurl,
        p.likescount,
        p.sharecount,
        p.commentscount,
        p.dislikescount,
        u.firstname,
        u.lastname
      FROM "Post" p
      INNER JOIN "User" u ON p.postedby = u.userid
      WHERE p.status = $1
      ORDER BY p.postid DESC`;
    const values=[1];
    const result =await pool.query(selectquery,values);
    res.status(200).json({images:result.rows});
  }
}
}
