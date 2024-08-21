import { Router } from 'express';
import { estimateController } from '../controllers/estimate.controller.js';

const router = Router();

router.route('/').get(estimateController);

export default router;
