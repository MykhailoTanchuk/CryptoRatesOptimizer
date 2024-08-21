import { getRates } from '../services/rates.service.js';

export const ratesController = async (req, res) => {
  try {
    const { baseCurrency, quoteCurrency } = req.query;

    // Validate that both baseCurrency and quoteCurrency are provided
    if (!baseCurrency || !quoteCurrency) {
      return res.status(400).json({ error: 'Both baseCurrency and quoteCurrency parameters are required.' });
    }

    if(baseCurrency === quoteCurrency) {
      return res.status(400).json({ error: 'baseCurrency and quoteCurrency cannot be the same.' });
    }

    // Call the getRates function
    const rates = await getRates(baseCurrency, quoteCurrency);

    // Check if any of the rates are null (indicative of an invalid pair or an error in fetching)
    const invalidRate = rates.some(rate => rate.rate === null || rate.rate === undefined);

    if (invalidRate) {
      return res.status(400).json({ error: `Invalid trading pair: ${baseCurrency}/${quoteCurrency}. Please check the currencies and try again.` });
    }

    // Respond with the rates
    res.json({ baseCurrency, quoteCurrency, rates });

  } catch (error) {
    console.error(`Error in getRates controller:`, error.message);
    res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
  }
};
