import React, { useState, useEffect, useRef, useCallback } from 'react';
import { domainsAPI } from '../api/domains';
import './CandlestickChart.css';

const PADDING = { top: 20, right: 60, bottom: 30, left: 70 };

function CandlestickChart({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 900, height: 480 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await domainsAPI.getCandlestickData();
        setData(res);
      } catch (e) {
        setError('Failed to load depot candlestick data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateDims = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDims({ width: Math.max(600, width), height: Math.max(380, height) });
    }
  }, []);

  useEffect(() => {
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, [updateDims]);

  if (loading) return <div className="candlestick-container"><div className="candlestick-loading">Loading depot data…</div></div>;
  if (error)   return <div className="candlestick-container"><div className="candlestick-error">{error}</div></div>;
  if (!data || !data.candles || data.candles.length === 0)
    return <div className="candlestick-container"><div className="candlestick-empty">No data available.</div></div>;

  const candles = data.candles;

  // Layout
  const chartH  = Math.floor((dims.height - PADDING.top - PADDING.bottom) * 0.68);
  const volumeH  = Math.floor((dims.height - PADDING.top - PADDING.bottom) * 0.22);
  const gapH     = Math.floor((dims.height - PADDING.top - PADDING.bottom) * 0.10);
  const chartTop = PADDING.top;
  const volTop   = chartTop + chartH + gapH;
  const chartW   = dims.width - PADDING.left - PADDING.right;
  const candleSlot = chartW / candles.length;
  const candleW    = Math.max(2, Math.min(16, candleSlot - 2));

  // Price scale
  const prices   = candles.flatMap(c => [c.high, c.low]);
  const priceMin = Math.min(...prices) * 0.999;
  const priceMax = Math.max(...prices) * 1.001;
  const pRange   = priceMax - priceMin;
  const toY      = (p) => chartTop + chartH - ((p - priceMin) / pRange) * chartH;
  const toX      = (i) => PADDING.left + (i + 0.5) * candleSlot;

  // Volume scale
  const maxVol  = Math.max(...candles.map(c => c.volume));
  const toVolY  = (v) => volTop + volumeH - (v / maxVol) * volumeH;

  // Y-axis ticks
  const tickCount = 6;
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const val = priceMin + (i / (tickCount - 1)) * pRange;
    return { val, y: toY(val) };
  });

  // X-axis ticks (roughly 8 labels across)
  const xTickStep = Math.max(1, Math.floor(candles.length / 8));
  const xTicks    = candles
    .map((c, i) => ({ i, date: c.date }))
    .filter((_, i) => i % xTickStep === 0);

  const handleMouseEnter = (candle) => (e) => {
    setTooltip({ candle, clientX: e.clientX, clientY: e.clientY });
  };
  const handleMouseMove = (candle) => (e) => {
    setTooltip({ candle, clientX: e.clientX, clientY: e.clientY });
  };

  return (
    <div className="candlestick-container" ref={containerRef}>
      <div className="candlestick-header">
        <span className="candlestick-symbol">{data.symbol}</span>
        <span className="candlestick-name">{data.name}</span>
        <span className="candlestick-legend">
          <span className="legend-bull">▮ Bullish</span>
          <span className="legend-bear">▮ Bearish</span>
          <span className="legend-massive-buy">▲ Massive Buy</span>
          <span className="legend-massive-sell">▼ Massive Sell</span>
        </span>
      </div>

      <svg
        className="candlestick-svg"
        width={dims.width}
        height={dims.height}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Price grid lines */}
        {yTicks.map((t, i) => (
          <line key={i}
            x1={PADDING.left} x2={PADDING.left + chartW}
            y1={t.y} y2={t.y}
            stroke="#2a3a4a" strokeWidth={0.6} strokeDasharray="4,4"
          />
        ))}

        {/* Y-axis price labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={PADDING.left - 6} y={t.y + 4}
            textAnchor="end" fontSize={10} fill="#8899aa">
            {t.val.toFixed(2)}
          </text>
        ))}

        {/* X-axis date labels */}
        {xTicks.map(({ i, date }) => (
          <text key={i} x={toX(i)} y={chartTop + chartH + 14}
            textAnchor="middle" fontSize={9} fill="#8899aa">
            {date.slice(5)}
          </text>
        ))}

        {/* Candlesticks */}
        {candles.map((c, i) => {
          const x       = toX(i);
          const isBull  = c.close >= c.open;
          const color   = isBull ? '#26a69a' : '#ef5350';
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bodyH   = Math.max(1, bodyBot - bodyTop);
          const halfW   = candleW / 2;
          const isMassive = c.massive_buy || c.massive_sell;

          return (
            <g key={i}
              onMouseEnter={handleMouseEnter(c)}
              onMouseMove={handleMouseMove(c)}
            >
              {/* Wick (high-low) */}
              <line
                x1={x} x2={x}
                y1={toY(c.high)} y2={toY(c.low)}
                stroke={color} strokeWidth={1}
              />
              {/* Body (open-close) */}
              <rect
                x={x - halfW} y={bodyTop}
                width={candleW} height={bodyH}
                fill={color}
                stroke={isMassive ? '#ffffff' : color}
                strokeWidth={isMassive ? 1.5 : 0.3}
                opacity={0.9}
              />
              {/* Massive trade arrow marker */}
              {isMassive && (
                <text
                  x={x}
                  y={c.massive_buy ? toY(c.high) - 5 : toY(c.low) + 13}
                  textAnchor="middle"
                  fontSize={11}
                  fill={c.massive_buy ? '#26a69a' : '#ef5350'}
                  fontWeight="bold"
                >
                  {c.massive_buy ? '▲' : '▼'}
                </text>
              )}
            </g>
          );
        })}

        {/* Volume bars */}
        {candles.map((c, i) => {
          const x      = toX(i);
          const isBull = c.close >= c.open;
          const barTop = toVolY(c.volume);
          const barH   = volTop + volumeH - barTop;

          return (
            <rect key={i}
              x={x - candleW / 2} y={barTop}
              width={candleW} height={Math.max(1, barH)}
              fill={isBull ? '#26a69a44' : '#ef535044'}
            />
          );
        })}

        {/* "Volume" y-axis label (rotated) */}
        <text
          x={PADDING.left - 8}
          y={volTop + volumeH / 2}
          textAnchor="middle"
          fontSize={9}
          fill="#8899aa"
          transform={`rotate(-90, ${PADDING.left - 8}, ${volTop + volumeH / 2})`}
        >
          Volume
        </text>

        {/* Chart border */}
        <rect x={PADDING.left} y={chartTop} width={chartW} height={chartH}
          fill="none" stroke="#2a3a4a" strokeWidth={1} />

        {/* Volume border */}
        <rect x={PADDING.left} y={volTop} width={chartW} height={volumeH}
          fill="none" stroke="#2a3a4a" strokeWidth={1} />

        {/* Vertical crosshair */}
        {tooltip && (() => {
          const idx = candles.indexOf(tooltip.candle);
          if (idx < 0) return null;
          return (
            <line
              x1={toX(idx)} x2={toX(idx)}
              y1={chartTop} y2={chartTop + chartH}
              stroke="#ffffff33" strokeWidth={1} strokeDasharray="4,4"
              pointerEvents="none"
            />
          );
        })()}
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="candlestick-tooltip"
          style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 70 }}
        >
          <div className="tooltip-date">{tooltip.candle.date}</div>
          <div>O: <b>{tooltip.candle.open.toFixed(2)}</b></div>
          <div>H: <b>{tooltip.candle.high.toFixed(2)}</b></div>
          <div>L: <b>{tooltip.candle.low.toFixed(2)}</b></div>
          <div>C: <b>{tooltip.candle.close.toFixed(2)}</b></div>
          <div>Vol: <b>{(tooltip.candle.volume / 1e6).toFixed(2)}M</b></div>
          {tooltip.candle.massive_buy  && <div className="tooltip-massive-buy">▲ MASSIVE BUY</div>}
          {tooltip.candle.massive_sell && <div className="tooltip-massive-sell">▼ MASSIVE SELL</div>}
        </div>
      )}
    </div>
  );
}

export default CandlestickChart;
