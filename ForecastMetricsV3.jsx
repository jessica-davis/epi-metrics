import React, { useState, useMemo } from 'react';
import { XAxis, YAxis, ResponsiveContainer, Area, ComposedChart, Bar, BarChart, Cell, Tooltip, Line, ReferenceLine, Legend } from 'recharts';

// EPISTORM color palette - blues and slates, avoiding red/green per Charting the Next Pandemic
const theme = {
  text: '#1a1a2e',
  textSecondary: '#475569',
  textMuted: '#64748b',
  border: '#e2e8f0',
  background: '#ffffff',
  backgroundAlt: '#f8fafc',
  primary: '#1e3a5f',
  accent: '#2563eb',
  accentLight: '#eff6ff',
  accentDark: '#1e40af',
  // Interval colors - blue gradient
  intervals: {
    pi95: '#1e40af',
    pi80: '#3b82f6', 
    pi50: '#60a5fa',
  },
  // Status colors - avoiding red/green, using blue spectrum
  status: {
    good: '#2563eb',      // Blue for hits/success
    caution: '#f59e0b',   // Amber for warnings
    miss: '#64748b',      // Slate gray for misses
    highlight: '#7c3aed', // Purple for emphasis
  },
  // Wave pattern color
  wave: '#e2e8f0',
};

// Wave border SVG component
const WaveBorder = ({ position = 'top', color = theme.wave }) => {
  const isTop = position === 'top';
  return (
    <div style={{ 
      width: '100%', 
      height: 24, 
      overflow: 'hidden',
      transform: isTop ? 'none' : 'rotate(180deg)',
      marginBottom: isTop ? -1 : 0,
      marginTop: isTop ? 0 : -1,
    }}>
      <svg viewBox="0 0 1200 24" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path 
          d="M0,12 C150,24 300,0 450,12 C600,24 750,0 900,12 C1050,24 1200,0 1200,12 L1200,24 L0,24 Z" 
          fill={color}
        />
      </svg>
    </div>
  );
};

// WIS calculation
const calculateWIS = (observed, median, intervals) => {
  let dispersion = 0;
  let overprediction = 0;
  let underprediction = 0;
  
  intervals.forEach(({ lower, upper, alpha }) => {
    dispersion += (upper - lower) * (alpha / 2);
    if (observed < lower) underprediction += (lower - observed) * alpha;
    if (observed > upper) overprediction += (observed - upper) * alpha;
  });
  
  const absError = Math.abs(observed - median);
  return { 
    total: (dispersion + overprediction + underprediction + absError * 0.5).toFixed(1),
    dispersion: dispersion.toFixed(1), 
    overprediction: overprediction.toFixed(1), 
    underprediction: underprediction.toFixed(1),
    absError: absError.toFixed(1)
  };
};

// PIS (Prediction Interval Score) calculation - includes both bounds
const calculatePIS = (observed, lower, upper, alpha) => {
  const width = upper - lower;
  let penalty = 0;
  
  if (observed < lower) {
    penalty = (2 / alpha) * (lower - observed);
  } else if (observed > upper) {
    penalty = (2 / alpha) * (observed - upper);
  }
  
  return {
    width: width.toFixed(1),
    penalty: penalty.toFixed(1),
    total: (width + penalty).toFixed(1),
    outsideLower: observed < lower,
    outsideUpper: observed > upper,
    inside: observed >= lower && observed <= upper,
  };
};

// Collapsible section for "Go Deeper"
const Collapsible = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 32 }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '16px 0', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 500, color: theme.accent,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
          <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        {title}
      </button>
      {open && <div style={{ paddingBottom: 24, fontSize: 14, lineHeight: 1.7, color: theme.textSecondary }}>{children}</div>}
    </div>
  );
};

