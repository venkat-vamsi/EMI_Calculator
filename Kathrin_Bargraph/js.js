let emiChartInstance = null;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

document.getElementById('calcBtn').addEventListener('click', calculateEMI);
document.getElementById('resetBtn').addEventListener('click', resetForm);

function calculateEMI() {
  const P = parseFloat(document.getElementById('loan').value);
  const annualRate = parseFloat(document.getElementById('rate').value);
  const N = Math.floor(parseFloat(document.getElementById('term').value));

  if (isNaN(P) || isNaN(annualRate) || isNaN(N) || P <= 0 || N <= 0) {
    alert('Please enter valid positive values for loan and term. Interest can be zero.');
    return;
  }

  const R = annualRate / 12 / 100;
  let EMI = R === 0 ? P / N : (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);

  document.getElementById('result').innerText = `Your EMI is: ₹${EMI.toFixed(2)}`;

  let balance = P;
  const monthlyPrincipal = [];
  const monthlyInterest = [];
  const monthlyBalance = [];
  const labels = [];

  for (let i = 1; i <= N; i++) {
    const interest = R === 0 ? 0 : balance * R;
    let principal = EMI - interest;

    if (i === N) principal = balance; // final correction

    balance -= principal;

    monthlyPrincipal.push(principal);
    monthlyInterest.push(interest);
    monthlyBalance.push(balance); // ✅ record AFTER payment
    labels.push(`M${i}`);
  }

  if (emiChartInstance) emiChartInstance.destroy();

  const ctx = document.getElementById('emiChart').getContext('2d');

  emiChartInstance = new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: 'Principal',
          data: monthlyPrincipal,
          backgroundColor: '#355872',
          hoverBackgroundColor: '#2e4f63',
          stack: 'stack1',
          borderRadius: 6,
          order: 1
        },
        {
          type: 'bar',
          label: 'Interest',
          data: monthlyInterest,
          backgroundColor: '#9CD5FF',
          hoverBackgroundColor: '#7fc8ff',
          stack: 'stack1',
          borderRadius: 6,
          order: 1
        },
        {
          type: 'line',
          label: 'Remaining Balance',
          data: monthlyBalance,
          borderColor: '#7c3aed',
          borderWidth: 3,
          tension: 0.25,
          fill: false,
          yAxisID: 'yBalance',
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#7c3aed',
          pointHoverBackgroundColor: '#4c1d95',
          order: 99 // ensures line is drawn above bars
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Monthly EMI Breakdown with Remaining Balance',
          font: { size: 16, weight: '600' },
          color: '#0f172a'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw;
              if (label.includes('Balance')) {
                const paidPercent = ((P - value) / P * 100).toFixed(2);
                return `${label}: ${currencyFormatter.format(Math.round(value))} (Loan Paid: ${paidPercent}%)`;
              }
              return `${label}: ${currencyFormatter.format(Math.round(value))}`;
            }
          }
        }
      },
      scales: {
        x: { stacked: true, title: { display: true, text: 'Month' } },
        y: { stacked: true, title: { display: true, text: 'EMI Components ₹' } },
        yBalance: {
          position: 'right',
          title: { display: true, text: 'Remaining Balance ₹' },
          beginAtZero: true,
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function resetForm() {
  document.getElementById('loan').value = '';
  document.getElementById('rate').value = '';
  document.getElementById('term').value = '';
  document.getElementById('result').innerText = '';
  if (emiChartInstance) {
    emiChartInstance.destroy();
    emiChartInstance = null;
  }
}
