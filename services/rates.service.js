import axios from 'axios';
import { ethers, InfuraProvider } from 'ethers';

async function getBinanceRate(baseCurrency, quoteCurrency) {
  try {
    const symbol = `${baseCurrency}${quoteCurrency}`.toUpperCase();
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price`, {
      params: { symbol }
    });

    const rate = response.data.price;
    console.log(`The price of 1 ${baseCurrency} in ${quoteCurrency} on Binance is ${rate}`);
    return rate;
  } catch (error) {
    console.error(`Error fetching the rate for ${baseCurrency}/${quoteCurrency} on Binance:`);
  }
}

async function getKuCoinRate(baseCurrency, quoteCurrency) {
  try {
    const symbol = `${baseCurrency}-${quoteCurrency}`.toUpperCase();
    const response = await axios.get(`https://api.kucoin.com/api/v1/market/orderbook/level1`, {
      params: { symbol }
    });

    const rate = response.data.data.price;
    console.log(`The price of 1 ${baseCurrency} in ${quoteCurrency} on KuCoin is ${rate}`);
    return rate;
  } catch (error) {
    console.error(`Error fetching the rate for ${baseCurrency}/${quoteCurrency} on KuCoin:`);
  }
}


// Uniswap V2 Router contract address (mainnet)
const UNISWAP_V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

// ABI for the Uniswap V2 Router contract, focusing on the `getAmountsOut` function
const UNISWAP_V2_ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts)"
];

const provider = new InfuraProvider();

// Create a contract instance
const uniswapRouter = new ethers.Contract(UNISWAP_V2_ROUTER_ADDRESS, UNISWAP_V2_ROUTER_ABI, provider);

// Token mapping
const tokenData = {
  BTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
  ETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
  USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
};

async function getUniswapRate(inputCurrency, outputCurrency) {
  try {
    // Fetch token details
    const inputToken = tokenData[inputCurrency];
    const outputToken = tokenData[outputCurrency];
    const inputAmount = '1';

    if (!inputToken || !outputToken) {
      throw new Error('Token not found in mapping');
    }

    // Define the path of the trade: input -> output
    const path = [inputToken.address, outputToken.address];

    // Parse input amount considering the decimals of the input token
    const amountIn = ethers.parseUnits(inputAmount, inputToken.decimals);

    // Call getAmountsOut to get the output amount
    const amounts = await uniswapRouter.getAmountsOut(amountIn, path);

    // Format the output considering the decimals of the output token
    const rate = ethers.formatUnits(amounts[1], outputToken.decimals);
    console.log(`The price of 1 ${inputCurrency} in ${outputCurrency} on Uniswap is ${rate}`);
    return rate;
  } catch (error) {
    console.error(`Error fetching the rate on Uniswap:`, error.message);
    throw error;
  }
}

async function getRates(baseCurrency, quoteCurrency) {
  baseCurrency = baseCurrency.toUpperCase();
  quoteCurrency = quoteCurrency.toUpperCase();

  // Fetch rates
  const [binanceRate, kucoinRate, uniswapRate] = await Promise.all([
    getBinanceRate(baseCurrency, quoteCurrency),
    getKuCoinRate(baseCurrency, quoteCurrency),
    getUniswapRate(baseCurrency, quoteCurrency),
  ]);

  // Construct the response
  const response = [
    { exchangeName: 'binance', rate: binanceRate },
    { exchangeName: 'kucoin', rate: kucoinRate },
    { exchangeName: 'uniswap', rate: uniswapRate },
  ];

  return response;
}

export { getRates };
