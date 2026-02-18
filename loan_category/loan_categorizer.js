/* ========= CONFIG ========= */
const MAX_LAKH = 120; // 1.2 Cr display cap (values above still show as Mega)
const ZONES = [
  { key: 'small',  name: 'Small loan',  min: 0,   max: 5,   color: 'var(--small)'  },
  { key: 'medium', name: 'Medium loan', min: 5,   max: 25,  color: 'var(--medium)' },
  { key: 'large',  name: 'Large loan',  min: 25,  max: 100, color: 'var(--large)'  },
  { key: 'mega',   name: 'Mega loan',   min: 100, max: MAX_LAKH, color: 'var(--mega)' },
];

// Optional: set to true to draw EQUAL angle arcs (visual balance) instead of proportional
const EQUAL_ARCS = false;

/* ========= HELPERS ========= */
const $ = (sel) => document.querySelector(sel);

const fmtINR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmtNumIN = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

function clamp(v, min, max){ return Math.min(Math.max(v, min), max); }
function toAngle(lakh){
  // Map [0, MAX_LAKH] to [-90°, +90°]
  const v = clamp(lakh, 0, MAX_LAKH);
  return -90 + (v / MAX_LAKH) * 180;
}
function classify(lakh){
  if (lakh < ZONES[1].min) return ZONES[0];
  if (lakh < ZONES[2].min) return ZONES[1];
  if (lakh < ZONES[3].min) return ZONES[2];
  return ZONES[3];
}
function parseRupees(s){
  if (!s) return 0;
  const clean = String(s).replace(/[^\d.]/g, '');
  const num = parseFloat(clean || '0');
  return isNaN(num) ? 0 : num;
}
function lakhFromInput(valueStr, unit){
  const val = parseRupees(valueStr);
  if (unit === 'lakh')  return val;
  if (unit === 'crore') return val * 100;
  // unit === 'inr' (₹)
  return val / 100000; // 1 lakh = 100,000
}
function prettyLabel(lakh){
  const rupees = lakh * 100000;
  const cr = lakh / 100;
  return `${fmtINR.format(rupees)} (${fmtNumIN.format(lakh)} Lakh${lakh !== 1 ? '' : ''}${cr >= 1 ? ` · ${fmtNumIN.format(cr)} Cr` : ''})`;
}

/* ========= SVG ARC MATH ========= */
function polarToCartesian(cx, cy, r, angleDeg){
  const rad = (angleDeg - 90) * Math.PI / 180.0;
  return { x: cx + (r * Math.cos(rad)), y: cy + (r * Math.sin(rad)) };
}
function describeArc(cx, cy, r, startAngle, endAngle){
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

/* ========= DRAW GAUGE ========= */
const svg = $('#gaugeSvg');
const zoneArcs = $('#zoneArcs');
const ticksGroup = $('#ticks');
const backArc = $('#backArc');
const needle = $('#needle');

const CX = 210, CY = 210, R = 180;

// Draw background arc (full 180°)
backArc.setAttribute('d', describeArc(CX, CY, R, -90, 90));

function drawZones(){
  zoneArcs.innerHTML = '';
  const segments = [];

  if (EQUAL_ARCS){
    // 4 equal arcs across 180°
    const step = 180 / ZONES.length;
    ZONES.forEach((z, i) => {
      const a0 = -90 + step*i;
      const a1 = a0 + step;
      segments.push({ z, a0, a1 });
    });
  } else {
    // proportionate to range sizes
    ZONES.forEach(z => {
      const a0 = toAngle(z.min);
      const a1 = toAngle(z.max);
      segments.push({ z, a0, a1 });
    });
  }

  segments.forEach(({z, a0, a1}) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', describeArc(CX, CY, R, a0, a1));
    p.setAttribute('class', `arc arc--${z.key}`);
    p.setAttribute('stroke', z.color);
    zoneArcs.appendChild(p);
  });
}
function drawTicks(){
  ticksGroup.innerHTML = '';
  const MAJORS = [0, 5, 25, 100, MAX_LAKH];
  const MINOR_PER_SEG = 4; // add minor ticks between majors

  function addTick(val, major=false, label=null){
    const a = toAngle(val);
    const inner = R - 4 - (major ? 18 : 10);
    const outer = R + 4;
    const p1 = polarToCartesian(CX, CY, inner, a);
    const p2 = polarToCartesian(CX, CY, outer, a);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
    line.setAttribute('class', `tick ${major ? 'tick--major' : ''}`);
    ticksGroup.appendChild(line);

    if (label){
      const labPos = polarToCartesian(CX, CY, R - 34, a);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labPos.x);
      text.setAttribute('y', labPos.y);
      text.setAttribute('class', 'tick-label');
      text.textContent = label;
      ticksGroup.appendChild(text);
    }
  }

  for (let i=0;i<MAJORS.length;i++){
    const v = MAJORS[i];
    const isLast = i === MAJORS.length-1;
    addTick(v, true, v===0 ? '0' : (v===5 ? '5L' : (v===25 ? '25L' : (v===100 ? '1Cr' : '1.2Cr'))));
    const next = MAJORS[i+1];
    if (!isLast){
      const step = (next - v) / (MINOR_PER_SEG+1);
      for (let k=1;k<=MINOR_PER_SEG;k++){
        addTick(v + step*k, false, null);
      }
    }
  }
}