// Alert/callout box - updated colors
const Callout = ({ type = 'info', title, children }) => {
  const styles = {
    info: { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ️' },
    warning: { bg: '#fef3c7', border: '#f59e0b', icon: '⚠️' },
    success: { bg: '#f0f9ff', border: '#0ea5e9', icon: '✓' },
  };
  const s = styles[type];
  return (
    <div style={{ 
      padding: '16px 20px', marginTop: 24, background: s.bg, 
      borderLeft: `3px solid ${s.border}`, borderRadius: '0 4px 4px 0',
    }}>
      {title && <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif" }}>{title}</div>}
      <div style={{ fontSize: 14, lineHeight: 1.6, color: theme.text }}>{children}</div>
    </div>
  );
};

// Navigation tabs
const TabNav = ({ active, setActive }) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'intervals', label: 'Prediction Intervals' },
    { id: 'wis', label: 'Weighted Interval Score' },
    { id: 'coverage', label: 'Coverage' },
  ];
  return (
    <div style={{ borderBottom: `1px solid ${theme.border}`, marginBottom: 40 }}>
      <nav style={{ display: 'flex', gap: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding: '12px 24px', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              color: active === t.id ? theme.accent : theme.textSecondary,
              borderBottom: active === t.id ? `2px solid ${theme.accent}` : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

// ========== OVERVIEW ==========
const Overview = () => (
  <div>
    <p style={{ fontSize: 17, lineHeight: 1.8, color: theme.text, marginBottom: 24 }}>
      Forecast evaluation helps us understand how well models predict future disease activity. 
      This guide explains the two primary metrics used by CDC's FluSight initiative to assess forecast quality.
    </p>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>
      <div style={{ padding: 24, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Weighted Interval Score (WIS)
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: theme.textSecondary, margin: 0 }}>
          Measures overall forecast accuracy by evaluating both the point prediction and the uncertainty bounds.
          Lower scores indicate better forecasts.
        </p>
      </div>
      <div style={{ padding: 24, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Coverage
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: theme.textSecondary, margin: 0 }}>
          Measures calibration — how often the prediction intervals contain the true value.
          A 95% interval should contain the truth about 95% of the time.
        </p>
      </div>
    </div>
    
    <Callout type="info" title="Before you begin">
      If you're unfamiliar with prediction intervals, start with that section first. Understanding intervals is essential for interpreting both WIS and coverage.
    </Callout>
  </div>
);

// ========== PREDICTION INTERVALS ==========
const IntervalsModule = () => {
  const [selectedPI, setSelectedPI] = useState('all');
  
  const forecastData = [
    { week: 'Week 1', observed: 1200, median: 1180, l95: 850, u95: 1510, l80: 950, u80: 1410, l50: 1080, u50: 1280 },
    { week: 'Week 2', observed: 1480, median: 1420, l95: 1020, u95: 1820, l80: 1150, u80: 1690, l50: 1300, u50: 1540 },
    { week: 'Week 3', observed: 1850, median: 1750, l95: 1280, u95: 2220, l80: 1420, u80: 2080, l50: 1600, u50: 1900 },
    { week: 'Week 4', observed: 2150, median: 2100, l95: 1550, u95: 2650, l80: 1720, u80: 2480, l50: 1920, u50: 2280 },
    { week: 'Week 5', observed: null, median: 2350, l95: 1720, u95: 2980, l80: 1920, u80: 2780, l50: 2140, u50: 2560 },
  ];

  // Transform data to show proper intervals with lower bounds
  const chartData = forecastData.map(d => ({
    ...d,
    // For area charts, we need both lower and upper
    range95: [d.l95, d.u95],
    range80: [d.l80, d.u80],
    range50: [d.l50, d.u50],
  }));

  return (
    <div>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: theme.text, marginBottom: 24 }}>
        A forecast isn't just a single number — it's a probability distribution. Prediction intervals 
        communicate <strong>how uncertain</strong> the model is about its prediction.
      </p>

      <div style={{ background: theme.backgroundAlt, borderRadius: 8, padding: 32, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.text, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Weekly Hospital Admissions Forecast
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', '95', '80', '50', 'none'].map(opt => (
              <button
                key={opt}
                onClick={() => setSelectedPI(opt)}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 4,
                  border: `1px solid ${selectedPI === opt ? theme.accent : theme.border}`,
                  background: selectedPI === opt ? theme.accentLight : 'white',
                  color: selectedPI === opt ? theme.accent : theme.textSecondary,
                  cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                {opt === 'all' ? 'All PIs' : opt === 'none' ? 'None' : `${opt}%`}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: theme.textMuted, fontFamily: "'IBM Plex Sans', sans-serif" }} axisLine={{ stroke: theme.border }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: theme.textMuted, fontFamily: "'IBM Plex Sans', sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v => v.toLocaleString()} />
            
            {/* 95% PI - shown as area from lower to upper */}
            {(selectedPI === 'all' || selectedPI === '95') && (
              <>
                <Area type="monotone" dataKey="u95" stroke="none" fill={theme.intervals.pi95} fillOpacity={0.15} />
                <Area type="monotone" dataKey="l95" stroke="none" fill={theme.background} fillOpacity={1} />
              </>
            )}
            {/* 80% PI */}
            {(selectedPI === 'all' || selectedPI === '80') && (
              <>
                <Area type="monotone" dataKey="u80" stroke="none" fill={theme.intervals.pi80} fillOpacity={0.25} />
                <Area type="monotone" dataKey="l80" stroke="none" fill={theme.backgroundAlt} fillOpacity={1} />
              </>
            )}
            {/* 50% PI */}
            {(selectedPI === 'all' || selectedPI === '50') && (
              <>
                <Area type="monotone" dataKey="u50" stroke="none" fill={theme.intervals.pi50} fillOpacity={0.4} />
                <Area type="monotone" dataKey="l50" stroke="none" fill={theme.backgroundAlt} fillOpacity={1} />
              </>
            )}
            
            <Line type="monotone" dataKey="median" stroke={theme.accent} strokeWidth={2} dot={{ r: 4, fill: theme.accent }} name="Median forecast" />
            <Line type="monotone" dataKey="observed" stroke={theme.primary} strokeWidth={2.5} dot={{ r: 5, fill: theme.primary, strokeWidth: 2, stroke: 'white' }} connectNulls={false} name="Observed" />
            
            <ReferenceLine x="Week 4" stroke={theme.border} strokeDasharray="4 4" label={{ value: 'Today', position: 'top', fontSize: 11, fill: theme.textMuted }} />
            <Tooltip 
              contentStyle={{ borderRadius: 6, border: `1px solid ${theme.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: "'IBM Plex Sans', sans-serif" }}
              formatter={(value, name) => [value?.toLocaleString() || '—', name]}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, fontSize: 12, color: theme.textMuted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 3, background: theme.primary, borderRadius: 1 }}></span> Observed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 3, background: theme.accent, borderRadius: 1 }}></span> Median forecast
          </span>
          {selectedPI !== 'none' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, background: theme.intervals.pi50, borderRadius: 2, opacity: 0.6 }}></span> Prediction intervals
            </span>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>Interpreting Prediction Intervals</h3>
      
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16, padding: 16, background: theme.backgroundAlt, borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 48, height: 24, background: theme.intervals.pi50, borderRadius: 4, opacity: 0.7 }}></div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>50% Prediction Interval</div>
            <div style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6 }}>
              The model expects the true value to fall within this range about half the time. 
              A narrower "best guess" range.
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16, padding: 16, background: theme.backgroundAlt, borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 56, height: 24, background: theme.intervals.pi80, borderRadius: 4, opacity: 0.6 }}></div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>80% Prediction Interval</div>
            <div style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6 }}>
              A wider range the model expects to contain the true value 80% of the time. 
              Useful for planning scenarios.
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16, padding: 16, background: theme.backgroundAlt, borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 24, background: theme.intervals.pi95, borderRadius: 4, opacity: 0.4 }}></div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>95% Prediction Interval</div>
            <div style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6 }}>
              The widest interval — the model expects only 5% of observations to fall outside this range. 
              Represents near-worst-case bounds.
            </div>
          </div>
        </div>
      </div>

      <Callout type="info">
        <strong>The key tradeoff:</strong> Narrow intervals are more useful for decision-making but risk missing the true value. 
        Wide intervals are "safer" but less informative. A good forecast is as narrow as possible while still being accurate.
      </Callout>

      <Collapsible title="Technical details: Quantiles and intervals">
        <p>
          FluSight forecasts are submitted as a set of quantiles (0.01, 0.025, 0.05, 0.1, 0.15, ..., 0.9, 0.95, 0.975, 0.99). 
          Prediction intervals are constructed from symmetric pairs:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>50% PI: 25th to 75th percentile</li>
          <li>80% PI: 10th to 90th percentile</li>
          <li>95% PI: 2.5th to 97.5th percentile</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <strong>Reference:</strong> Reich et al. (2019). "A collaborative multiyear, multimodel assessment of seasonal influenza forecasting." PNAS.
        </p>
      </Collapsible>
    </div>
  );
};

// ========== WIS MODULE ==========
const WISModule = () => {
  const [observed, setObserved] = useState(2000);
  const [width, setWidth] = useState(100);
  
  const median = 2000;
  const scale = width / 100;
  const intervals = [
    { lower: median - 400 * scale, upper: median + 400 * scale, alpha: 0.05, name: '95%' },
    { lower: median - 280 * scale, upper: median + 280 * scale, alpha: 0.2, name: '80%' },
    { lower: median - 160 * scale, upper: median + 160 * scale, alpha: 0.5, name: '50%' },
  ];
  
  const wis = useMemo(() => calculateWIS(observed, median, intervals), [observed, width]);
  
  // Calculate PIS for each interval - showing both lower and upper bound effects
  const pis95 = useMemo(() => calculatePIS(observed, intervals[0].lower, intervals[0].upper, 0.05), [observed, width]);
  const pis50 = useMemo(() => calculatePIS(observed, intervals[2].lower, intervals[2].upper, 0.5), [observed, width]);
  
  const in95 = observed >= intervals[0].lower && observed <= intervals[0].upper;
  const in50 = observed >= intervals[2].lower && observed <= intervals[2].upper;
  
  // Position calculations for visualization
  const minVal = 1200, maxVal = 2800;
  const toPercent = (v) => ((v - minVal) / (maxVal - minVal)) * 100;

  return (
    <div>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: theme.text, marginBottom: 24 }}>
        The <strong>Weighted Interval Score (WIS)</strong> is the primary metric for evaluating probabilistic forecasts in FluSight. 
        It rewards forecasts that are both accurate and appropriately confident.
      </p>

      <div style={{ 
        padding: '12px 16px', marginBottom: 32, background: theme.accentLight, 
        borderRadius: 6, fontSize: 15, fontWeight: 500, color: theme.accent,
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span style={{ fontSize: 18 }}>↓</span>
        Lower WIS = Better forecast
      </div>

      {/* Interactive visualization */}
      <div style={{ background: theme.backgroundAlt, borderRadius: 8, padding: 32, marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: 15, fontWeight: 600, color: theme.text, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Interactive: How WIS responds to forecast errors
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>
              Observed value
            </label>
            <input
              type="range" min={minVal} max={maxVal} value={observed}
              onChange={e => setObserved(Number(e.target.value))}
              style={{ width: '100%', accentColor: theme.accent }}
            />
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.primary, marginTop: 8, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {observed.toLocaleString()}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>
              Interval width
            </label>
            <input
              type="range" min={30} max={150} value={width}
              onChange={e => setWidth(Number(e.target.value))}
              style={{ width: '100%', accentColor: theme.accent }}
            />
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.accent, marginTop: 8, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {width}%
            </div>
          </div>
        </div>

        {/* Visual interval representation - with clear lower and upper bounds */}
        <div style={{ position: 'relative', height: 100, marginBottom: 24 }}>
          {/* Scale line */}
          <div style={{ position: 'absolute', top: 50, left: 0, right: 0, height: 1, background: theme.border }}></div>
          
          {/* Scale labels */}
          {[1200, 1600, 2000, 2400, 2800].map(v => (
            <div key={v} style={{ position: 'absolute', top: 58, left: `${toPercent(v)}%`, transform: 'translateX(-50%)', fontSize: 11, color: theme.textMuted, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {v.toLocaleString()}
            </div>
          ))}
          
          {/* Intervals with visible lower and upper bounds */}
          {intervals.map((int, i) => (
            <React.Fragment key={i}>
              {/* Interval band */}
              <div style={{
                position: 'absolute', top: 32 + i * 5, height: 36 - i * 8,
                left: `${toPercent(int.lower)}%`,
                width: `${toPercent(int.upper) - toPercent(int.lower)}%`,
                background: theme.intervals.pi95,
                opacity: 0.1 + i * 0.1,
                borderRadius: 4,
              }}></div>
              {/* Lower bound marker */}
              <div style={{
                position: 'absolute', top: 28 + i * 5, 
                left: `${toPercent(int.lower)}%`,
                width: 2, height: 44 - i * 8,
                background: theme.intervals.pi95,
                opacity: 0.4 + i * 0.2,
              }}></div>
              {/* Upper bound marker */}
              <div style={{
                position: 'absolute', top: 28 + i * 5, 
                left: `${toPercent(int.upper)}%`,
                width: 2, height: 44 - i * 8,
                background: theme.intervals.pi95,
                opacity: 0.4 + i * 0.2,
              }}></div>
            </React.Fragment>
          ))}
          
          {/* Median line */}
          <div style={{ 
            position: 'absolute', top: 20, left: `${toPercent(median)}%`, 
            width: 2, height: 36, background: theme.accent,
          }}></div>
          <div style={{ 
            position: 'absolute', top: 8, left: `${toPercent(median)}%`, 
            transform: 'translateX(-50%)', fontSize: 10, color: theme.accent, fontWeight: 600,
          }}>Median</div>
          
          {/* Observed marker */}
          <div style={{ 
            position: 'absolute', top: 24, left: `${toPercent(observed)}%`, 
            transform: 'translateX(-50%)',
          }}>
            <div style={{ 
              width: 16, height: 16, borderRadius: '50%', 
              background: theme.primary, border: '3px solid white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}></div>
          </div>
          
          {/* Lower/Upper bound labels */}
          <div style={{ position: 'absolute', top: 76, left: `${toPercent(intervals[0].lower)}%`, transform: 'translateX(-50%)', fontSize: 9, color: theme.textMuted }}>
            L95
          </div>
          <div style={{ position: 'absolute', top: 76, left: `${toPercent(intervals[0].upper)}%`, transform: 'translateX(-50%)', fontSize: 9, color: theme.textMuted }}>
            U95
          </div>
        </div>

        {/* WIS Score breakdown */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16,
          padding: 20, background: 'white', borderRadius: 8, border: `1px solid ${theme.border}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.primary, fontFamily: "'IBM Plex Sans', sans-serif" }}>{wis.total}</div>
            <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>Total WIS</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: `1px solid ${theme.border}`, opacity: Number(wis.dispersion) > 0 ? 1 : 0.3 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.status.caution }}>{wis.dispersion}</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>Spread</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: `1px solid ${theme.border}`, opacity: Number(wis.overprediction) > 0 ? 1 : 0.3 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.status.highlight }}>{wis.overprediction}</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>Over</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: `1px solid ${theme.border}`, opacity: Number(wis.underprediction) > 0 ? 1 : 0.3 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.accent }}>{wis.underprediction}</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>Under</div>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 13, color: theme.textSecondary, textAlign: 'center' }}>
          {in95 && in50 && "Observed value is inside all intervals — minimal penalty"}
          {in95 && !in50 && "Observed is within 95% PI but outside 50% — moderate penalty"}
          {!in95 && observed < intervals[0].lower && "Observed is below 95% lower bound — significant underprediction penalty"}
          {!in95 && observed > intervals[0].upper && "Observed is above 95% upper bound — significant overprediction penalty"}
        </div>
      </div>

      {/* PIS Components - new section showing lower and upper bound scoring */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Prediction Interval Score (PIS) for 95% Interval
      </h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: theme.textSecondary, marginBottom: 16 }}>
        Each prediction interval contributes to WIS through the Prediction Interval Score, which penalizes both 
        <strong> interval width</strong> and <strong>boundary violations</strong> (either lower or upper).
      </p>
      
      <div style={{ background: theme.backgroundAlt, borderRadius: 8, padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: 'white', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Lower Bound
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: theme.primary, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {Math.round(intervals[0].lower).toLocaleString()}
            </div>
            <div style={{ 
              marginTop: 8, padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
              background: pis95.outsideLower ? '#fef3c7' : theme.accentLight,
              color: pis95.outsideLower ? theme.status.caution : theme.accent,
            }}>
              {pis95.outsideLower ? '⚠ Below' : '✓ Above'}
            </div>
          </div>
          <div style={{ padding: 16, background: 'white', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Interval Width
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: theme.status.caution, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {pis95.width}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: theme.textMuted }}>
              Width penalty
            </div>
          </div>
          <div style={{ padding: 16, background: 'white', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Upper Bound
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: theme.primary, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {Math.round(intervals[0].upper).toLocaleString()}
            </div>
            <div style={{ 
              marginTop: 8, padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
              background: pis95.outsideUpper ? '#fef3c7' : theme.accentLight,
              color: pis95.outsideUpper ? theme.status.caution : theme.accent,
            }}>
              {pis95.outsideUpper ? '⚠ Above' : '✓ Below'}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 16, padding: 12, background: 'white', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: theme.textSecondary }}>
            PIS = Width + Boundary Penalty
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color: theme.primary, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {pis95.width} + {pis95.penalty} = {pis95.total}
          </span>
        </div>
      </div>

      {/* WIS Components explanation */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>WIS Components</h3>
      
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'start', padding: 16, border: `1px solid ${theme.border}`, borderRadius: 6 }}>
          <div style={{ fontWeight: 600, color: theme.status.caution }}>Spread</div>
          <div style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6 }}>
            Penalizes wide intervals. A forecast saying "between 0 and 100,000" provides little actionable information, even if technically correct.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'start', padding: 16, border: `1px solid ${theme.border}`, borderRadius: 6 }}>
          <div style={{ fontWeight: 600, color: theme.status.highlight }}>Overprediction</div>
          <div style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6 }}>
            Applied when the observed value falls <strong>below the lower bound</strong> — the model predicted higher than reality.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'start', padding: 16, border: `1px solid ${theme.border}`, borderRadius: 6 }}>
          <div style={{ fontWeight: 600, color: theme.accent }}>Underprediction</div>
          <div style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6 }}>
            Applied when the observed value exceeds <strong>the upper bound</strong> — the model underestimated, potentially dangerous for resource planning.
          </div>
        </div>
      </div>

      {/* Relative WIS */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginTop: 32, marginBottom: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>Relative WIS</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: theme.textSecondary, marginBottom: 16 }}>
        Raw WIS values are difficult to interpret in isolation. FluSight compares each model's WIS to a 
        simple baseline model that predicts "next week equals this week."
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, background: theme.accentLight, borderRadius: 6, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: theme.accent }}>{'< 1.0'}</div>
          <div style={{ fontSize: 13, color: theme.accent, marginTop: 8 }}>Better than baseline</div>
        </div>
        <div style={{ padding: 20, background: '#fef3c7', borderRadius: 6, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: theme.status.caution }}>{'= 1.0'}</div>
          <div style={{ fontSize: 13, color: theme.status.caution, marginTop: 8 }}>Same as baseline</div>
        </div>
        <div style={{ padding: 20, background: '#f1f5f9', borderRadius: 6, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: theme.textSecondary }}>{'> 1.0'}</div>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 8 }}>Worse than baseline</div>
        </div>
      </div>

      <Callout type="warning" title="Common misconception: Lower WIS always means better">
        Some forecast targets are inherently harder than others. A 4-week ahead forecast will typically have higher WIS than 1-week ahead. 
        Small states with noisy data are harder to forecast than national-level. Always compare models on the same target, horizon, and time period.
      </Callout>

      <Callout type="warning" title="WIS can be gamed">
        A model could submit extremely wide intervals to guarantee it never misses — but would accumulate large spread penalties. 
        Conversely, overconfident narrow intervals look great until they fail catastrophically during rapid changes.
      </Callout>

      <Collapsible title="Technical details: WIS formula">
        <p>WIS approximates the Continuous Ranked Probability Score (CRPS) from quantile forecasts:</p>
        <div style={{ background: 'white', padding: 16, borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, margin: '12px 0', overflowX: 'auto' }}>
          WIS = (1/K) × Σ [ (u - l) × (α/2) + 2×(l - y)×𝟙(y {'<'} l) + 2×(y - u)×𝟙(y {'>'} u) ]
        </div>
        <p style={{ marginTop: 12 }}>Where <strong>l</strong> is the lower bound and <strong>u</strong> is the upper bound of each interval.</p>
        <p style={{ marginTop: 12 }}><strong>Reference:</strong> Bracher et al. (2021). "Evaluating epidemic forecasts in an interval format." PLOS Computational Biology.</p>
      </Collapsible>
    </div>
  );
};

