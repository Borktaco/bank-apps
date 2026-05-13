import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Plus, Pencil, Trash2, X, Check, AlertTriangle, ChevronDown, ChevronRight, Wallet, Newspaper, TrendingUp, LineChart as LineIcon, Wand2, Copy, RotateCcw, Info, Calendar, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';

// ============================================================
// === LIVE DATA SNAPSHOT · CLAUDE EDIT ZONE ===
// === Updated weekly. Last refresh: 2026-05-11 ===
// ============================================================
const SNAPSHOT = {
  refreshedAt: '2026-05-11',
  refreshedBy: 'Claude · weekly rebuild',

  // === MACRO READINGS ===
  macro: {
    fearGreed: { value: 49, label: 'Neutral', source: 'feargreedmeter.com' },
    cbbi: { value: 51, label: 'Mid-cycle', source: 'cbbi.info' },
    fedFundsUpper: 3.75,
    fedFundsLower: 3.50,
    nextFOMC: '2026-06-17',
    treasury10Y: 4.39,
    treasury30Y: 5.02,
    dxy: 99.4,
    cpiYoY: 3.3, // March 2026 print, April releases May 12
    cpiYoYExpected: 3.7,
    unemployment: 4.3,
    nonfarmPayrolls: 115000,
    btcDominance: 60.6,
    btcAth: 126198,
    btcAthDate: '2025-10-06',
    btcDrawdownFromAth: -35.8,
  },

  // === ETF FLOWS ===
  etf: {
    weeklyNetInflow: 153.87, // millions, week ending May 1
    cumulativeNetInflow: 58.72, // billions since Jan 2024
    streakWeeks: 5,
    monthYTD: 'May running positive',
    blackrockIBIT: 812000, // BTC held
    note: 'Five consecutive weeks of inflows. April was strongest month of 2026 at +$2.44B.',
  },

  // === POLYMARKET ODDS ===
  polymarket: [
    {
      question: 'BTC new ATH in 2026?',
      yesOdds: 19,
      noOdds: 81,
      volume: '$36.1M',
      note: 'Down from 39% at year start. Crowd losing conviction.',
    },
    {
      question: 'BTC hits $150K by Dec 31, 2026',
      yesOdds: 10,
      noOdds: 90,
      volume: '$18.4M',
      note: 'Standard Chartered just lowered year-end target $150K to $100K.',
    },
    {
      question: 'Recession in 2026?',
      yesOdds: 28,
      noOdds: 72,
      volume: 'mixed',
      note: 'Jobs report softened concern. Iran war keeps tail risk alive.',
    },
  ],

  // === IMPACTFUL NEWS HEADLINES ===
  // Each tagged with impact: bullish | bearish | neutral
  news: [
    {
      headline: 'BTC ETFs log 5-week inflow streak, BlackRock IBIT now holds ~812K BTC',
      source: 'Phemex / SoSoValue',
      date: '2026-05-04',
      impact: 'bullish',
      thesisNote: 'Structural demand sink. Weekly ETF buys equal 33-44 days of mining output. Supply shock thesis still intact.',
    },
    {
      headline: 'Strait of Hormuz crisis enters month 3, oil above $120, BTC outperforming gold and S&P',
      source: 'Invezz / IEA',
      date: '2026-04-30',
      impact: 'bullish',
      thesisNote: 'Bitcoin as monetary hedge thesis tested in real-time and holding. Risk: fast de-escalation unwinds it.',
    },
    {
      headline: 'Iran codifies crypto-tolls on Hormuz tankers, accepting BTC and stablecoins as payment',
      source: 'Coindesk / Chainalysis',
      date: '2026-04-09',
      impact: 'neutral',
      thesisNote: 'State-level BTC adoption, but for sanctions evasion. Bullish for use case, bearish if it triggers US response.',
    },
    {
      headline: 'Polymarket BTC ATH-2026 odds fall to 19% from 39% start of year',
      source: 'Benzinga',
      date: '2026-05-10',
      impact: 'bearish',
      thesisNote: 'Real-money sentiment cooling. Standard Chartered cut target $150K to $100K. Citigroup at $112K.',
    },
    {
      headline: 'Fed holds at 3.50-3.75% for third straight meeting, 4 dissenters first time since 1992',
      source: 'Federal Reserve / TradingEconomics',
      date: '2026-04-29',
      impact: 'neutral',
      thesisNote: 'Committee fracturing. Hawks worried about inflation, doves about jobs. Next decision June 17.',
    },
    {
      headline: 'April jobs: 115K added, unemployment 4.3%, participation lowest since 2021',
      source: 'BLS',
      date: '2026-05-08',
      impact: 'neutral',
      thesisNote: 'Labor market frozen but not collapsing. Healthcare carries 100% of gains. Fed cover for delaying cuts.',
    },
  ],

  // === THESIS HEALTH INPUTS ===
  // Each scored 0-100. Average becomes the headline meter.
  thesisHealth: {
    powerLawPosition: {
      score: 78,
      reason: 'BTC at $81K vs PL fair value ~$120K. Trading at 67% of fair. Buy-zone signal.',
    },
    cyclePhase: {
      score: 62,
      reason: '~25 months post-2024 halving. ~24 months to next. Mid-cycle, neither too early nor late.',
    },
    macroLiquidity: {
      score: 38,
      reason: 'Fed paused, 10Y at 4.39%, 30Y at 5%. Tight conditions. CPI ticking up on oil shock.',
    },
    sentimentContrarian: {
      score: 51,
      reason: 'Fear & Greed at 49 (neutral). CBBI at 51. Not euphoric, not fearful. No edge from sentiment.',
    },
    trendStructure: {
      score: 65,
      reason: 'BTC reclaiming $80K, 5-week ETF inflow streak, whales net-bought 270K BTC in 30 days.',
    },
  },

  // === INVALIDATION TRIGGERS ===
  invalidations: [
    { trigger: 'BTC closes below 200-week SMA for 2+ weeks', status: 'safe', current: '$80K vs 200W SMA est. $58K' },
    { trigger: 'ETF net flows turn negative for 30+ days', status: 'safe', current: '5-week inflow streak' },
    { trigger: 'Power Law model breaks downward', status: 'safe', current: 'Trading at 67% of PL fair value' },
    { trigger: 'CPI breaks above 5% YoY', status: 'watch', current: '3.3% March, April expected 3.7%' },
    { trigger: 'Fed forced to hike rates', status: 'watch', current: 'Markets price 40% chance of hike by April 2027' },
  ],

  // === THE DESK · ANALYST BRIEFING ===
  // Two paragraphs, forced symmetry between bull and bear.
  briefing: {
    bullParagraph: 'The case for staying long is structural and getting stronger. Five consecutive weeks of ETF inflows have pulled $3.29 billion of new institutional capital into spot Bitcoin, with BlackRock\'s IBIT alone now holding 812,000 BTC, roughly 3.8% of total supply. Exchange reserves sit at a seven-year low and whales net-bought 270,000 BTC in the last 30 days. Bitcoin has outperformed every traditional haven asset since the Iran war began in late February, validating the monetary hedge thesis under live stress. At $81,000 the price sits at 67% of Power Law fair value, a level historically associated with accumulation rather than distribution. The Fed is paralyzed between sticky inflation and a weakening labor market, and any pivot toward cuts later in 2026 would release significant liquidity into risk assets.',
    bearParagraph: 'The case for caution is real and worth respecting. Polymarket assigns just a 19% probability to a new all-time high in 2026, down from 39% at the start of the year, and major shops have cut targets, with Standard Chartered moving from $150K to $100K and Citigroup at $112K. The Fed has held rates at 3.50-3.75% for three straight meetings with the 10-year Treasury at 4.39% and the 30-year above 5%, conditions that historically cap risk-asset multiples. CPI is forecast to print 3.7% YoY for April, the highest in over two years, driven by an oil shock that may not resolve quickly given the Strait of Hormuz remains economically closed. Labor force participation is at its lowest since 2021 and the labor market is frozen rather than healthy. If de-escalation in the Middle East arrives suddenly, the monetary-hedge premium in BTC could unwind faster than the structural ETF demand can absorb.',
  },

  // === 30/90/365/1825-DAY FORECASTS ===
  // Probability-weighted, must sum to 100 within each horizon
  forecasts: {
    '30d': {
      bear: { range: '$68K-$74K', prob: 25, triggers: 'Hormuz escalation, hot CPI print, ETF outflows resume' },
      base: { range: '$78K-$90K', prob: 50, triggers: 'Range continues, ETF flows steady, Fed holds June 17' },
      bull: { range: '$92K-$105K', prob: 25, triggers: 'Iran de-escalation, soft CPI, Fed dovish pivot signal' },
    },
    '90d': {
      bear: { range: '$60K-$72K', prob: 22, triggers: 'Recession confirmation, Fed forced to hike, BTC dominance break' },
      base: { range: '$80K-$100K', prob: 48, triggers: 'Sideways accumulation, ETFs grind higher, halving narrative builds' },
      bull: { range: '$105K-$135K', prob: 30, triggers: 'New ATH retest, Fed cuts, altseason capital rotation begins' },
    },
    '1y': {
      bear: { range: '$50K-$80K', prob: 25, triggers: 'Power Law deviation, prolonged risk-off, ETF unwind' },
      base: { range: '$120K-$180K', prob: 50, triggers: 'Standard 18-month post-halving expansion, $120K PL fair value' },
      bull: { range: '$200K-$280K', prob: 25, triggers: 'Cycle peak hits in 2027 timing, supply shock manifests fully' },
    },
    '5y': {
      bear: { range: '$150K-$400K', prob: 25, triggers: 'PL breaks, BTC fails to attract new generations of capital' },
      base: { range: '$580K-$1.2M', prob: 50, triggers: 'Power Law holds. 2030 fair value ~$250K, 2031 ~$340K' },
      bull: { range: '$1.5M-$3M', prob: 25, triggers: 'Sovereign adoption, 2× PL extension, monetary regime change' },
    },
  },
};
// === END SNAPSHOT ===

