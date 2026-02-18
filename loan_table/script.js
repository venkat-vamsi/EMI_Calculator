function calculateEMI() {
    const P = parseFloat(document.getElementById('loanAmount').value);
    const annualRate = parseFloat(document.getElementById('interestRate').value);
    const n = parseInt(document.getElementById('termMonths').value);

    if (!P || !annualRate || !n) {
        alert("Please enter valid loan details.");
        return;
    }

    const r = annualRate / 12 / 100;
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    
    document.getElementById('emiDisplay').value = "₹ " + emi.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

    const category = P > 500000 ? "Gold Loan Class" : "Standard Loan Class";
    document.getElementById('loanCategory').innerText = "Category: " + category;

    generateTable(P, r, n, emi);
}

function generateTable(P, r, n, emi)
{
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = "";
    
    let balance = P;
    let currentDate = new Date();
    let monthsProcessed = 0;
    let yearCounter = 1;

    while (monthsProcessed < n)
    {
        let currentCalendarYear = currentDate.getFullYear();
        let yearlyInterest = 0;
        let yearlyPrincipal = 0;
        let yearlyTotalPayment = 0;
        let monthRows = "";

        while (monthsProcessed < n && currentDate.getFullYear() === currentCalendarYear)
        {
            let interest = balance * r;
            let principal = emi - interest;
            
            if (monthsProcessed === n - 1)
            {
                principal = balance;
                balance = 0;
            } else
            {
                balance -= principal;
            }

            yearlyInterest += interest;
            yearlyPrincipal += principal;
            yearlyTotalPayment += emi;

            let monthLabel = currentDate.toLocaleString('default', { month: 'long' }) + "-" + currentDate.getFullYear();
            
            monthRows += `<tr class="month-row year-${yearCounter}" style="display: none;">
                <td style="text-align:left; padding-left: 40px;">${monthLabel}</td>
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
                <span class="toggle-btn" style="cursor:pointer; color: #355872; margin-right: 10px;" onclick="toggleMonths(${yearCounter}, this)">+</span>
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

function toggleMonths(yearNum, btn)
{
    const rows = document.getElementsByClassName(`year-${yearNum}`);
    for (let row of rows)
    {
        if (row.style.display === "none")
        {
            row.style.display = "table-row";
            btn.innerText = "-";
        }
        else
        {
            row.style.display = "none";
            btn.innerText = "+";
        }
    }
}