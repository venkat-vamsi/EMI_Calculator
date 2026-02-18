(function(){
	let chart = null;

	function computeSchedule(P, annualRate, nMonths){
		const labels = [];
		const principalArr = [];
		const interestArr = [];
		const emiArr = [];

		if(nMonths <= 0 || P <= 0) return {labels, principalArr, interestArr, emiArr};

		const r = (annualRate/100)/12;
		let EMI = 0;
		if(r === 0){
			EMI = P / nMonths;
		} else {
			const pow = Math.pow(1 + r, nMonths);
			EMI = P * r * pow / (pow - 1);
		}
		let remaining = P;

		for(let m=1; m<=nMonths; m++){
			const interest = r === 0 ? 0 : remaining * r;
			const principal = Math.max(0, EMI - interest);
			labels.push(String(m));
			principalArr.push(Number(principal.toFixed(2)));
			interestArr.push(Number(interest.toFixed(2)));
			emiArr.push(Number(EMI.toFixed(2)));
			remaining = Math.max(0, remaining - principal);
		}
		return {labels, principalArr, interestArr, emiArr};
	}

	function createChart(ctx){
		return new Chart(ctx, {
			type: 'bar',
			data: {
				labels: [],
				datasets: [
					{ label: 'Principal', data: [], backgroundColor: '#4A90E2', stack: 'stack1' },
					{ label: 'Interest', data: [], backgroundColor: '#90CAF9', stack: 'stack1' },
					{ label: 'EMI', data: [], type: 'line', borderColor: '#1C1C1E', backgroundColor: 'transparent', yAxisID: 'y1', fill: false, pointRadius: 0 }
				]
			},
			options: {
				scales: {
					y: { stacked: true, title: { display:true, text:'Amount' }, beginAtZero:true },
					y1: { position:'right', grid: { display:false }, title: { display:true, text:'EMI' }, beginAtZero:true }
				},
				plugins: { legend: { position: 'bottom' } },
				maintainAspectRatio: false,
				responsive: true
			}
		});
	}

	function updateChartValues(loan, rate, term){
		if(!chart) return;
		const schedule = computeSchedule(loan, rate, term);
		chart.data.labels = schedule.labels;
		chart.data.datasets[0].data = schedule.principalArr;
		chart.data.datasets[1].data = schedule.interestArr;
		chart.data.datasets[2].data = schedule.emiArr;
		chart.update();
	}

	// init once DOM is ready
	window.addEventListener('DOMContentLoaded', function(){
		const canvas = document.getElementById('emiChart');
		if(!canvas) return;
		const ctx = canvas.getContext('2d');

		// ensure parent has a height (index.html sets .chart-wrap height)
		const parent = canvas.parentElement;
		if(parent && !parent.style.height) parent.style.height = parent.offsetHeight ? parent.offsetHeight + 'px' : '360px';

		chart = createChart(ctx);

		// default small sample until parent posts real values
		updateChartValues(50000, 5, 12);
	});

	// listen for parent messages
	window.addEventListener('message', function(ev){
		try{
			const msg = ev.data;
			if(msg && msg.type === 'updateValues' && msg.data){
				const loan = Number(msg.data.loan) || 0;
				const rate = Number(msg.data.rate) || 0;
				const term = Math.max(0, Math.floor(Number(msg.data.term) || 0));
				// guard against huge term values (avoid performance issues)
				const safeTerm = Math.min(term, 360);
				updateChartValues(loan, rate, safeTerm);
			}
		}catch(e){}
	}, false);

})();