// ============================================================
// === PORTFOLIO DATA · CLAUDE EDIT ZONE ===
// === Only edited when Alec buys, sells, or transfers ===
// ============================================================
const PORTFOLIO = {
  refreshedAt: '2026-05-11',
  accounts: [
    {
      id: 'coinbase', name: 'Coinbase', type: 'Exchange · Taxable',
      holdings: [
        { asset: 'SOL',  qty: 122.62,   costBasis: 0 },
        { asset: 'ETH',  qty: 2.062,    costBasis: 0 },
        { asset: 'SUI',  qty: 1951.68,  costBasis: 0 },
        { asset: 'USDC', qty: 2560,     costBasis: 1 },
      ],
    },
    {
      id: 'itrust-trad', name: 'iTrust Traditional IRA', type: 'Tax-deferred',
      holdings: [
        { asset: 'BTC',  qty: 2.014,    costBasis: 15600 },
        { asset: 'ETH',  qty: 7.92,     costBasis: 624 },
        { asset: 'LINK', qty: 177.91,   costBasis: 0 },
        { asset: 'SHIB', qty: 30160000, costBasis: 0 },
      ],
    },
    {
      id: 'itrust-roth-alec', name: 'iTrust Roth · Alec', type: 'Tax-free',
      holdings: [{ asset: 'BTC', qty: 0.05, costBasis: 76000 }],
    },
    {
      id: 'itrust-roth-renee', name: 'iTrust Roth · Renee', type: 'Spousal · pending',
      cash: 1000,
      holdings: [],
    },
    {
      id: 'fidelity', name: 'Fidelity Crypto', type: 'Taxable',
      holdings: [
        { asset: 'BTC', qty: 0.4787, costBasis: 65000 },
        { asset: 'ETH', qty: 1.362,  costBasis: 2800 },
      ],
    },
    {
      id: 'trezor', name: "Trezor · Daughters' Vault", type: 'Cold storage',
      holdings: [{ asset: 'BTC', qty: 0.10, costBasis: 70000 }],
    },
  ],
  traditional: { bobs401k: 68756, nqsoVested: 8453 },
};
// === END PORTFOLIO ===

// ============================================================
// CONFIG, CONSTANTS, HELPERS
// ============================================================
const ASSET_CONFIG = {
  BTC:  { id: 'bitcoin',     name: 'Bitcoin',    color: '#f7931a' },
  ETH:  { id: 'ethereum',    name: 'Ethereum',   color: '#627eea' },
  SOL:  { id: 'solana',      name: 'Solana',     color: '#9945ff' },
  LINK: { id: 'chainlink',   name: 'Chainlink',  color: '#2a5ada' },
  SHIB: { id: 'shiba-inu',   name: 'Shiba Inu',  color: '#e84142' },
  SUI:  { id: 'sui',         name: 'Sui',        color: '#4da2ff' },
  USDC: { id: 'usd-coin',    name: 'USD Coin',   color: '#2775ca' },
};

const WISDOM_LINES = [
  'Discipline beats optimization.',
  'The retirement is mostly won. Do not break it.',
  'Buy fear. Hold conviction. Live on yield.',
  'Bloodline thesis: never sell spot.',
  'Boring consistency beats clever timing.',
  'Earned through cycles. Respect the model.',
  'Protect what is built. Add hedges. Stay humble.',
];

const STORAGE_KEY = 'masterbork-vault-v1';
const GENESIS = new Date('2009-01-03');
const NEXT_HALVING = new Date('2028-04-20');

const powerLaw = (date) => {
  const d = (date - GENESIS) / 86400000;
  return Math.pow(10, -1.847796462) * Math.pow(d / 365.25, 5.616314045);
};

const fmtMoney = (n, dec = 0) =>
  n == null || isNaN(n) ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtCompact = (n) => {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
};

const fmtQty = (n, asset) => {
  if (n == null || isNaN(n)) return '—';
  if (asset === 'SHIB') return Math.round(n).toLocaleString('en-US');
  if (n >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 8 });
};

const fmtPct = (n) => (n == null || isNaN(n)) ? '—' : (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

const sma = (arr, period) => arr.map((_, i) => {
  if (i < period - 1) return null;
  const slice = arr.slice(i - period + 1, i + 1);
  return slice.reduce((a, b) => a + b, 0) / period;
});

const rsi = (prices, period = 14) => {
  const out = new Array(prices.length).fill(null);
  if (prices.length < period + 1) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgG = gains / period, avgL = losses / period;
  out[period] = 100 - 100 / (1 + (avgG / (avgL || 1e-9)));
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    avgG = (avgG * (period - 1) + Math.max(0, diff)) / period;
    avgL = (avgL * (period - 1) + Math.max(0, -diff)) / period;
    out[i] = 100 - 100 / (1 + (avgG / (avgL || 1e-9)));
  }
  return out;
};

