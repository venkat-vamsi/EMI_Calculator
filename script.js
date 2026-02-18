// --- 1. Input Sync Logic ---
const pairs = [
    { num: 'amountnum', range: 'amountrange' },
    { num: 'interestnum', range: 'interestrange' },
    { num: 'tenurenum', range: 'tenurerange' }
];

pairs.forEach(pair => {
    const num = document.getElementById(pair.num);
    const range = document.getElementById(pair.range);
    num.addEventListener("input", () => { range.value = num.value; });
    range.addEventListener("input", () => { num.value = range.value; });
});

// --- 2. Global Chart Instances ---
let barChartInstance = null;
let pieChartInstance = null;

// --- 3. Master Calculate Function ---
function calculateAll() {
    const P = parseFloat(document.getElementById('amountnum').value);
    const annualRate = parseFloat(document.getElementById('interestnum').value);
    
    // Fixed: Now directly taking input as Months
    const n = parseInt(document.getElementById('tenurenum').value);

    if (!P || !annualRate || !n) {
        alert("Please enter valid positive numbers for all fields.");
        return;
    }

    const r = annualRate / 12 / 100;
    
    // Calculate EMI
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    // Display EMI
    document.getElementById('emiDisplay').value = "₹ " + emi.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    // Trigger updates for all modules
    updateSpeedometer(P);
    updatePieChart(P, totalInterest);
    updateBarChart(P, r, n, emi);
    generateTable(P, r, n, emi);
}

// --- 4. Speedometer / Loan Category Logic ---
function updateSpeedometer(amount) {
    let categoryName = "Small Loan";
    let rotation = -90; // Default (0L)

    if (amount <= 500000) { // Small: 0-5L
        categoryName = "Small Loan (0 - ₹5L)";
        rotation = -90 + (amount / 500000) * 45;
    } else if (amount <= 2500000) { // Medium: 5-25L
        categoryName = "Medium Loan (₹5L - ₹25L)";
        rotation = -45 + ((amount - 500000) / 2000000) * 45;
    } else if (amount <= 10000000) { // Large: 25L-1Cr
        categoryName = "Large Loan (₹25L - ₹1Cr)";
        rotation = 0 + ((amount - 2500000) / 7500000) * 45;
    } else { // Mega: 1Cr+
        categoryName = "Mega Loan (₹1Cr+)";
        rotation = 45 + Math.min(((amount - 10000000) / 50000000), 1) * 45; 
    }

    document.getElementById('needle').style.transform = `translateX(-50%) rotate(${rotation}deg)`;
    document.getElementById('categoryName').innerText = categoryName;
}

// --- 5. Pie Chart Logic ---
function updatePieChart(principal, interest) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    if (pieChartInstance) pieChartInstance.destroy(); // Clear old chart
    
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Principal Amount', 'Total Interest'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: ['#355872', '#9CD5FF'],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// --- 6. Bar Chart Logic ---
function updateBarChart(P, r, n, emi) {
    const ctx = document.getElementById('barChart').getContext('2d');
    
    // Generate arrays for graph
    const labels = [], principalArr = [], interestArr = [], emiArr = [];
    let balance = P;
    
    for (let m = 1; m <= n; m++) {
        let interest = balance * r;
        let principal = emi - interest;
        balance -= principal;

        labels.push(String(m));
        principalArr.push(principal.toFixed(0));
        interestArr.push(interest.toFixed(0));
        emiArr.push(emi.toFixed(0));
    }

    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Principal', data: principalArr, backgroundColor: '#355872', stack: 'Stack 1' },
                { label: 'Interest', data: interestArr, backgroundColor: '#9CD5FF', stack: 'Stack 1' },
                { label: 'EMI Trend', data: emiArr, type: 'line', borderColor: '#d63031', backgroundColor: 'transparent', fill: false, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

// --- 7. Amortization Table Logic ---
function generateTable(P, r, n, emi) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = "";
    
    let balance = P;
    let currentDate = new Date();
    let monthsProcessed = 0;
    let yearCounter = 1;

    while (monthsProcessed < n) {
        let currentCalendarYear = currentDate.getFullYear();
        let yearlyInterest = 0, yearlyPrincipal = 0, yearlyTotalPayment = 0;
        let monthRows = "";

        while (monthsProcessed < n && currentDate.getFullYear() === currentCalendarYear) {
            let interest = balance * r;
            let principal = emi - interest;
            
            if (monthsProcessed === n - 1) {
                principal = balance; balance = 0;
            } else { balance -= principal; }

            yearlyInterest += interest; yearlyPrincipal += principal; yearlyTotalPayment += emi;

            let monthLabel = currentDate.toLocaleString('default', { month: 'short' }) + "-" + currentDate.getFullYear();
            
            monthRows += `<tr class="month-row year-${yearCounter}" style="display: none;">
                <td style="text-align:left; padding-left: 30px;">${monthLabel}</td>
                <td>${emi.toFixed(0)}</td>
                <td>${interest.toFixed(0)}</td>
                <td>${principal.toFixed(0)}</td>
                <td>${Math.max(0, balance).toFixed(0)}</td>
            </tr>`;
            
            currentDate.setMonth(currentDate.getMonth() + 1);
            monthsProcessed++;
        }

        const yearRow = document.createElement('tr');
        yearRow.className = "year-row";
        yearRow.innerHTML = `
            <td style="text-align:left;">
                <span class="toggle-btn" onclick="toggleMonths(${yearCounter}, this)">+</span>
                ${yearCounter} (${currentCalendarYear})
            </td>
            <td>${yearlyTotalPayment.toFixed(0)}</td>
            <td>${yearlyInterest.toFixed(0)}</td>
            <td>${yearlyPrincipal.toFixed(0)}</td>
            <td>${Math.max(0, balance).toFixed(0)}</td>
        `;
        
        tableBody.appendChild(yearRow);
        tableBody.insertAdjacentHTML('beforeend', monthRows);
        yearCounter++;
    }
}

function toggleMonths(yearNum, btn) {
    const rows = document.getElementsByClassName(`year-${yearNum}`);
    for (let row of rows) {
        if (row.style.display === "none") {
            row.style.display = "table-row";
            btn.innerText = "-";
        } else {
            row.style.display = "none";
            btn.innerText = "+";
        }
    }
}

// Run calculation once on page load to populate default view
window.onload = calculateAll;