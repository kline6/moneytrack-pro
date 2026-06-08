import { Router } from 'express';
import { uploadAttachment, listAttachments, getAttachment, deleteAttachment } from '../controllers';
import { UPLOAD_DIR } from '../../../infrastructure/storage';
import { appConfig } from '../../../config';

const multer: any = require('multer');
const pathModule: any = require('path');

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, UPLOAD_DIR),
  filename: (_req: any, file: any, cb: any) => {
    const ext = pathModule.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: appConfig.uploadMaxBytes },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('FILE_TYPE_NOT_ALLOWED'));
  }
});

const router = Router();
router.post('/', upload.single('file'), uploadAttachment);
router.get('/transaction/:transactionId', listAttachments);
router.get('/:id', getAttachment);
router.delete('/:id', deleteAttachment);
export const attachmentRoutes = router;