// ============================================================
// MAIN APP
// ============================================================
export default function MasterBorkVault() {
  const [portfolio, setPortfolio] = useState(PORTFOLIO);
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [priceError, setPriceError] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [tab, setTab] = useState('vault');
  const [splashVisible, setSplashVisible] = useState(true);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Splash animation
  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  // Load portfolio from storage
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) {
          const parsed = JSON.parse(r.value);
          if (parsed.refreshedAt >= PORTFOLIO.refreshedAt) setPortfolio(parsed);
        }
      } catch (e) {}
      setStorageLoaded(true);
    })();
  }, []);

  // Save to storage on change
  useEffect(() => {
    if (!storageLoaded) return;
    (async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(portfolio)); }
      catch (e) { console.error(e); }
    })();
  }, [portfolio, storageLoaded]);

  // Live prices with bulletproof CORS-open fallback chain
  const fetchPrices = useCallback(async () => {
    setLoadingPrices(true);
    setPriceError(null);

    const symbols = Object.keys(ASSET_CONFIG);

    // Strategy 1: Coinbase Exchange API (CORS: *, geo-open, no key)
    // Fetches spot price + 24h stats per asset in parallel
    try {
      const coinbaseMap = { BTC: 'BTC', ETH: 'ETH', SOL: 'SOL', LINK: 'LINK', SHIB: 'SHIB', SUI: 'SUI' };
      const results = await Promise.allSettled(
        Object.entries(coinbaseMap).map(async ([sym, pair]) => {
          const [spot, stats] = await Promise.all([
            fetch(`https://api.coinbase.com/v2/prices/${pair}-USD/spot`).then(r => r.json()),
            fetch(`https://api.exchange.coinbase.com/products/${pair}-USD/stats`).then(r => r.ok ? r.json() : null),
          ]);
          const price = parseFloat(spot.data?.amount);
          let change24h = null;
          if (stats?.open && stats?.last) {
            change24h = ((parseFloat(stats.last) - parseFloat(stats.open)) / parseFloat(stats.open)) * 100;
          }
          return { sym, price, change24h };
        })
      );
      const p = {}, c = {};
      let count = 0;
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.price > 0) {
          p[r.value.sym] = r.value.price;
          c[r.value.sym] = { d1: r.value.change24h, d7: null };
          count++;
        }
      }
      p.USDC = 1.0;
      c.USDC = { d1: 0, d7: 0 };
      if (count >= 3) {
        setPrices(p);
        setPriceChanges(c);
        setLastFetch(new Date());
        setLoadingPrices(false);
        return;
      }
    } catch (e) { /* fall through */ }

    // Strategy 2: CoinPaprika (CORS: *, free, no key)
    try {
      const paprikaMap = {
        BTC: 'btc-bitcoin', ETH: 'eth-ethereum', SOL: 'sol-solana',
        LINK: 'link-chainlink', SHIB: 'shib-shiba-inu', SUI: 'sui-sui',
      };
      const results = await Promise.allSettled(
        Object.entries(paprikaMap).map(async ([sym, id]) => {
          const r = await fetch(`https://api.coinpaprika.com/v1/tickers/${id}`);
          if (!r.ok) throw new Error();
          const j = await r.json();
          return {
            sym,
            price: j.quotes?.USD?.price,
            d1: j.quotes?.USD?.percent_change_24h,
            d7: j.quotes?.USD?.percent_change_7d,
          };
        })
      );
      const p = {}, c = {};
      let count = 0;
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.price > 0) {
          p[r.value.sym] = r.value.price;
          c[r.value.sym] = { d1: r.value.d1, d7: r.value.d7 };
          count++;
        }
      }
      p.USDC = 1.0;
      c.USDC = { d1: 0, d7: 0 };
      if (count >= 3) {
        setPrices(p);
        setPriceChanges(c);
        setLastFetch(new Date());
        setLoadingPrices(false);
        return;
      }
    } catch (e) { /* fall through */ }

    // Strategy 3: CryptoCompare (CORS for claude.ai)
    try {
      const syms = symbols.join(',');
      const res = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${syms}&tsyms=USD`);
      if (res.ok) {
        const json = await res.json();
        const raw = json.RAW;
        if (raw && Object.keys(raw).length > 0) {
          const p = {}, c = {};
          for (const sym of symbols) {
            const r = raw[sym]?.USD;
            if (r) {
              p[sym] = r.PRICE;
              c[sym] = { d1: r.CHANGEPCT24HOUR, d7: null };
            }
          }
          if (Object.keys(p).length >= 3) {
            setPrices(p);
            setPriceChanges(c);
            setLastFetch(new Date());
            setLoadingPrices(false);
            return;
          }
        }
      }
    } catch (e) { /* fall through */ }

    setPriceError('All price sources blocked');
    setLoadingPrices(false);
  }, []);

  // BTC history with bulletproof CORS-open fallback
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);

    // Strategy 1: Coinbase Exchange daily candles (CORS: *)
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 86400 * 300; // 300 days
      const res = await fetch(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`);
      if (res.ok) {
        const arr = await res.json();
        // Coinbase returns [time, low, high, open, close, volume] in descending order
        const pts = arr
          .map(k => ({ ts: k[0] * 1000, price: k[4], date: new Date(k[0] * 1000) }))
          .sort((a, b) => a.ts - b.ts);
        if (pts.length > 30) {
          setHistory(pts);
          setLoadingHistory(false);
          return;
        }
      }
    } catch (e) { /* fall through */ }

    // Strategy 2: CryptoCompare daily history
    try {
      const res = await fetch('https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=365');
      if (res.ok) {
        const json = await res.json();
        if (json.Data?.Data?.length > 0) {
          const pts = json.Data.Data.map(d => ({
            ts: d.time * 1000,
            price: d.close,
            date: new Date(d.time * 1000),
          }));
          setHistory(pts);
          setLoadingHistory(false);
          return;
        }
      }
    } catch (e) { /* fall through */ }

    // Strategy 3: CoinPaprika historical (limited free tier ~1 year)
    try {
      const end = new Date().toISOString().slice(0, 10);
      const startD = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
      const res = await fetch(`https://api.coinpaprika.com/v1/tickers/btc-bitcoin/historical?start=${startD}&end=${end}&interval=1d`);
      if (res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length > 0) {
          const pts = arr.map(d => ({
            ts: new Date(d.timestamp).getTime(),
            price: d.price,
            date: new Date(d.timestamp),
          }));
          setHistory(pts);
          setLoadingHistory(false);
          return;
        }
      }
    } catch (e) { /* fall through */ }

    setLoadingHistory(false);
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);
  useEffect(() => {
    if ((tab === 'forecast' || tab === 'charts') && !history && !loadingHistory) fetchHistory();
  }, [tab, history, loadingHistory, fetchHistory]);

  // DERIVED COMPUTATIONS
  const computed = useMemo(() => {
    let cryptoTotal = 0, btcTotal = 0, ethTotal = 0;
    let costTotal = 0;
    const accountValues = {};
    const accountCost = {};
    const assetTotals = {};

    for (const acct of portfolio.accounts) {
      let v = 0, c = 0;
      for (const h of acct.holdings) {
        const price = prices[h.asset] || 0;
        const val = price * h.qty;
        const cost = (h.costBasis || 0) * h.qty;
        v += val; c += cost;
        if (h.asset === 'BTC') btcTotal += h.qty;
        if (h.asset === 'ETH') ethTotal += h.qty;
        if (!assetTotals[h.asset]) assetTotals[h.asset] = { qty: 0, value: 0, cost: 0 };
        assetTotals[h.asset].qty += h.qty;
        assetTotals[h.asset].value += val;
        assetTotals[h.asset].cost += cost;
      }
      if (acct.cash) { v += acct.cash; c += acct.cash; }
      accountValues[acct.id] = v;
      accountCost[acct.id] = c;
      cryptoTotal += v;
      costTotal += c;
    }
    const tradTotal = (portfolio.traditional?.bobs401k || 0) + (portfolio.traditional?.nqsoVested || 0);
    const netWorth = cryptoTotal + tradTotal;
    const btcValue = btcTotal * (prices.BTC || 0);
    const btcPctNet = netWorth ? (btcValue / netWorth) * 100 : 0;
    const cryptoPctNet = netWorth ? (cryptoTotal / netWorth) * 100 : 0;
    const totalPL = cryptoTotal - costTotal;
    const totalPLPct = costTotal ? (totalPL / costTotal) * 100 : 0;

    const plFair = powerLaw(new Date());
    const btcPrice = prices.BTC;
    const plRatio = btcPrice ? btcPrice / plFair : null;

    return {
      cryptoTotal, netWorth, btcTotal, ethTotal, btcValue, costTotal, totalPL, totalPLPct,
      btcPctNet, cryptoPctNet, tradTotal,
      accountValues, accountCost, assetTotals,
      plFair, btcPrice, plRatio,
    };
  }, [portfolio, prices]);

  // Thesis health score
  const thesisHealth = useMemo(() => {
    const scores = Object.values(SNAPSHOT.thesisHealth).map(s => s.score);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, []);

  // Portfolio mutations
  const setAccounts = (fn) => setPortfolio(p => ({ ...p, accounts: fn(p.accounts), refreshedAt: new Date().toISOString().slice(0, 10) }));
  const updateHolding = (aid, idx, patch) => setAccounts(accts => accts.map(a => a.id === aid ? { ...a, holdings: a.holdings.map((h, i) => i === idx ? { ...h, ...patch } : h) } : a));
  const removeHolding = (aid, idx) => setAccounts(accts => accts.map(a => a.id === aid ? { ...a, holdings: a.holdings.filter((_, i) => i !== idx) } : a));
  const addHolding = (aid, asset, qty, costBasis = 0) => setAccounts(accts => accts.map(a => a.id === aid ? { ...a, holdings: [...a.holdings, { asset, qty: +qty, costBasis: +costBasis }] } : a));
  const updateCash = (aid, cash) => setAccounts(accts => accts.map(a => a.id === aid ? { ...a, cash: +cash } : a));
  const updateTrad = (field, value) => setPortfolio(p => ({ ...p, traditional: { ...p.traditional, [field]: +value }, refreshedAt: new Date().toISOString().slice(0, 10) }));
  const resetPortfolio = () => setPortfolio(PORTFOLIO);
  const applyJsonUpdate = (json) => setPortfolio({ ...json, refreshedAt: new Date().toISOString().slice(0, 10) });

  if (splashVisible) return <Splash />;

  const tabs = [
    { id: 'vault',    label: 'Vault',    icon: Wallet },
    { id: 'desk',     label: 'Desk',     icon: Newspaper },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'charts',   label: 'Charts',   icon: LineIcon },
    { id: 'update',   label: 'Update',   icon: Wand2 },
  ];

  return (
    <div className="min-h-screen w-full pb-20" style={{ background: '#08070a', color: '#ede8dd', fontFamily: 'Geist, ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      <GlobalStyles />

      <Hero
        netWorth={computed.netWorth}
        btcTotal={computed.btcTotal}
        btcValue={computed.btcValue}
        btcPrice={computed.btcPrice}
        priceChange24h={priceChanges.BTC?.d1}
        cryptoPctNet={computed.cryptoPctNet}
        lastFetch={lastFetch}
        priceError={priceError}
        loadingPrices={loadingPrices}
        onRefresh={fetchPrices}
        snapshotDate={SNAPSHOT.refreshedAt}
      />

      {tab === 'vault' && (
        <VaultTab
          portfolio={portfolio}
          prices={prices}
          priceChanges={priceChanges}
          computed={computed}
          updateHolding={updateHolding}
          removeHolding={removeHolding}
          addHolding={addHolding}
          updateCash={updateCash}
          updateTrad={updateTrad}
        />
      )}
      {tab === 'desk' && (
        <DeskTab thesisHealth={thesisHealth} computed={computed} />
      )}
      {tab === 'forecast' && (
        <ForecastTab computed={computed} history={history} loadingHistory={loadingHistory} />
      )}
      {tab === 'charts' && (
        <ChartsTab history={history} loadingHistory={loadingHistory} btcPrice={computed.btcPrice} prices={prices} priceChanges={priceChanges} />
      )}
      {tab === 'update' && (
        <UpdateTab portfolio={portfolio} applyJsonUpdate={applyJsonUpdate} resetPortfolio={resetPortfolio} />
      )}

      <BottomNav tabs={tabs} tab={tab} setTab={setTab} />
    </div>
  );
}

// ============================================================
// GLOBAL STYLES
// ============================================================
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Cinzel:wght@500;600&display=swap');
      .serif { font-family: 'Instrument Serif', ui-serif, Georgia, serif; font-weight: 400; }
      .mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
      .display { font-family: 'Cinzel', serif; letter-spacing: 0.16em; }
      input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      input[type=number] { -moz-appearance: textfield; }
      .scroll-touch { -webkit-overflow-scrolling: touch; }

      @keyframes vaultDoorL { from { transform: translateX(0); } to { transform: translateX(-110%); } }
      @keyframes vaultDoorR { from { transform: translateX(0); } to { transform: translateX(110%); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulseSeam { 0%, 100% { box-shadow: 0 0 8px rgba(247, 147, 26, 0.4); } 50% { box-shadow: 0 0 24px rgba(247, 147, 26, 0.9); } }
      @keyframes shimmerGold { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

      .splash-fade { animation: fadeIn 0.6s ease-out both; }
      .door-left { animation: vaultDoorL 0.9s cubic-bezier(0.65, 0, 0.35, 1) 1.5s forwards; }
      .door-right { animation: vaultDoorR 0.9s cubic-bezier(0.65, 0, 0.35, 1) 1.5s forwards; }
      .seam-pulse { animation: pulseSeam 1.4s ease-in-out infinite; }
      .gold-shimmer {
        background: linear-gradient(90deg, transparent 0%, rgba(247, 147, 26, 0.6) 50%, transparent 100%);
        background-size: 200% 100%;
        animation: shimmerGold 2.4s linear infinite;
      }

      .glass {
        background: linear-gradient(180deg, rgba(20, 18, 16, 0.85) 0%, rgba(14, 12, 14, 0.85) 100%);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.04);
      }

      .gold-text { color: #e6a85c; }
      .btc-text { color: #f7931a; }
    `}</style>
  );
}

// ============================================================
// SPLASH SCREEN
// ============================================================
function Splash() {
  const wisdom = useMemo(() => WISDOM_LINES[Math.floor(Math.random() * WISDOM_LINES.length)], []);
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: '#000' }}>
      <GlobalStyles />
      {/* Doors */}
      <div className="absolute inset-y-0 left-0 door-left" style={{
        width: '50%',
        background: 'linear-gradient(90deg, #0a0808 0%, #14100a 70%, #1a1410 100%)',
        borderRight: '1px solid rgba(247, 147, 26, 0.35)',
        zIndex: 2,
      }} />
      <div className="absolute inset-y-0 right-0 door-right" style={{
        width: '50%',
        background: 'linear-gradient(270deg, #0a0808 0%, #14100a 70%, #1a1410 100%)',
        borderLeft: '1px solid rgba(247, 147, 26, 0.35)',
        zIndex: 2,
      }} />

      {/* Seam */}
      <div className="absolute left-1/2 top-0 bottom-0 seam-pulse" style={{ width: '1px', background: '#f7931a', transform: 'translateX(-50%)', zIndex: 3 }} />

      {/* Wordmark */}
      <div className="absolute inset-0 flex flex-col items-center justify-center splash-fade" style={{ zIndex: 4 }}>
        <div className="display text-center mb-2" style={{ fontSize: '38px', color: '#ede8dd', letterSpacing: '0.32em' }}>
          MASTER<span className="btc-text">BORK</span>
        </div>
        <div className="text-center mb-1" style={{ fontSize: '10px', color: '#666', letterSpacing: '0.32em' }}>
          THE&nbsp;VAULT
        </div>
        <div className="mt-8 px-8 text-center serif italic" style={{ fontSize: '15px', color: 'rgba(230, 168, 92, 0.85)', maxWidth: '280px' }}>
          {wisdom}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HERO
// ============================================================
function Hero({ netWorth, btcTotal, btcValue, btcPrice, priceChange24h, cryptoPctNet, lastFetch, priceError, loadingPrices, onRefresh, snapshotDate }) {
  return (
    <div className="relative px-5 pt-7 pb-5 overflow-hidden" style={{
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'radial-gradient(ellipse at top, rgba(247, 147, 26, 0.08) 0%, transparent 60%), linear-gradient(180deg, #0d0b09 0%, #08070a 100%)',
    }}>
      <div className="flex items-center justify-between mb-2">
        <div className="display text-[10px]" style={{ color: '#ede8dd', letterSpacing: '0.28em' }}>
          MASTER<span className="btc-text">BORK</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loadingPrices}
          className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(247, 147, 26, 0.08)', color: '#e6a85c', border: '1px solid rgba(247, 147, 26, 0.2)' }}
        >
          <RefreshCw size={10} className={loadingPrices ? 'animate-spin' : ''} />
          {loadingPrices ? 'LIVE' : 'LIVE'}
        </button>
      </div>

      <div className="text-[9px] uppercase tracking-[0.24em] mb-1" style={{ color: '#666' }}>Net Worth</div>
      <div className="serif" style={{ fontSize: '54px', lineHeight: '1.0', color: '#ede8dd', letterSpacing: '-0.02em' }}>
        {fmtMoney(netWorth, 0)}
      </div>
      <div className="text-[10px] mt-1 flex items-center gap-2" style={{ color: '#666' }}>
        <span>{lastFetch ? `Prices live · ${lastFetch.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : 'Loading'}</span>
        <span style={{ color: '#3a3a3a' }}>|</span>
        <span>Snapshot {snapshotDate}</span>
        {priceError && <span style={{ color: '#cc6666' }}> · API err</span>}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <HeroStat label="BTC Stack" value={btcTotal.toFixed(4)} sub={fmtMoney(btcValue)} valueColor="#f7931a" />
        <HeroStat label="Crypto %" value={`${cryptoPctNet.toFixed(1)}%`} sub="of net" valueColor={cryptoPctNet > 70 ? '#e6a85c' : '#ede8dd'} />
        <HeroStat
          label="BTC Spot"
          value={btcPrice ? fmtMoney(btcPrice, 0) : '—'}
          sub={priceChange24h != null ? fmtPct(priceChange24h) + ' 24h' : '—'}
          subColor={(priceChange24h ?? 0) >= 0 ? '#7ab87a' : '#cc6666'}
        />
      </div>

      {/* Gold shimmer bottom rule */}
      <div className="absolute left-0 right-0 bottom-0 h-[1px] gold-shimmer" />
    </div>
  );
}

function HeroStat({ label, value, sub, valueColor = '#ede8dd', subColor = '#888' }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: '#666' }}>{label}</div>
      <div className="mono text-base mt-0.5" style={{ color: valueColor }}>{value}</div>
      <div className="text-[10px] mono" style={{ color: subColor }}>{sub}</div>
    </div>
  );
}

