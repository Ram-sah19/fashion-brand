import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "voice",
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (
    _req,
    _file,
    callback,
  ) => {
    callback(null, uploadDirectory);
  },

  filename: (
    _req,
    _file,
    callback,
  ) => {
    const filename = `voice-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}.webm`;

    callback(null, filename);
  },
});

const voiceUpload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (
    _req,
    file,
    callback,
  ) => {
    if (
      file.mimetype.startsWith("audio/")
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error(
        "Only audio files are allowed",
      ),
    );
  },
});

export default voiceUpload;