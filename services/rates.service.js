import axios from 'axios';
import { ethers, InfuraProvider } from 'ethers';

async function getBinanceRate(baseCurrency, quoteCurrency) {
  try {
    const symbol = `${baseCurrency}${quoteCurrency}`.toUpperCase();
    const response = await axios.get(`https://api.binance.us/api/v3/ticker/price`, {
      params: { symbol }
    });

    const rate = response.data.price;
    console.log(`The price of 1 ${baseCurrency} in ${quoteCurrency} on Binance is ${rate}`);
    return rate;
  } catch (error) {
    try {
      // If the first pair fails, try the inverse
      const inverseSymbol = `${quoteCurrency}${baseCurrency}`.toUpperCase();
      const inverseResponse = await axios.get(`https://api.binance.us/api/v3/ticker/price`, {
        params: { symbol: inverseSymbol }
      });

      const inverseRate = inverseResponse.data.price;
      const rate = 1 / inverseRate;
      console.log(`The price of 1 ${baseCurrency} in ${quoteCurrency} on Binance is ${rate} (inverse pair used)`);
      return rate.toString();
    } catch (inverseError) {
      console.error(`Error fetching the inverse rate for ${quoteCurrency}/${baseCurrency} on Binance.`);
      console.error(inverseError);
      return null; // Return null if both attempts fail
    }
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
    try {
      // If the first pair fails, try the inverse
      const inverseSymbol = `${quoteCurrency}-${baseCurrency}`.toUpperCase();
      const inverseResponse = await axios.get(`https://api.kucoin.com/api/v1/market/orderbook/level1`, {
        params: { symbol: inverseSymbol }
      });

      const inverseRate = inverseResponse.data.data.price;
      const rate = 1 / inverseRate;
      console.log(`The price of 1 ${baseCurrency} in ${quoteCurrency} on KuCoin is ${rate} (inverse pair used)`);
      return rate.toString();
    } catch (inverseError) {
      console.error(`Error fetching the inverse rate for ${quoteCurrency}/${baseCurrency} on KuCoin.`);
      return null; // Return null if both attempts fail
    }
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

async function getUniswapV2Rate(inputCurrency, outputCurrency) {
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
    console.error(`Error fetching the rate on Uniswap V2:`, error.message);
    throw error;
  }
}

// Uniswap V3 Quoter contract address (mainnet)
const UNISWAP_V3_QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

// ABI for the Uniswap V3 Quoter contract
const UNISWAP_V3_QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)"
];

const uniswapV3Quoter = new ethers.Contract(UNISWAP_V3_QUOTER_ADDRESS, UNISWAP_V3_QUOTER_ABI, provider);

// Function to fetch rate from Uniswap V3
async function getUniswapV3Rate(inputCurrency, outputCurrency, fee = 3000) {
  try {
    const inputToken = tokenData[inputCurrency];
    const outputToken = tokenData[outputCurrency];
    const inputAmount = '1';

    if (!inputToken || !outputToken) {
      throw new Error('Token not found in mapping');
    }

    const amountIn = ethers.parseUnits(inputAmount, inputToken.decimals);
    const amountOut = await uniswapV3Quoter.quoteExactInputSingle(inputToken.address, outputToken.address, fee, amountIn, 0);
    const rate = ethers.formatUnits(amountOut, outputToken.decimals);
    console.log(`The price of 1 ${inputCurrency} in ${outputCurrency} on Uniswap V3 is ${rate}`);
    return rate;
  } catch (error) {
    console.error(`Error fetching the rate on Uniswap V3:`, error.message);
    throw error;
  }
}

async function getRates(baseCurrency, quoteCurrency) {
  baseCurrency = baseCurrency.toUpperCase();
  quoteCurrency = quoteCurrency.toUpperCase();

  // Fetch rates
  const [binanceRate, kucoinRate, uniswapV2Rate, uniswapV3Rate] = await Promise.all([
    getBinanceRate(baseCurrency, quoteCurrency),
    getKuCoinRate(baseCurrency, quoteCurrency),
    getUniswapV2Rate(baseCurrency, quoteCurrency),
    getUniswapV3Rate(baseCurrency, quoteCurrency),
  ]);

  // Construct the response
  const response = [
    { exchangeName: 'binance', rate: binanceRate },
    { exchangeName: 'kucoin', rate: kucoinRate },
    { exchangeName: 'uniswapV2', rate: uniswapV2Rate },
    { exchangeName: 'uniswapV3', rate: uniswapV3Rate },
  ];

  return response;
}

export { getRates };
