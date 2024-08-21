import { Router } from 'express';

import { ratesController } from '../controllers/rates.controller.js';

const router = Router();

router.route('/').get(ratesController);

export default router;
