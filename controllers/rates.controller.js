import { getHealthcheckMsg } from '../services/rates.service.js';

export const ratesController = (_, res) => {
  const response = getHealthcheckMsg();

  res.send(response);
};
