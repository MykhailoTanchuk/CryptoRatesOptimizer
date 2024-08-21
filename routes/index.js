import { Router } from 'express';

import ratesRoutes from './rates.js';
import estimateRoutes from './estimate.js';

const router = Router();

router.use('/getRates', ratesRoutes);
router.use('/estimate', estimateRoutes);

export default router;
