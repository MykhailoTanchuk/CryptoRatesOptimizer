import { getRates } from './rates.service.js'; // Assuming getRates is in the same directory

async function estimateExchange(inputAmount, inputCurrency, outputCurrency) {
  try {
    // Fetch the rates from the exchanges
    const rates = await getRates(inputCurrency, outputCurrency);

    if (!rates || rates.length === 0) {
      throw new Error('No exchange rates available');
    }

    // Calculate the output amounts for each exchange
    const estimates = rates.map(rateInfo => {
      const outputAmount = inputAmount * rateInfo.rate;
      return {
        exchangeName: rateInfo.exchangeName,
        outputAmount: parseFloat(outputAmount.toFixed(6)), // Limit to 6 decimal places
      };
    });

    // Find the best estimate (highest outputAmount)
    const bestEstimate = estimates.reduce((prev, current) =>
      (prev.outputAmount > current.outputAmount) ? prev : current
    );

    return bestEstimate;
  } catch (error) {
    console.error('Error in estimateExchange service:', error.message);
    throw error;
  }
}

export { estimateExchange };