drawZones();
drawTicks();

/* ========= UI BINDINGS ========= */
const amountInput = $('#amountInput');
const unitSelect = $('#unitSelect');
const amountRange = $('#amountRange');
const prettyAmount = $('#prettyAmount');
const categoryText = $('#categoryText');
const categoryBadge = $('#categoryBadge');
const copyBtn = $('#copyButton');
const copyToast = $('#copyToast');

function setBadge(zone){
  categoryText.textContent = zone.name;
  categoryBadge.textContent = zone.name;
  categoryBadge.style.borderColor = 'transparent';
  categoryBadge.style.boxShadow = 'none';
  categoryBadge.style.background = '#111827';

  zoneArcs.querySelectorAll('.arc').forEach(p => p.classList.remove('glow-small','glow-medium','glow-large','glow-mega'));
  const activeArc = zoneArcs.querySelector(`.arc--${zone.key}`);
  if (activeArc){
    activeArc.classList.add(`glow-${zone.key}`);
  }
}

function updateGauge(lakh){
  // Needle
  const angle = toAngle(clamp(lakh, 0, MAX_LAKH));
  needle.setAttribute('transform', `rotate(${angle},${CX},${CY})`);

  // Texts
  const z = classify(lakh);
  setBadge(z);

  // Pretty amount
  prettyAmount.textContent = prettyLabel(lakh);

  // Range sync (clamp to view max)
  amountRange.value = clamp(lakh, 0, MAX_LAKH).toFixed(2);
}

function syncFromInputs(){
  const lakh = lakhFromInput(amountInput.value, unitSelect.value);
  updateGauge(lakh);
}

function setAmountLakh(lakh){
  // Keep the text input consistent with selected unit
  const unit = unitSelect.value;
  if (unit === 'inr'){
    amountInput.value = Math.round(lakh * 100000).toString();
  } else if (unit === 'lakh'){
    amountInput.value = lakh;
  } else {
    amountInput.value = (lakh / 100);
  }
  updateGauge(lakh);
}

/* Events */
amountInput.addEventListener('input', syncFromInputs);
unitSelect.addEventListener('change', syncFromInputs);
amountRange.addEventListener('input', e => {
  const lakh = parseFloat(e.target.value);
  setAmountLakh(lakh);
});
document.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    const lakh = parseFloat(btn.dataset.lakh);
    setAmountLakh(lakh);
  });
});

copyBtn.addEventListener('click', async () => {
  const lakh = lakhFromInput(amountInput.value, unitSelect.value);
  const z = classify(lakh);
  try{
    await navigator.clipboard.writeText(z.name);
    copyToast.classList.add('toast--show');
    setTimeout(()=> copyToast.classList.remove('toast--show'), 1200);
  }catch(e){
    // fallback: select text visually
    alert(`Category: ${z.name}`);
  }
});

/* ========= INIT (start in Small loan zone) ========= */
setAmountLakh(3); // 3 Lakh default

/* ========= Public API (for EMI integration) =========
   Use window.setLoanAmountRupees(rupeesNumber) to set the loan from your EMI calculator.
*/
window.setLoanAmountRupees = function(rupees){
  const lakh = (parseFloat(rupees) || 0) / 100000;
  setAmountLakh(lakh);
}
