export interface SymbolItem {
  symbol: string;
  name: string;
  category: 'forex' | 'crypto' | 'index' | 'stock' | 'commodity';
}

export const SYMBOLS: SymbolItem[] = [
  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'forex' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'forex' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'forex' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'forex' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'forex' },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', category: 'forex' },
  { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', category: 'forex' },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', category: 'forex' },
  { symbol: 'EURGBP', name: 'Euro / British Pound', category: 'forex' },
  { symbol: 'USDINR', name: 'US Dollar / Indian Rupee', category: 'forex' },

  // Crypto
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'crypto' },
  { symbol: 'XRPUSD', name: 'Ripple / US Dollar', category: 'crypto' },
  { symbol: 'SOLUSD', name: 'Solana / US Dollar', category: 'crypto' },
  { symbol: 'BNBUSD', name: 'Binance Coin / US Dollar', category: 'crypto' },
  { symbol: 'DOGEUSD', name: 'Dogecoin / US Dollar', category: 'crypto' },
  { symbol: 'ADAUSD', name: 'Cardano / US Dollar', category: 'crypto' },

  // Commodities
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'commodity' },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'commodity' },
  { symbol: 'CRUDEOIL', name: 'Crude Oil', category: 'commodity' },
  { symbol: 'NATURALGAS', name: 'Natural Gas', category: 'commodity' },

  // Indian Stocks (Popular)
  { symbol: 'RELIANCE', name: 'Reliance Industries', category: 'stock' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', category: 'stock' },
  { symbol: 'INFY', name: 'Infosys', category: 'stock' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', category: 'stock' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', category: 'stock' },
  { symbol: 'SBIN', name: 'State Bank of India', category: 'stock' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', category: 'stock' },
  { symbol: 'WIPRO', name: 'Wipro', category: 'stock' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', category: 'stock' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', category: 'stock' },
  { symbol: 'ITC', name: 'ITC Limited', category: 'stock' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', category: 'stock' },
  { symbol: 'LT', name: 'Larsen & Toubro', category: 'stock' },
  { symbol: 'AXISBANK', name: 'Axis Bank', category: 'stock' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', category: 'stock' },

  // US Stocks (Popular)
  { symbol: 'AAPL', name: 'Apple Inc', category: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', category: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet (Google)', category: 'stock' },
  { symbol: 'AMZN', name: 'Amazon', category: 'stock' },
  { symbol: 'TSLA', name: 'Tesla', category: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', category: 'stock' },
  { symbol: 'META', name: 'Meta Platforms', category: 'stock' },
  { symbol: 'NFLX', name: 'Netflix', category: 'stock' },

  // Indices
  { symbol: 'NIFTY50', name: 'Nifty 50', category: 'index' },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', category: 'index' },
  { symbol: 'SENSEX', name: 'BSE Sensex', category: 'index' },
  { symbol: 'SPX500', name: 'S&P 500', category: 'index' },
  { symbol: 'NAS100', name: 'Nasdaq 100', category: 'index' },
  { symbol: 'DJI', name: 'Dow Jones', category: 'index' },
];