// ========== COVERAGE MODULE ==========
const CoverageModule = () => {
  const [sampleSize, setSampleSize] = useState(20);
  const [seed, setSeed] = useState(0);
  
  // Generate deterministic random based on seed
  const generateCoverage = (n, target, s) => {
    const hits = [];
    for (let i = 0; i < n; i++) {
      const rand = Math.sin(s * 1000 + i * 9999) * 10000;
      hits.push((rand - Math.floor(rand)) < target);
    }
    return hits;
  };
  
  const hits95 = useMemo(() => generateCoverage(sampleSize, 0.95, seed), [sampleSize, seed]);
  const hits50 = useMemo(() => generateCoverage(sampleSize, 0.50, seed + 1), [sampleSize, seed]);
  
  const cov95 = ((hits95.filter(Boolean).length / sampleSize) * 100).toFixed(0);
  const cov50 = ((hits50.filter(Boolean).length / sampleSize) * 100).toFixed(0);

  const fluSightData = [
    { period: 'Nov 2024', coverage: 90 },
    { period: 'Dec 2024', coverage: 68 },
    { period: 'Jan 4', coverage: 6 },
    { period: 'Jan 18', coverage: 52 },
    { period: 'Feb 2025', coverage: 40 },
    { period: 'Mar 2025', coverage: 88 },
    { period: 'Apr 2025', coverage: 95 },
  ];

  // Coverage visualization helper - horizontal bar style instead of squares
  const CoverageBar = ({ hits, target, label }) => {
    const total = hits.length;
    const hitCount = hits.filter(Boolean).length;
    const coverage = (hitCount / total) * 100;
    const isCalibrated = Math.abs(coverage - target) < 15;
    
    return (
      <div style={{ background: 'white', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary }}>
            {label}
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted }}>
            Target: {target}%
          </div>
        </div>
        
        {/* Horizontal bar visualization */}
        <div style={{ position: 'relative', height: 32, background: theme.backgroundAlt, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
          {/* Hit segments */}
          <div style={{ 
            display: 'flex', 
            height: '100%',
            gap: 1,
          }}>
            {hits.map((hit, i) => (
              <div key={i} style={{
                flex: 1,
                background: hit ? theme.accent : theme.border,
                opacity: hit ? 1 : 0.4,
              }}></div>
            ))}
          </div>
          
          {/* Target line */}
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${target}%`,
            width: 2,
            background: theme.primary,
            opacity: 0.7,
          }}>
            <div style={{
              position: 'absolute',
              top: -16,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 9,
              color: theme.primary,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {target}%
            </div>
          </div>
        </div>
        
        {/* Result */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ 
              fontSize: 28, fontWeight: 700, 
              color: isCalibrated ? theme.accent : theme.status.caution,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              {coverage.toFixed(0)}%
            </span>
            <span style={{ fontSize: 13, color: theme.textMuted }}>observed</span>
          </div>
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: 4, 
            fontSize: 11, 
            fontWeight: 500,
            background: isCalibrated ? theme.accentLight : '#fef3c7',
            color: isCalibrated ? theme.accent : theme.status.caution,
          }}>
            {isCalibrated ? 'Well calibrated' : 'Needs attention'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: theme.text, marginBottom: 24 }}>
        <strong>Coverage</strong> measures calibration: how often the observed values fall within prediction intervals. 
        A well-calibrated 95% interval should contain the truth approximately 95% of the time.
      </p>

      {/* Interactive visualization - improved style */}
      <div style={{ background: theme.backgroundAlt, borderRadius: 8, overflow: 'hidden', marginBottom: 32 }}>
        <WaveBorder position="top" color={theme.accentLight} />
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.text, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Simulated forecast coverage
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ fontSize: 13, color: theme.textSecondary }}>
                Forecasts: 
                <input
                  type="range" min={10} max={50} value={sampleSize}
                  onChange={e => setSampleSize(Number(e.target.value))}
                  style={{ width: 80, marginLeft: 8, verticalAlign: 'middle', accentColor: theme.accent }}
                />
                <span style={{ marginLeft: 8, fontWeight: 600 }}>{sampleSize}</span>
              </label>
              <button
                onClick={() => setSeed(s => s + 1)}
                style={{
                  padding: '6px 16px', fontSize: 13, fontWeight: 500, borderRadius: 4,
                  border: `1px solid ${theme.border}`, background: 'white', cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Regenerate
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <CoverageBar hits={hits95} target={95} label="95% Prediction Interval" />
            <CoverageBar hits={hits50} target={50} label="50% Prediction Interval" />
          </div>
          
          <div style={{ marginTop: 16, padding: 12, background: 'white', borderRadius: 4, fontSize: 13, color: theme.textSecondary }}>
            Each segment represents one forecast. <span style={{ color: theme.accent, fontWeight: 600 }}>■</span> = hit (inside interval), 
            <span style={{ color: theme.border }}> ■</span> = miss (outside). The vertical line shows the target coverage.
          </div>
        </div>
        <WaveBorder position="bottom" color={theme.accentLight} />
      </div>

      {/* Sharpness vs calibration */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>Sharpness vs. Calibration</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: theme.textSecondary, marginBottom: 16 }}>
        Two forecasts can achieve the same coverage but provide very different value:
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, border: `2px solid ${theme.accent}`, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, color: theme.accent, marginBottom: 8 }}>Sharp and calibrated</div>
          <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>95% PI: [1,800 – 2,200]</div>
          <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>
            Narrow intervals that still capture the truth. Maximum decision-making value.
          </div>
        </div>
        <div style={{ padding: 20, border: `2px solid ${theme.status.caution}`, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, color: theme.status.caution, marginBottom: 8 }}>Calibrated but not useful</div>
          <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>95% PI: [0 – 50,000]</div>
          <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>
            Also achieves 95% coverage, but provides no actionable information.
          </div>
        </div>
      </div>

      {/* Real FluSight data */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>Real-world example: FluSight 2024–25</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: theme.textSecondary, marginBottom: 16 }}>
        95% coverage of the FluSight ensemble's 2-week ahead forecasts:
      </p>
      
      <div style={{ background: theme.backgroundAlt, borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={fluSightData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: theme.textMuted, fontFamily: "'IBM Plex Sans', sans-serif" }} axisLine={{ stroke: theme.border }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: theme.textMuted, fontFamily: "'IBM Plex Sans', sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <ReferenceLine y={95} stroke={theme.accent} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '95% target', position: 'right', fontSize: 10, fill: theme.accent }} />
            <Bar dataKey="coverage" radius={[3, 3, 0, 0]}>
              {fluSightData.map((d, i) => (
                <Cell key={i} fill={d.coverage >= 80 ? theme.accent : d.coverage >= 50 ? theme.status.caution : theme.status.miss} />
              ))}
            </Bar>
            <Tooltip formatter={v => [`${v}%`, 'Coverage']} contentStyle={{ borderRadius: 4, border: `1px solid ${theme.border}`, fontFamily: "'IBM Plex Sans', sans-serif" }} />
          </BarChart>
        </ResponsiveContainer>
        
        <div style={{ padding: 16, background: 'white', borderRadius: 6, marginTop: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>What happened?</div>
          <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.7, margin: 0 }}>
            Coverage dropped to just 6% at the January 4th peak. Rapid surges in hospitalizations are extremely difficult to predict — 
            models underestimate during exponential growth. Coverage recovered once activity stabilized in March.
          </p>
        </div>
      </div>

      <Callout type="warning" title="Coverage alone is not enough">
        A model with high coverage might simply be using very wide intervals. Always evaluate coverage alongside WIS, 
        which penalizes unnecessary width. The best forecasts are both well-calibrated (good coverage) and sharp (low WIS).
      </Callout>

      <Callout type="warning" title="Expect coverage drops during rapid change">
        Coverage below 95% isn't always a model failure — it often reflects genuine difficulty during epidemic transitions. 
        Evaluate coverage over the full season, not just peaks.
      </Callout>

      <Collapsible title="Technical details: Calculating coverage">
        <p>Coverage is the proportion of times the observed value falls within the prediction interval:</p>
        <div style={{ background: 'white', padding: 12, borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, margin: '12px 0' }}>
          Coverage = (# of hits) / (# of forecasts) × 100%
        </div>
        <p>Where a "hit" means: <strong>lower bound ≤ observed ≤ upper bound</strong></p>
        <p style={{ marginTop: 12 }}>
          <strong>Reference:</strong> Gneiting et al. (2007). "Probabilistic forecasts, calibration and sharpness." JRSS-B.
        </p>
      </Collapsible>
    </div>
  );
};

// ========== MAIN APP ==========
export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.background, 
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
      color: theme.text 
    }}>
      {/* Google Fonts link for IBM Plex */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>
      
      {/* Header with wave decoration */}
      <header style={{ background: theme.primary }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'white' }}>
                Forecast Evaluation Metrics
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                Technical documentation for public health practitioners
              </p>
            </div>
            <a 
              href="https://www.epistorm.org" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                fontSize: 13, 
                color: 'white', 
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.1)',
                transition: 'background 0.2s',
              }}
            >
              epistorm.org ↗
            </a>
          </div>
        </div>
        <WaveBorder position="bottom" color={theme.background} />
      </header>

      {/* Main */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px 64px' }}>
        <TabNav active={activeTab} setActive={setActiveTab} />
        
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'intervals' && <IntervalsModule />}
        {activeTab === 'wis' && <WISModule />}
        {activeTab === 'coverage' && <CoverageModule />}
      </main>

      {/* Footer with wave decoration */}
      <footer style={{ background: theme.backgroundAlt }}>
        <WaveBorder position="top" color={theme.backgroundAlt} />
        <div style={{ padding: '24px 32px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: theme.textMuted }}>
            Developed by <a href="https://www.epistorm.org" style={{ color: theme.accent, textDecoration: 'none' }}>EPISTORM</a> · 
            CDC cooperative agreement CDC-RFA-FT-23-0069
          </p>
        </div>
      </footer>
    </div>
  );
}