// ============================================================
// BOTTOM NAV
// ============================================================
function BottomNav({ tabs, tab, setTab }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" style={{
      background: 'rgba(8, 7, 10, 0.92)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div className="flex relative">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative"
              style={{ color: active ? '#f7931a' : '#555' }}
            >
              <Icon size={17} strokeWidth={active ? 2.3 : 1.7} />
              <span className="text-[9px] font-medium uppercase tracking-[0.12em]">{t.label}</span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px]" style={{
                  background: 'linear-gradient(90deg, transparent, #f7931a, transparent)',
                  boxShadow: '0 0 8px rgba(247, 147, 26, 0.6)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// VAULT TAB (Holdings)
// ============================================================
function VaultTab({ portfolio, prices, priceChanges, computed, updateHolding, removeHolding, addHolding, updateCash, updateTrad }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [editingCash, setEditingCash] = useState(null);
  const [editingTrad, setEditingTrad] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  return (
    <>
      <SectionTitle>Live Performance</SectionTitle>
      <div className="px-5 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {['BTC', 'ETH', 'SOL', 'LINK'].map(sym => {
            const cfg = ASSET_CONFIG[sym];
            const p = prices[sym];
            const c1 = priceChanges[sym]?.d1;
            const c7 = priceChanges[sym]?.d7;
            return (
              <div key={sym} className="glass rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: '#888' }}>{sym}</span>
                </div>
                <div className="mono text-[13px]" style={{ color: '#ede8dd' }}>{p ? (p > 100 ? fmtMoney(p, 0) : '$' + p.toFixed(p < 1 ? 4 : 2)) : '—'}</div>
                <div className="flex items-center justify-between mt-1 text-[9px] mono">
                  <span style={{ color: (c1 ?? 0) >= 0 ? '#7ab87a' : '#cc6666' }}>{c1 != null ? fmtPct(c1) : '—'}</span>
                  <span style={{ color: (c7 ?? 0) >= 0 ? '#7ab87a' : '#cc6666' }}>{c7 != null ? fmtPct(c7) : '—'}</span>
                </div>
                <div className="flex items-center justify-between text-[8px] uppercase" style={{ color: '#444' }}>
                  <span>24h</span><span>7d</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Power Law positioning */}
      {computed.btcPrice && (
        <div className="px-5 mb-5">
          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#e6a85c' }}>Power Law Position</div>
              <div className="text-[11px] mono" style={{ color: computed.plRatio < 0.8 ? '#7ab87a' : computed.plRatio > 1.5 ? '#cc6666' : '#e6a85c' }}>
                {(computed.plRatio * 100).toFixed(0)}% of fair
              </div>
            </div>
            <div className="flex items-baseline justify-between text-sm mb-3">
              <span className="mono" style={{ color: '#888' }}>Fair {fmtMoney(computed.plFair, 0)}</span>
              <span className="mono" style={{ color: computed.btcPrice < computed.plFair ? '#7ab87a' : '#cc6666' }}>
                {computed.btcPrice < computed.plFair ? '−' : '+'}{Math.abs(((computed.btcPrice - computed.plFair) / computed.plFair) * 100).toFixed(1)}%
              </span>
            </div>
            <PowerLawBar plRatio={computed.plRatio} />
          </div>
        </div>
      )}

      {/* Allocation pie + breakdown */}
      <SectionTitle>Allocation</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-4">
          <AllocationDonut assetTotals={computed.assetTotals} cryptoTotal={computed.cryptoTotal} />
        </div>
      </div>

      {/* Accounts */}
      <SectionTitle>Accounts</SectionTitle>
      <div className="px-5 mb-5">
        <div className="space-y-2">
          {portfolio.accounts.map(acct => {
            const v = computed.accountValues[acct.id];
            const isCollapsed = collapsed[acct.id];
            return (
              <div key={acct.id} className="glass rounded-lg overflow-hidden">
                <button
                  onClick={() => setCollapsed(c => ({ ...c, [acct.id]: !c[acct.id] }))}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isCollapsed ? <ChevronRight size={13} style={{ color: '#555' }} /> : <ChevronDown size={13} style={{ color: '#555' }} />}
                      <div className="text-sm font-medium truncate" style={{ color: '#ede8dd' }}>{acct.name}</div>
                    </div>
                    <div className="text-[10px] ml-5" style={{ color: '#666' }}>{acct.type}</div>
                  </div>
                  <div className="mono text-sm shrink-0 ml-2" style={{ color: '#ede8dd' }}>{fmtMoney(v, 0)}</div>
                </button>

                {!isCollapsed && (
                  <div className="px-3.5 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {acct.holdings.length === 0 && !acct.cash && (
                      <div className="text-[11px] py-3 italic" style={{ color: '#555' }}>No holdings yet</div>
                    )}

                    {acct.cash != null && (
                      <div className="flex items-center justify-between py-2.5" style={{ borderBottom: acct.holdings.length ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-6 rounded-sm" style={{ background: '#7ab87a' }} />
                          <div>
                            <div className="text-sm" style={{ color: '#ede8dd' }}>USD Cash</div>
                            <div className="text-[10px]" style={{ color: '#666' }}>Pending deployment</div>
                          </div>
                        </div>
                        {editingCash?.accountId === acct.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number" autoFocus
                              value={editingCash.cash}
                              onChange={e => setEditingCash({ ...editingCash, cash: e.target.value })}
                              className="mono text-sm w-24 px-2 py-1 rounded"
                              style={{ background: '#0a0a0a', color: '#ede8dd', border: '1px solid #333' }}
                            />
                            <button onClick={() => { updateCash(acct.id, editingCash.cash); setEditingCash(null); }} style={{ color: '#7ab87a' }}><Check size={16} /></button>
                            <button onClick={() => setEditingCash(null)} style={{ color: '#888' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingCash({ accountId: acct.id, cash: acct.cash })} className="flex items-center gap-2">
                            <span className="mono text-sm" style={{ color: '#ede8dd' }}>{fmtMoney(acct.cash, 0)}</span>
                            <Pencil size={11} style={{ color: '#555' }} />
                          </button>
                        )}
                      </div>
                    )}

                    {acct.holdings.map((h, idx) => {
                      const cfg = ASSET_CONFIG[h.asset];
                      const p = prices[h.asset] || 0;
                      const value = p * h.qty;
                      const cost = (h.costBasis || 0) * h.qty;
                      const pl = value - cost;
                      const plPct = cost ? (pl / cost) * 100 : 0;
                      const isEd = editing?.accountId === acct.id && editing?.idx === idx;
                      return (
                        <div key={idx} className="py-2.5" style={{ borderBottom: idx < acct.holdings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className="w-1.5 h-6 rounded-sm shrink-0" style={{ background: cfg?.color || '#666' }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm" style={{ color: '#ede8dd' }}>{h.asset}</div>
                                <div className="text-[10px] mono" style={{ color: '#666' }}>{fmtQty(h.qty, h.asset)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <div className="mono text-sm" style={{ color: '#ede8dd' }}>{fmtMoney(value, 0)}</div>
                                {h.costBasis > 0 && (
                                  <div className="text-[10px] mono" style={{ color: pl >= 0 ? '#7ab87a' : '#cc6666' }}>
                                    {fmtPct(plPct)}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => setEditing({ accountId: acct.id, idx, qty: h.qty, costBasis: h.costBasis || 0 })} style={{ color: '#555' }}><Pencil size={12} /></button>
                            </div>
                          </div>
                          {isEd && (
                            <div className="mt-2.5 pt-2.5 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] w-20" style={{ color: '#888' }}>Quantity</span>
                                <input
                                  type="number" step="any" autoFocus
                                  value={editing.qty}
                                  onChange={e => setEditing({ ...editing, qty: e.target.value })}
                                  className="mono text-xs flex-1 px-2 py-1 rounded"
                                  style={{ background: '#0a0a0a', color: '#ede8dd', border: '1px solid #333' }}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] w-20" style={{ color: '#888' }}>Cost/unit</span>
                                <input
                                  type="number" step="any"
                                  value={editing.costBasis}
                                  onChange={e => setEditing({ ...editing, costBasis: e.target.value })}
                                  className="mono text-xs flex-1 px-2 py-1 rounded"
                                  style={{ background: '#0a0a0a', color: '#ede8dd', border: '1px solid #333' }}
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  onClick={() => { if (confirm(`Remove ${h.asset}?`)) { removeHolding(acct.id, idx); setEditing(null); } }}
                                  className="text-[10px] px-2 py-1 rounded flex items-center gap-1"
                                  style={{ background: 'rgba(204, 102, 102, 0.1)', color: '#cc6666', border: '1px solid rgba(204, 102, 102, 0.2)' }}
                                >
                                  <Trash2 size={10} /> Remove
                                </button>
                                <button onClick={() => setEditing(null)} className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: '#888' }}>Cancel</button>
                                <button
                                  onClick={() => { updateHolding(acct.id, idx, { qty: +editing.qty, costBasis: +editing.costBasis }); setEditing(null); }}
                                  className="text-[10px] px-2 py-1 rounded flex items-center gap-1"
                                  style={{ background: 'rgba(247, 147, 26, 0.12)', color: '#f7931a', border: '1px solid rgba(247, 147, 26, 0.3)' }}
                                >
                                  <Check size={10} /> Save
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {adding?.accountId === acct.id ? (
                      <div className="flex items-center gap-2 pt-3 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <select
                          value={adding.asset}
                          onChange={e => setAdding({ ...adding, asset: e.target.value })}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: '#0a0a0a', color: '#ede8dd', border: '1px solid #333' }}
                        >
                          {Object.keys(ASSET_CONFIG).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                        </select>
                        <input
                          type="number" step="any" placeholder="Qty"
                          value={adding.qty}
                          onChange={e => setAdding({ ...adding, qty: e.target.value })}
                          className="mono text-xs flex-1 px-2 py-1 rounded"
                          style={{ background: '#0a0a0a', color: '#ede8dd', border: '1px solid #333' }}
                        />
                        <input
                          type="number" step="any" placeholder="Cost"
                          value={adding.costBasis || ''}
                          onChange={e => setAdding({ ...adding, costBasis: e.target.value })}
                          className="mono text-xs w-20 px-2 py-1 rounded"
                          style={{ background: '#0a0a0a', color: '#ede8dd', border: '1px solid #333' }}
                        />
                        <button onClick={() => { if (adding.qty) { addHolding(acct.id, adding.asset, adding.qty, adding.costBasis); setAdding(null); } }} style={{ color: '#7ab87a' }}><Check size={16} /></button>
                        <button onClick={() => setAdding(null)} style={{ color: '#888' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAdding({ accountId: acct.id, asset: 'BTC', qty: '', costBasis: '' })}
                        className="w-full mt-3 py-2 text-[10px] flex items-center justify-center gap-1.5 rounded uppercase tracking-wider"
                        style={{ background: 'rgba(255,255,255,0.02)', color: '#888', border: '1px dashed rgba(255,255,255,0.06)' }}
                      >
                        <Plus size={11} /> Add holding
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Traditional */}
      <SectionTitle>Traditional Assets</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg overflow-hidden">
          {[
            { key: 'bobs401k', label: "Bob's 401k", sub: 'Fidelity · 12% + match' },
            { key: 'nqsoVested', label: 'BOBS NQSOs · vested', sub: '1,277 @ $4.28 strike' },
          ].map((row, i) => (
            <div key={row.key} className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div>
                <div className="text-sm" style={{ color: '#ede8dd' }}>{row.label}</div>
                <div className="text-[10px]" style={{ color: '#666' }}>{row.sub}</div>
              </div>
              {editingTrad?.field === row.key ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" autoFocus
                    value={editingTrad.value}
                    onChange={e => setEditingTrad({ ...editingTrad, value: e.target.value })}
                    className="mono text-sm w-28 px-2 py-1 rounded"
                    style={{ background: '#0a0a0a', color: '#ede8dd', border: '1px solid #333' }}
                  />
                  <button onClick={() => { updateTrad(row.key, editingTrad.value); setEditingTrad(null); }} style={{ color: '#7ab87a' }}><Check size={16} /></button>
                  <button onClick={() => setEditingTrad(null)} style={{ color: '#888' }}><X size={16} /></button>
                </div>
              ) : (
                <button onClick={() => setEditingTrad({ field: row.key, value: portfolio.traditional[row.key] })} className="flex items-center gap-2">
                  <span className="mono text-sm" style={{ color: '#ede8dd' }}>{fmtMoney(portfolio.traditional[row.key], 0)}</span>
                  <Pencil size={11} style={{ color: '#555' }} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Concentration warning */}
      <div className="px-5 mb-3">
        <div className="rounded-lg p-3.5" style={{ background: 'linear-gradient(135deg, #14110b 0%, #0d0b09 100%)', border: '1px solid rgba(230, 168, 92, 0.18)' }}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} style={{ color: '#e6a85c', marginTop: '2px' }} />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: '#e6a85c' }}>Concentration</div>
              <div className="text-[11px] leading-relaxed" style={{ color: '#a89880' }}>
                BTC is <span className="mono">{computed.btcPctNet.toFixed(1)}%</span> of net worth. Total crypto is <span className="mono">{computed.cryptoPctNet.toFixed(1)}%</span>. Single income, family of 6. Net worth at BTC −50%: <span className="mono">{fmtMoney(computed.netWorth - computed.btcValue * 0.5, 0)}</span>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="px-5 mb-3 mt-1">
      <div className="text-[10px] uppercase tracking-[0.22em] flex items-center gap-2" style={{ color: '#888' }}>
        <span>{children}</span>
        <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(247,147,26,0.2), transparent)' }} />
      </div>
    </div>
  );
}

function PowerLawBar({ plRatio }) {
  const pct = Math.min(100, Math.max(2, plRatio * 50));
  const color = plRatio < 0.8 ? '#7ab87a' : plRatio > 1.5 ? '#cc6666' : '#e6a85c';
  return (
    <div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 12px ${color}66` }} />
        <div className="absolute inset-y-0" style={{ left: '50%', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
      </div>
      <div className="flex justify-between text-[9px] mono mt-1" style={{ color: '#555' }}>
        <span>0.5×</span>
        <span style={{ color: '#888' }}>Fair</span>
        <span>2.0×</span>
      </div>
    </div>
  );
}

function AllocationDonut({ assetTotals, cryptoTotal }) {
  const items = Object.entries(assetTotals).sort((a, b) => b[1].value - a[1].value);
  let cumulative = 0;
  const radius = 60;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
          {items.map(([sym, a]) => {
            const cfg = ASSET_CONFIG[sym];
            const frac = a.value / cryptoTotal;
            const dasharray = `${frac * circumference} ${circumference}`;
            const dashoffset = -cumulative * circumference;
            cumulative += frac;
            return (
              <circle
                key={sym}
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={cfg.color}
                strokeWidth={stroke}
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                transform="rotate(-90 80 80)"
                style={{ filter: `drop-shadow(0 0 4px ${cfg.color}55)` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: '#666' }}>Crypto</div>
          <div className="serif" style={{ fontSize: '22px', color: '#ede8dd', lineHeight: 1 }}>{fmtCompact(cryptoTotal)}</div>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {items.slice(0, 6).map(([sym, a]) => {
          const cfg = ASSET_CONFIG[sym];
          const pct = (a.value / cryptoTotal) * 100;
          return (
            <div key={sym} className="flex items-center gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
              <span style={{ color: '#ede8dd', minWidth: 32 }}>{sym}</span>
              <span className="mono" style={{ color: '#666' }}>{pct.toFixed(1)}%</span>
              <span className="mono flex-1 text-right" style={{ color: '#888' }}>{fmtCompact(a.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// THE DESK TAB
// ============================================================
function DeskTab({ thesisHealth, computed }) {
  const { briefing, news, polymarket, macro, etf, invalidations } = SNAPSHOT;

  return (
    <>
      {/* THESIS HEALTH METER */}
      <SectionTitle>Thesis Health</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-4">
          <ThesisHealthMeter score={thesisHealth} />
          <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {Object.entries(SNAPSHOT.thesisHealth).map(([key, v]) => (
              <ThesisInputBar key={key} label={camelToTitle(key)} score={v.score} reason={v.reason} />
            ))}
          </div>
        </div>
      </div>

      {/* THE DESK BRIEFING */}
      <SectionTitle>The Desk · Briefing</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: '#7ab87a' }} />
            <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#7ab87a' }}>Bull case</span>
          </div>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#d0c8b8' }}>{briefing.bullParagraph}</p>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: '#cc6666' }} />
            <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#cc6666' }}>Bear case</span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: '#d0c8b8' }}>{briefing.bearParagraph}</p>
        </div>
      </div>

      {/* NEWS */}
      <SectionTitle>Headlines Impacting Thesis</SectionTitle>
      <div className="px-5 mb-5">
        <div className="space-y-2">
          {news.map((n, i) => (
            <NewsItem key={i} news={n} />
          ))}
        </div>
      </div>

      {/* MACRO STRIP */}
      <SectionTitle>Macro Snapshot</SectionTitle>
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-2">
          <MacroCard label="Fear & Greed" value={macro.fearGreed.value} sub={macro.fearGreed.label} accent="#e6a85c" />
          <MacroCard label="CBBI Cycle" value={macro.cbbi.value} sub={macro.cbbi.label} accent="#e6a85c" />
          <MacroCard label="Fed Funds" value={`${macro.fedFundsLower}–${macro.fedFundsUpper}%`} sub={`Next: ${macro.nextFOMC}`} accent="#888" />
          <MacroCard label="CPI YoY" value={`${macro.cpiYoY}%`} sub={`Apr exp. ${macro.cpiYoYExpected}%`} accent={macro.cpiYoY > 3 ? '#cc6666' : '#7ab87a'} />
          <MacroCard label="10Y Treasury" value={`${macro.treasury10Y}%`} sub={`30Y: ${macro.treasury30Y}%`} accent="#888" />
          <MacroCard label="Unemployment" value={`${macro.unemployment}%`} sub={`+${(macro.nonfarmPayrolls/1000).toFixed(0)}K Apr`} accent="#888" />
          <MacroCard label="BTC Dominance" value={`${macro.btcDominance}%`} sub="Alt rotation watch" accent="#f7931a" />
          <MacroCard label="BTC vs ATH" value={`${macro.btcDrawdownFromAth.toFixed(1)}%`} sub={`ATH ${fmtCompact(macro.btcAth)}`} accent="#cc6666" />
        </div>
      </div>

      {/* ETF FLOWS */}
      <SectionTitle>ETF Flows</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-4">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: '#666' }}>Week net inflow</div>
              <div className="serif" style={{ fontSize: '24px', color: '#7ab87a' }}>+${etf.weeklyNetInflow.toFixed(1)}M</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest" style={{ color: '#666' }}>Streak</div>
              <div className="serif" style={{ fontSize: '24px', color: '#e6a85c' }}>{etf.streakWeeks}wk</div>
            </div>
          </div>
          <div className="text-[11px]" style={{ color: '#888' }}>
            Cumulative since launch: <span className="mono" style={{ color: '#ede8dd' }}>${etf.cumulativeNetInflow}B</span>
          </div>
          <div className="text-[11px] mt-1" style={{ color: '#888' }}>
            IBIT BTC held: <span className="mono" style={{ color: '#ede8dd' }}>{etf.blackrockIBIT.toLocaleString()}</span>
          </div>
          <div className="text-[11px] mt-3 italic leading-relaxed" style={{ color: '#a89880' }}>{etf.note}</div>
        </div>
      </div>

      {/* POLYMARKET */}
      <SectionTitle>Polymarket · Crowd Odds</SectionTitle>
      <div className="px-5 mb-5">
        <div className="space-y-2">
          {polymarket.map((m, i) => (
            <PolymarketCard key={i} market={m} />
          ))}
        </div>
        <div className="text-[10px] mt-2 italic" style={{ color: '#555' }}>
          Real money sentiment. Contrarian to your bullish info diet.
        </div>
      </div>

      {/* INVALIDATION WATCH */}
      <SectionTitle>Invalidation Watch</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-3.5">
          <div className="text-[11px] mb-3 leading-relaxed" style={{ color: '#a89880' }}>
            Triggers that would force a thesis revision. If one fires, stop and reassess.
          </div>
          <div className="space-y-2">
            {invalidations.map((inv, i) => (
              <InvalidationRow key={i} item={inv} />
            ))}
          </div>
        </div>
      </div>

      {/* TIMESTAMP STRIP */}
      <div className="px-5 pb-2">
        <div className="text-[10px] mono text-center" style={{ color: '#444' }}>
          Snapshot rebuilt {SNAPSHOT.refreshedAt} · Live prices via CoinGecko · Ask Claude for next rebuild
        </div>
      </div>
    </>
  );
}

function camelToTitle(s) {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

function ThesisHealthMeter({ score }) {
  const color = score >= 70 ? '#7ab87a' : score >= 40 ? '#e6a85c' : '#cc6666';
  const label = score >= 70 ? 'DEPLOY' : score >= 40 ? 'DCA' : 'CASH UP';

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="serif" style={{ fontSize: '42px', lineHeight: 1, color }}>{score.toFixed(0)}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: '#888' }}>thesis health</div>
        </div>
        <div className="text-right">
          <div className="display text-[11px]" style={{ color, letterSpacing: '0.24em' }}>{label}</div>
          <div className="text-[10px] mono mt-0.5" style={{ color: '#666' }}>
            {score >= 70 ? 'Aggressive accumulation' : score >= 40 ? 'Stay disciplined' : 'Defensive posture'}
          </div>
        </div>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(90deg, rgba(204,102,102,0.15) 0%, rgba(204,102,102,0.15) 40%, rgba(230,168,92,0.15) 40%, rgba(230,168,92,0.15) 70%, rgba(122,184,122,0.15) 70%, rgba(122,184,122,0.15) 100%)',
        }} />
        <div className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{
          left: `${score}%`,
          width: 14,
          height: 14,
          background: color,
          marginLeft: -7,
          boxShadow: `0 0 16px ${color}, 0 0 4px ${color}`,
          border: '2px solid rgba(255,255,255,0.9)',
        }} />
      </div>
      <div className="flex justify-between text-[9px] mono mt-1" style={{ color: '#555' }}>
        <span>0</span>
        <span>40</span>
        <span>70</span>
        <span>100</span>
      </div>
    </div>
  );
}

function ThesisInputBar({ label, score, reason }) {
  const color = score >= 70 ? '#7ab87a' : score >= 40 ? '#e6a85c' : '#cc6666';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px]" style={{ color: '#d0c8b8' }}>{label}</div>
        <div className="mono text-[11px]" style={{ color }}>{score}</div>
      </div>
      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color, boxShadow: `0 0 6px ${color}66` }} />
      </div>
      <div className="text-[10px] leading-relaxed" style={{ color: '#666' }}>{reason}</div>
    </div>
  );
}

function NewsItem({ news }) {
  const colors = {
    bullish: { fg: '#7ab87a', bg: 'rgba(122, 184, 122, 0.08)', border: 'rgba(122, 184, 122, 0.2)', icon: ArrowUpRight },
    bearish: { fg: '#cc6666', bg: 'rgba(204, 102, 102, 0.08)', border: 'rgba(204, 102, 102, 0.2)', icon: ArrowDownRight },
    neutral: { fg: '#e6a85c', bg: 'rgba(230, 168, 92, 0.08)', border: 'rgba(230, 168, 92, 0.2)', icon: Minus },
  };
  const c = colors[news.impact] || colors.neutral;
  const Icon = c.icon;
  return (
    <div className="glass rounded-lg p-3">
      <div className="flex items-start gap-2 mb-1.5">
        <div className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider flex items-center gap-1 shrink-0" style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}>
          <Icon size={9} /> {news.impact}
        </div>
        <div className="text-[10px] mono shrink-0" style={{ color: '#555' }}>{news.date.slice(5)}</div>
      </div>
      <div className="text-[13px] leading-snug mb-1.5" style={{ color: '#ede8dd' }}>{news.headline}</div>
      <div className="text-[11px] italic leading-relaxed mb-1" style={{ color: '#a89880' }}>{news.thesisNote}</div>
      <div className="text-[10px]" style={{ color: '#555' }}>{news.source}</div>
    </div>
  );
}

function MacroCard({ label, value, sub, accent }) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#666' }}>{label}</div>
      <div className="mono text-base" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] mono" style={{ color: '#666' }}>{sub}</div>
    </div>
  );
}

function PolymarketCard({ market }) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <div className="text-[12px] flex-1" style={{ color: '#ede8dd' }}>{market.question}</div>
        <div className="mono text-sm shrink-0" style={{ color: market.yesOdds >= 50 ? '#7ab87a' : '#cc6666' }}>{market.yesOdds}%</div>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ width: `${market.yesOdds}%`, background: 'linear-gradient(90deg, #7ab87a55, #7ab87a)' }} />
        <div style={{ width: `${market.noOdds}%`, background: 'rgba(204, 102, 102, 0.2)' }} />
      </div>
      <div className="flex justify-between text-[10px] mono mb-1.5" style={{ color: '#666' }}>
        <span>YES {market.yesOdds}%</span>
        <span>NO {market.noOdds}%</span>
      </div>
      <div className="text-[10px] italic leading-relaxed" style={{ color: '#a89880' }}>{market.note}</div>
    </div>
  );
}

function InvalidationRow({ item }) {
  const colors = {
    safe: { fg: '#7ab87a', bg: 'rgba(122, 184, 122, 0.1)' },
    watch: { fg: '#e6a85c', bg: 'rgba(230, 168, 92, 0.1)' },
    fired: { fg: '#cc6666', bg: 'rgba(204, 102, 102, 0.1)' },
  };
  const c = colors[item.status] || colors.safe;
  return (
    <div className="flex items-start gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider shrink-0 mt-0.5" style={{ background: c.bg, color: c.fg }}>{item.status}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px]" style={{ color: '#ede8dd' }}>{item.trigger}</div>
        <div className="text-[10px] mono" style={{ color: '#666' }}>{item.current}</div>
      </div>
    </div>
  );
}

// ============================================================
// FORECAST TAB
// ============================================================
function ForecastTab({ computed, history, loadingHistory }) {
  const { btcTotal, btcPrice } = computed;
  const today = new Date();
  const daysToHalving = Math.max(0, Math.round((NEXT_HALVING - today) / 86400000));

  // Build forecast cone data over 5 years
  const coneData = useMemo(() => {
    const points = [];
    const start = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    const end = new Date(today.getFullYear() + 5, today.getMonth(), 1);
    const histMap = new Map();
    if (history) {
      for (const h of history) {
        const key = h.date.toISOString().slice(0, 7);
        if (!histMap.has(key)) histMap.set(key, h.price);
      }
    }
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const pl = powerLaw(d);
      const key = d.toISOString().slice(0, 7);
      const actual = d <= today ? (histMap.get(key) || null) : null;
      const isFuture = d > today;
      points.push({
        date: key,
        ts: d.getTime(),
        bear: isFuture ? pl * 0.5 : null,
        base: isFuture ? pl : null,
        bull: isFuture ? pl * 2 : null,
        bearArea: isFuture ? pl * 0.5 : null,
        bullArea: isFuture ? pl * 2 : null,
        pl: pl,
        actual,
      });
    }
    return points;
  }, [history, today]);

  return (
    <>
      {/* HALVING COUNTDOWN */}
      <div className="px-5 mt-1 mb-5">
        <div className="rounded-lg p-4 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #1a1208 0%, #0d0b09 70%)',
          border: '1px solid rgba(247, 147, 26, 0.2)',
        }}>
          <div className="absolute top-0 left-0 right-0 h-[1px] gold-shimmer" />
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: '#e6a85c' }}>Next Halving</div>
            <Calendar size={12} style={{ color: '#e6a85c' }} />
          </div>
          <div className="flex items-baseline gap-3">
            <div className="serif btc-text" style={{ fontSize: '42px', letterSpacing: '-0.02em' }}>{daysToHalving}</div>
            <div className="text-sm" style={{ color: '#a89880' }}>days</div>
          </div>
          <div className="text-[11px] mt-1" style={{ color: '#888' }}>
            April 20, 2028 · Cycle peak typically 12-18 months after
          </div>
        </div>
      </div>

      {/* FORECAST CONE */}
      <SectionTitle>Forecast Cone · Power Law Bands</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-3 pb-4">
          {loadingHistory && !history ? (
            <div className="text-xs py-16 text-center" style={{ color: '#666' }}>Loading history…</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={coneData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="bullFade" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7ab87a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7ab87a" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="bearFade" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#cc6666" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#cc6666" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="actualFade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f7931a" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f7931a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: '#666' }}
                  tickFormatter={d => d.slice(0, 4)}
                  ticks={[
                    `${today.getFullYear() - 1}-01`,
                    `${today.getFullYear() + 1}-01`,
                    `${today.getFullYear() + 2}-01`,
                    `${today.getFullYear() + 3}-01`,
                    `${today.getFullYear() + 4}-01`,
                    `${today.getFullYear() + 5}-01`,
                  ]}
                  stroke="rgba(255,255,255,0.06)"
                />
                <YAxis
                  scale="log" domain={['auto', 'auto']}
                  tick={{ fontSize: 9, fill: '#666' }}
                  tickFormatter={v => fmtCompact(v)}
                  stroke="rgba(255,255,255,0.06)"
                  allowDataOverflow
                />
                <Tooltip
                  contentStyle={{ background: 'rgba(10,8,10,0.95)', border: '1px solid rgba(247,147,26,0.2)', borderRadius: 8, fontSize: 11, backdropFilter: 'blur(8px)' }}
                  labelStyle={{ color: '#e6a85c', fontWeight: 600 }}
                  formatter={(v, name) => v ? [fmtCompact(v), name] : null}
                />
                <Area type="monotone" dataKey="bullArea" stroke="none" fill="url(#bullFade)" />
                <Area type="monotone" dataKey="bearArea" stroke="none" fill="url(#bearFade)" />
                <Line type="monotone" dataKey="pl" stroke="#e6a85c" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Power Law" />
                <Line type="monotone" dataKey="bull" stroke="#7ab87a" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Bull 2×" />
                <Line type="monotone" dataKey="bear" stroke="#cc6666" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Bear 0.5×" />
                <Area type="monotone" dataKey="actual" stroke="#f7931a" strokeWidth={2.5} fill="url(#actualFade)" name="Actual" />
                <ReferenceLine x={today.toISOString().slice(0, 7)} stroke="#e6a85c" strokeDasharray="2 4" />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-3 mt-2 px-2 justify-center">
            <LegendDot color="#f7931a" label="Actual" />
            <LegendDot color="#e6a85c" label="Power Law" />
            <LegendDot color="#7ab87a" label="Bull 2×" />
            <LegendDot color="#cc6666" label="Bear 0.5×" />
          </div>
        </div>
      </div>

      {/* SCENARIO CARDS */}
      <SectionTitle>Probability-Weighted Scenarios</SectionTitle>
      <div className="px-5 mb-5 space-y-3">
        {Object.entries(SNAPSHOT.forecasts).map(([horizon, scenarios]) => (
          <HorizonCard key={horizon} horizon={horizon} scenarios={scenarios} btcTotal={btcTotal} />
        ))}
      </div>

      {/* 4% YIELD AT 2041 */}
      <SectionTitle>4% Yield at Retirement (2041)</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-4">
          <div className="text-[11px] mb-3 leading-relaxed" style={{ color: '#888' }}>
            Bloodline thesis: never sell spot BTC. Live on yield. The 5-year forecast carries forward to 15-year retirement math.
          </div>
          {(() => {
            const fc = SNAPSHOT.forecasts['5y'];
            const parsePrice = (rng) => {
              const m = rng.match(/\$(\d+(?:\.\d+)?)([KM])/);
              if (!m) return 0;
              const n = parseFloat(m[1]);
              return m[2] === 'M' ? n * 1e6 : n * 1e3;
            };
            // Approximate retirement value at 2041 using 5y range mid as anchor + Power Law extension
            const t2041 = new Date('2041-09-01');
            const pl2041 = powerLaw(t2041);
            return ['bear', 'base', 'bull'].map(k => {
              const mult = k === 'bear' ? 0.5 : k === 'bull' ? 2 : 1;
              const projected = pl2041 * mult * btcTotal;
              const color = k === 'bear' ? '#cc6666' : k === 'bull' ? '#7ab87a' : '#e6a85c';
              return (
                <div key={k} className="flex items-center justify-between py-2" style={{ borderBottom: k !== 'bull' ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-sm" style={{ background: color }} />
                    <span className="text-sm capitalize" style={{ color: '#ede8dd' }}>{k} case</span>
                  </div>
                  <div className="text-right">
                    <div className="mono text-sm" style={{ color: '#ede8dd' }}>{fmtCompact(projected * 0.04)}/yr</div>
                    <div className="text-[10px] mono" style={{ color: '#666' }}>4% of {fmtCompact(projected)}</div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="px-5 mb-3">
        <div className="rounded-lg p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-start gap-2">
            <Info size={12} style={{ color: '#666', marginTop: '2px' }} />
            <div className="text-[10px] leading-relaxed" style={{ color: '#777' }}>
              Forecasts are probability-weighted from current confluence of indicators, not predictions. 5-year horizons carry meaningful model risk. Honest worst case is Power Law breakdown entirely, which would put 2041 BTC well below the bear band shown. Stress test independently.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
      <span className="text-[10px]" style={{ color: '#888' }}>{label}</span>
    </div>
  );
}

function HorizonCard({ horizon, scenarios, btcTotal }) {
  const labels = { '30d': '30 days', '90d': '90 days', '1y': '1 year', '5y': '5 years' };
  const colors = { bear: '#cc6666', base: '#e6a85c', bull: '#7ab87a' };
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="display text-[11px]" style={{ color: '#ede8dd', letterSpacing: '0.2em' }}>{labels[horizon]}</div>
        <div className="text-[10px] mono" style={{ color: '#666' }}>{btcTotal.toFixed(3)} BTC stack</div>
      </div>

      {/* Probability bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ width: `${scenarios.bear.prob}%`, background: 'linear-gradient(90deg, #cc6666cc, #cc6666)' }} />
        <div style={{ width: `${scenarios.base.prob}%`, background: 'linear-gradient(90deg, #e6a85ccc, #e6a85c)' }} />
        <div style={{ width: `${scenarios.bull.prob}%`, background: 'linear-gradient(90deg, #7ab87acc, #7ab87a)' }} />
      </div>

      <div className="space-y-2.5">
        {['bear', 'base', 'bull'].map(k => {
          const s = scenarios[k];
          return (
            <div key={k}>
              <div className="flex items-baseline justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5" style={{ background: colors[k] }} />
                  <span className="text-[11px] capitalize" style={{ color: colors[k] }}>{k}</span>
                  <span className="mono text-[11px]" style={{ color: '#ede8dd' }}>{s.range}</span>
                </div>
                <div className="mono text-[11px]" style={{ color: colors[k] }}>{s.prob}%</div>
              </div>
              <div className="text-[10px] ml-3 leading-relaxed" style={{ color: '#888' }}>{s.triggers}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CHARTS TAB
// ============================================================
function ChartsTab({ history, loadingHistory, btcPrice, prices, priceChanges }) {
  const techData = useMemo(() => {
    if (!history) return null;
    const priceArr = history.map(h => h.price);
    const sma50 = sma(priceArr, 50);
    const sma200 = sma(priceArr, 200);
    const rsiVals = rsi(priceArr, 14);
    return history.map((h, i) => ({
      ts: h.ts,
      date: h.date.toISOString().slice(5, 10),
      price: h.price,
      sma50: sma50[i],
      sma200: sma200[i],
      pl: powerLaw(h.date),
      rsi: rsiVals[i],
    }));
  }, [history]);

  const lastRSI = techData?.[techData.length - 1]?.rsi;
  const lastSma50 = techData?.[techData.length - 1]?.sma50;
  const lastSma200 = techData?.[techData.length - 1]?.sma200;
  const goldenCross = lastSma50 && lastSma200 && lastSma50 > lastSma200;

  return (
    <>
      {/* SIGNAL STRIP */}
      <div className="px-5 mt-1 mb-5">
        <div className="grid grid-cols-3 gap-2">
          <SignalCard
            label="RSI 14"
            value={lastRSI != null ? lastRSI.toFixed(0) : '—'}
            sub={lastRSI < 30 ? 'Oversold' : lastRSI > 70 ? 'Overbought' : 'Neutral'}
            tone={lastRSI < 30 ? '#7ab87a' : lastRSI > 70 ? '#cc6666' : '#e6a85c'}
          />
          <SignalCard
            label="50 / 200"
            value={goldenCross ? 'Golden' : 'Death'}
            sub={goldenCross ? 'Bullish' : 'Bearish'}
            tone={goldenCross ? '#7ab87a' : '#cc6666'}
          />
          <SignalCard
            label="vs PL"
            value={btcPrice && techData ? (btcPrice / techData[techData.length - 1].pl * 100).toFixed(0) + '%' : '—'}
            sub="fair value"
            tone="#e6a85c"
          />
        </div>
      </div>

      {/* BTC PRICE + SMAs + PL */}
      <SectionTitle>BTC · 365 days · Power Law overlay</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-3 pb-4">
          {loadingHistory && !history ? (
            <div className="text-xs py-16 text-center" style={{ color: '#666' }}>Loading…</div>
          ) : techData ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={techData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="btcFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f7931a" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f7931a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#666' }} interval={Math.floor(techData.length / 6)} stroke="rgba(255,255,255,0.06)" />
                  <YAxis tick={{ fontSize: 9, fill: '#666' }} tickFormatter={v => fmtCompact(v)} stroke="rgba(255,255,255,0.06)" domain={['dataMin * 0.95', 'dataMax * 1.05']} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(10,8,10,0.95)', border: '1px solid rgba(247,147,26,0.2)', borderRadius: 8, fontSize: 11, backdropFilter: 'blur(8px)' }}
                    labelStyle={{ color: '#e6a85c', fontWeight: 600 }}
                    formatter={(v, n) => [v ? fmtCompact(v) : '—', n]}
                  />
                  <Area type="monotone" dataKey="price" stroke="#f7931a" strokeWidth={2.5} fill="url(#btcFill)" name="BTC" />
                  <Line type="monotone" dataKey="sma50" stroke="#7ab87a" strokeWidth={1.3} dot={false} name="SMA 50" />
                  <Line type="monotone" dataKey="sma200" stroke="#cc6666" strokeWidth={1.3} dot={false} name="SMA 200" />
                  <Line type="monotone" dataKey="pl" stroke="#e6a85c" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Power Law" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 px-2 justify-center">
                <LegendDot color="#f7931a" label="BTC" />
                <LegendDot color="#7ab87a" label="SMA 50" />
                <LegendDot color="#cc6666" label="SMA 200" />
                <LegendDot color="#e6a85c" label="PL" />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* RSI CHART */}
      <SectionTitle>RSI 14</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-3 pb-4">
          {techData ? (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={techData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#666' }} interval={Math.floor(techData.length / 6)} stroke="rgba(255,255,255,0.06)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#666' }} ticks={[0, 30, 50, 70, 100]} stroke="rgba(255,255,255,0.06)" />
                <Tooltip contentStyle={{ background: 'rgba(10,8,10,0.95)', border: '1px solid rgba(247,147,26,0.2)', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#e6a85c' }} formatter={v => [v?.toFixed(1), 'RSI']} />
                <ReferenceLine y={70} stroke="#cc6666" strokeDasharray="2 3" />
                <ReferenceLine y={30} stroke="#7ab87a" strokeDasharray="2 3" />
                <Line type="monotone" dataKey="rsi" stroke="#9945ff" strokeWidth={1.7} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="text-xs py-6 text-center" style={{ color: '#666' }}>Loading…</div>}
        </div>
      </div>

      {/* ALT PRICE STRIP */}
      <SectionTitle>Alts · Live Performance</SectionTitle>
      <div className="px-5 mb-5">
        <div className="space-y-2">
          {['ETH', 'SOL', 'LINK', 'SUI', 'SHIB'].map(sym => {
            const cfg = ASSET_CONFIG[sym];
            const p = prices[sym];
            const c1 = priceChanges[sym]?.d1;
            const c7 = priceChanges[sym]?.d7;
            return (
              <div key={sym} className="glass rounded-lg p-3 flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-sm" style={{ background: cfg.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm" style={{ color: '#ede8dd' }}>{sym}</span>
                    <span className="text-[10px]" style={{ color: '#666' }}>{cfg.name}</span>
                  </div>
                  <div className="mono text-[13px]" style={{ color: '#ede8dd' }}>{p ? (p < 0.01 ? '$' + p.toFixed(8) : '$' + p.toLocaleString('en-US', { maximumFractionDigits: p < 1 ? 4 : 2 })) : '—'}</div>
                </div>
                <div className="text-right">
                  <div className="mono text-[11px]" style={{ color: (c1 ?? 0) >= 0 ? '#7ab87a' : '#cc6666' }}>{c1 != null ? fmtPct(c1) : '—'}</div>
                  <div className="text-[9px] uppercase mono" style={{ color: '#555' }}>24h</div>
                </div>
                <div className="text-right">
                  <div className="mono text-[11px]" style={{ color: (c7 ?? 0) >= 0 ? '#7ab87a' : '#cc6666' }}>{c7 != null ? fmtPct(c7) : '—'}</div>
                  <div className="text-[9px] uppercase mono" style={{ color: '#555' }}>7d</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 mb-3">
        <div className="rounded-lg p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-start gap-2">
            <Info size={12} style={{ color: '#666', marginTop: '2px' }} />
            <div className="text-[10px] leading-relaxed" style={{ color: '#777' }}>
              Technical indicators describe the past. They do not predict cycle tops. One input among many. Discipline beats indicators.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SignalCard({ label, value, sub, tone }) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="text-[9px] uppercase tracking-widest" style={{ color: '#666' }}>{label}</div>
      <div className="serif text-2xl mt-0.5" style={{ color: tone, lineHeight: 1 }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: '#666' }}>{sub}</div>
    </div>
  );
}

// ============================================================
// UPDATE TAB
// ============================================================
function UpdateTab({ portfolio, applyJsonUpdate, resetPortfolio }) {
  const [pasteValue, setPasteValue] = useState('');
  const [pasteError, setPasteError] = useState(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const exported = JSON.stringify({ accounts: portfolio.accounts, traditional: portfolio.traditional }, null, 2);

  const handleApply = () => {
    setPasteError(null);
    try {
      const parsed = JSON.parse(pasteValue);
      if (!parsed.accounts || !Array.isArray(parsed.accounts)) throw new Error("Missing 'accounts' array");
      applyJsonUpdate(parsed);
      setPasteValue('');
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 2400);
    } catch (e) { setPasteError(e.message); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exported).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <>
      <div className="px-5 mt-1 mb-5">
        <div className="rounded-lg p-4" style={{
          background: 'linear-gradient(135deg, #0f0d18 0%, #0a0a0a 70%)',
          border: '1px solid rgba(153, 69, 255, 0.2)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Wand2 size={14} style={{ color: '#9945ff' }} />
            <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: '#9945ff' }}>How Updates Work</div>
          </div>
          <div className="text-[12px] leading-relaxed" style={{ color: '#a89880' }}>
            For weekly rebuilds (TA, news, briefing, forecasts): ask Claude in chat. You get a new file with only the snapshot block changed.
            <br /><br />
            For portfolio updates: edit holdings directly in the Vault tab (tap the pencil) or paste a JSON update from Claude below.
          </div>
        </div>
      </div>

      {/* PASTE */}
      <SectionTitle>Paste Update from Claude</SectionTitle>
      <div className="px-5 mb-5">
        <textarea
          value={pasteValue}
          onChange={e => setPasteValue(e.target.value)}
          placeholder='Paste JSON, e.g. { "accounts": [...], "traditional": {...} }'
          className="w-full mono text-[11px] p-3 rounded-lg"
          style={{ background: '#0a0a0a', color: '#ede8dd', border: '1px solid rgba(255,255,255,0.06)', minHeight: '120px', resize: 'vertical' }}
        />
        {pasteError && (
          <div className="text-[11px] mt-2 px-3 py-2 rounded" style={{ background: 'rgba(204,102,102,0.1)', color: '#cc6666', border: '1px solid rgba(204,102,102,0.2)' }}>
            {pasteError}
          </div>
        )}
        {pasteSuccess && (
          <div className="text-[11px] mt-2 px-3 py-2 rounded" style={{ background: 'rgba(122,184,122,0.1)', color: '#7ab87a', border: '1px solid rgba(122,184,122,0.2)' }}>
            Update applied successfully
          </div>
        )}
        <button
          onClick={handleApply}
          disabled={!pasteValue}
          className="w-full mt-3 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider"
          style={{
            background: pasteValue ? 'linear-gradient(135deg, #f7931a, #e6a85c)' : 'rgba(255,255,255,0.03)',
            color: pasteValue ? '#0a0a0a' : '#555',
            border: '1px solid ' + (pasteValue ? '#f7931a' : 'rgba(255,255,255,0.06)'),
            boxShadow: pasteValue ? '0 0 16px rgba(247,147,26,0.3)' : 'none',
          }}
        >
          <Wand2 size={13} /> Apply Update
        </button>
      </div>

      {/* EXPORT */}
      <SectionTitle>Export Current Portfolio</SectionTitle>
      <div className="px-5 mb-5">
        <div className="text-[11px] mb-2" style={{ color: '#666' }}>
          Share this with Claude so the next rebuild starts from accurate state.
        </div>
        <div className="relative">
          <pre className="mono text-[10px] p-3 rounded-lg overflow-auto scroll-touch" style={{ background: '#0a0a0a', color: '#888', border: '1px solid rgba(255,255,255,0.06)', maxHeight: '240px' }}>
{exported}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 text-[11px] px-2 py-1 rounded flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.06)', color: copied ? '#7ab87a' : '#999', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* META */}
      <SectionTitle>Meta</SectionTitle>
      <div className="px-5 mb-5">
        <div className="glass rounded-lg p-3.5">
          <div className="text-[11px] space-y-1.5" style={{ color: '#888' }}>
            <div className="flex justify-between"><span>Snapshot:</span><span className="mono" style={{ color: '#ede8dd' }}>{SNAPSHOT.refreshedAt}</span></div>
            <div className="flex justify-between"><span>Portfolio:</span><span className="mono" style={{ color: '#ede8dd' }}>{portfolio.refreshedAt}</span></div>
            <div className="flex justify-between"><span>Storage:</span><span className="mono" style={{ color: '#ede8dd' }}>{STORAGE_KEY}</span></div>
          </div>
        </div>

        <button
          onClick={() => { if (confirm('Reset portfolio to defaults? This restores the values from the file, not your latest edits.')) resetPortfolio(); }}
          className="w-full mt-3 py-2 text-[11px] flex items-center justify-center gap-2 rounded-lg uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.02)', color: '#666', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <RotateCcw size={11} /> Reset portfolio to file defaults
        </button>
      </div>
    </>
  );
}
