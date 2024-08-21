import { estimateExchange } from '../services/estimate.service.js';

export const estimateController = async (req, res) => {
  try {
    const { inputAmount, inputCurrency, outputCurrency } = req.body;

    // Validate input parameters
    if (!inputAmount || !inputCurrency || !outputCurrency) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Call the service to get the best estimate
    const result = await estimateExchange(parseFloat(inputAmount), inputCurrency, outputCurrency);

    // Respond with the result
    return res.json(result);
  } catch (error) {
    console.error('Error in /estimate endpoint:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
