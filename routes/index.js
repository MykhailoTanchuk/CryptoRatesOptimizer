import { Router } from 'express';

import ratesRoutes from './rates.js';

const router = Router();

router.use('/getRates', ratesRoutes);

export default router;
