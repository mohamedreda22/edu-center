import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AppError } from '../errors/AppError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/';
    if (file.fieldname === 'cv') dest += 'teachers/cv';
    else if (file.fieldname === 'certificates') dest += 'teachers/certificates';
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError('نوع الملف غير مسموح به. يسمح فقط بملفات PDF والصور.', 400),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
