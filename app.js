// Personal Finance Calculator JavaScript

class FinanceCalculator {
    constructor() {
        this.currentTab = 'sip';
        this.sipChart = null;
        this.swpChart = null;
        this.sipData = null;
        this.swpData = null;
        
        this.initializeEventListeners();
        this.formatInputs();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        document.getElementById('sip-form').addEventListener('submit', (e) => this.handleSIPSubmit(e));
        document.getElementById('swp-form').addEventListener('submit', (e) => this.handleSWPSubmit(e));

        // Reset buttons
        document.getElementById('sip-reset').addEventListener('click', () => this.resetSIP());
        document.getElementById('swp-reset').addEventListener('click', () => this.resetSWP());

        // PDF download buttons
        document.getElementById('sip-download-pdf').addEventListener('click', () => this.downloadSIPPDF());
        document.getElementById('swp-download-pdf').addEventListener('click', () => this.downloadSWPPDF());

        // Input formatting
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', (e) => this.validateInput(e));
            input.addEventListener('blur', (e) => this.formatCurrencyInput(e));
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content visibility
        document.querySelectorAll('.calculator-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-calculator`).classList.add('active');

        this.currentTab = tabName;

        // Preserve results by re-creating charts if data exists
        if (tabName === 'sip' && this.sipData) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.createSIPChart();
            }, 100);
        } else if (tabName === 'swp' && this.swpData) {
            setTimeout(() => {
                this.createSWPChart();
            }, 100);
        }
    }

    validateInput(e) {
        const input = e.target;
        const value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);

        // Remove existing error states
        input.classList.remove('error', 'success');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        if (input.value && (isNaN(value) || value < min || value > max)) {
            input.classList.add('error');
            const errorMsg = document.createElement('span');
            errorMsg.className = 'error-message';
            errorMsg.textContent = `Please enter a value between ${this.formatCurrency(min)} and ${this.formatCurrency(max)}`;
            input.parentNode.appendChild(errorMsg);
        } else if (input.value && value >= min && value <= max) {
            input.classList.add('success');
        }
    }

    formatCurrencyInput(e) {
        const input = e.target;
        if (input.id.includes('corpus') || input.id.includes('contribution') || input.id.includes('withdrawal')) {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                input.value = Math.round(value);
            }
        }
    }

    formatInputs() {
        // Add placeholder formatting to currency inputs
        document.querySelectorAll('input[placeholder]').forEach(input => {
            if (input.placeholder.includes(',')) {
                const value = input.placeholder.replace(/,/g, '');
                input.placeholder = this.formatCurrency(parseFloat(value)).replace('₹', '');
            }
        });
    }

    handleSIPSubmit(e) {
        e.preventDefault();
        
        const formData = {
            initialCorpus: parseFloat(document.getElementById('sip-initial-corpus').value) || 0,
            monthlyContribution: parseFloat(document.getElementById('sip-monthly-contribution').value),
            stepUpPercentage: parseFloat(document.getElementById('sip-stepup-percentage').value) || 0,
            expectedReturn: parseFloat(document.getElementById('sip-expected-return').value),
            years: parseInt(document.getElementById('sip-years').value)
        };

        if (this.validateSIPForm(formData)) {
            this.calculateSIP(formData);
        }
    }

    handleSWPSubmit(e) {
        e.preventDefault();
        
        const formData = {
            initialCorpus: parseFloat(document.getElementById('swp-initial-corpus').value),
            monthlyWithdrawal: parseFloat(document.getElementById('swp-monthly-withdrawal').value),
            inflationPercentage: parseFloat(document.getElementById('swp-inflation-percentage').value) || 0,
            expectedReturn: parseFloat(document.getElementById('swp-expected-return').value),
            years: parseInt(document.getElementById('swp-years').value)
        };

        if (this.validateSWPForm(formData)) {
            this.calculateSWP(formData);
        }
    }

    validateSIPForm(data) {
        const errors = [];
        
        if (!data.monthlyContribution || data.monthlyContribution < 500) {
            errors.push('Monthly contribution must be at least ₹500');
        }
        if (!data.expectedReturn || data.expectedReturn <= 0) {
            errors.push('Expected return must be greater than 0%');
        }
        if (!data.years || data.years < 1) {
            errors.push('Years must be at least 1');
        }

        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return false;
        }
        return true;
    }

    validateSWPForm(data) {
        const errors = [];
        
        if (!data.initialCorpus || data.initialCorpus < 1000) {
            errors.push('Initial corpus must be at least ₹1,000');
        }
        if (!data.monthlyWithdrawal || data.monthlyWithdrawal < 500) {
            errors.push('Monthly withdrawal must be at least ₹500');
        }
        if (!data.expectedReturn || data.expectedReturn <= 0) {
            errors.push('Expected return must be greater than 0%');
        }
        if (!data.years || data.years < 1) {
            errors.push('Years must be at least 1');
        }

        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return false;
        }
        return true;
    }

    calculateSIP(data) {
        const monthlyReturn = data.expectedReturn / 100 / 12;
        const totalMonths = data.years * 12;
        let currentBalance = data.initialCorpus;
        let totalInvestment = data.initialCorpus;
        let currentSIP = data.monthlyContribution;
        
        const monthlyData = [];
        const yearlyData = [];
        
        for (let month = 1; month <= totalMonths; month++) {
            // Apply returns first
            currentBalance = currentBalance * (1 + monthlyReturn);
            
            // Add SIP contribution
            currentBalance += currentSIP;
            totalInvestment += currentSIP;
            
            // Store monthly data for chart
            monthlyData.push({
                month: month,
                balance: currentBalance,
                investment: totalInvestment,
                returns: currentBalance - totalInvestment
            });
            
            // Check for yearly step-up
            if (month % 12 === 0 && month < totalMonths) {
                currentSIP = currentSIP * (1 + data.stepUpPercentage / 100);
                
                // Store yearly data
                yearlyData.push({
                    year: month / 12,
                    balance: currentBalance,
                    investment: totalInvestment,
                    returns: currentBalance - totalInvestment,
                    sip: currentSIP
                });
            }
        }

        // Add final year data if not already added
        if (totalMonths % 12 === 0 || yearlyData.length === 0) {
            yearlyData.push({
                year: data.years,
                balance: currentBalance,
                investment: totalInvestment,
                returns: currentBalance - totalInvestment,
                sip: currentSIP
            });
        }

        const finalBalance = currentBalance;
        const returnsAccumulated = finalBalance - totalInvestment;

        this.sipData = {
            finalBalance,
            totalInvestment,
            returnsAccumulated,
            monthlyData,
            yearlyData,
            inputData: data
        };

        this.displaySIPResults();
        this.createSIPChart();
    }

    calculateSWP(data) {
        const monthlyReturn = data.expectedReturn / 100 / 12;
        const totalMonths = data.years * 12;
        let currentBalance = data.initialCorpus;
        let totalWithdrawal = 0;
        let currentWithdrawal = data.monthlyWithdrawal;
        let totalReturns = 0;
        
        const monthlyData = [];
        const yearlyData = [];
        let corpusExhausted = false;
        let exhaustionMonth = 0;

        for (let month = 1; month <= totalMonths; month++) {
            if (currentBalance <= 0) {
                corpusExhausted = true;
                exhaustionMonth = month - 1;
                break;
            }
            
            // Apply returns first
            const monthlyReturns = currentBalance * monthlyReturn;
            currentBalance += monthlyReturns;
            totalReturns += monthlyReturns;
            
            // Deduct withdrawal
            const actualWithdrawal = Math.min(currentWithdrawal, currentBalance);
            currentBalance -= actualWithdrawal;
            totalWithdrawal += actualWithdrawal;
            
            // Store monthly data
            monthlyData.push({
                month: month,
                balance: Math.max(0, currentBalance),
                withdrawal: actualWithdrawal,
                totalWithdrawal: totalWithdrawal,
                returns: monthlyReturns,
                totalReturns: totalReturns
            });
            
            // Check for yearly inflation adjustment
            if (month % 12 === 0 && month < totalMonths) {
                currentWithdrawal = currentWithdrawal * (1 + data.inflationPercentage / 100);
                
                // Calculate yearly totals
                const yearlyWithdrawal = monthlyData.slice(-12).reduce((sum, m) => sum + m.withdrawal, 0);
                const yearlyReturns = monthlyData.slice(-12).reduce((sum, m) => sum + m.returns, 0);
                
                yearlyData.push({
                    year: month / 12,
                    monthlyWithdrawal: currentWithdrawal / (1 + data.inflationPercentage / 100), // Previous year's withdrawal
                    yearlyWithdrawal: yearlyWithdrawal,
                    yearlyReturns: yearlyReturns,
                    balance: Math.max(0, currentBalance)
                });
            }
        }

        // Handle final year if not complete
        if (!corpusExhausted && totalMonths % 12 !== 0) {
            const remainingMonths = totalMonths % 12;
            const partialYearWithdrawal = monthlyData.slice(-remainingMonths).reduce((sum, m) => sum + m.withdrawal, 0);
            const partialYearReturns = monthlyData.slice(-remainingMonths).reduce((sum, m) => sum + m.returns, 0);
            
            yearlyData.push({
                year: Math.ceil(totalMonths / 12),
                monthlyWithdrawal: currentWithdrawal,
                yearlyWithdrawal: partialYearWithdrawal,
                yearlyReturns: partialYearReturns,
                balance: Math.max(0, currentBalance),
                partial: true
            });
        }

        this.swpData = {
            finalBalance: Math.max(0, currentBalance),
            totalWithdrawal,
            returnsAccumulated: totalReturns,
            monthlyData,
            yearlyData,
            inputData: data,
            corpusExhausted,
            exhaustionMonth
        };

        this.displaySWPResults();
        this.createSWPChart();
        this.createSWPTable();
    }

    displaySIPResults() {
        const results = this.sipData;
        
        document.getElementById('sip-final-balance').textContent = this.formatCurrency(results.finalBalance);
        document.getElementById('sip-total-investment').textContent = this.formatCurrency(results.totalInvestment);
        document.getElementById('sip-returns-accumulated').textContent = this.formatCurrency(results.returnsAccumulated);
        
        document.getElementById('sip-results').classList.remove('hidden');
        
        // Add calculation status
        this.showCalculationStatus('sip', 'success', 'SIP calculation completed successfully!');
    }

    displaySWPResults() {
        const results = this.swpData;
        
        document.getElementById('swp-final-balance').textContent = this.formatCurrency(results.finalBalance);
        document.getElementById('swp-total-withdrawal').textContent = this.formatCurrency(results.totalWithdrawal);
        document.getElementById('swp-returns-accumulated').textContent = this.formatCurrency(results.returnsAccumulated);
        
        document.getElementById('swp-results').classList.remove('hidden');
        
        // Add warning if corpus gets exhausted
        if (results.corpusExhausted) {
            this.showCalculationStatus('swp', 'warning', 
                `Warning: Corpus will be exhausted after ${Math.floor(results.exhaustionMonth / 12)} years and ${results.exhaustionMonth % 12} months`);
        } else {
            this.showCalculationStatus('swp', 'success', 'SWP calculation completed successfully!');
        }
    }

    showCalculationStatus(type, status, message) {
        const resultsSection = document.getElementById(`${type}-results`);
        const existingStatus = resultsSection.querySelector('.calculation-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `calculation-status ${status}`;
        statusDiv.textContent = message;
        resultsSection.insertBefore(statusDiv, resultsSection.firstChild);
    }

    createSIPChart() {
        const ctx = document.getElementById('sip-chart').getContext('2d');
        
        if (this.sipChart) {
            this.sipChart.destroy();
        }

        const yearlyData = this.sipData.yearlyData;
        const labels = yearlyData.map(d => `Year ${d.year}`);
        const investmentData = yearlyData.map(d => d.investment);
        const returnsData = yearlyData.map(d => d.returns);

        this.sipChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Investment',
                        data: investmentData,
                        backgroundColor: '#1FB8CD',
                        borderColor: '#1FB8CD',
                        borderWidth: 1
                    },
                    {
                        label: 'Returns Accumulated',
                        data: returnsData,
                        backgroundColor: '#FFC185',
                        borderColor: '#FFC185',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'SIP Growth Over Time'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value / 100000).toFixed(1) + 'L';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                }
            }
        });
    }

    createSWPChart() {
        const ctx = document.getElementById('swp-chart').getContext('2d');
        
        if (this.swpChart) {
            this.swpChart.destroy();
        }

        const yearlyData = this.swpData.yearlyData;
        const labels = yearlyData.map(d => `Year ${d.year}`);
        const balanceData = yearlyData.map(d => d.balance);
        const withdrawalData = yearlyData.map(d => d.yearlyWithdrawal);

        this.swpChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Balance Remaining',
                        data: balanceData,
                        backgroundColor: '#1FB8CD',
                        borderColor: '#1FB8CD',
                        borderWidth: 1
                    },
                    {
                        label: 'Yearly Withdrawal',
                        data: withdrawalData,
                        backgroundColor: '#B4413C',
                        borderColor: '#B4413C',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'SWP Balance Decline Over Time'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value / 100000).toFixed(1) + 'L';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                }
            }
        });
    }

    createSWPTable() {
        const tableBody = document.querySelector('#swp-breakdown-table tbody');
        tableBody.innerHTML = '';

        this.swpData.yearlyData.forEach(yearData => {
            const row = document.createElement('tr');
            
            const yearText = yearData.partial ? `${yearData.year} (Partial)` : yearData.year;
            
            row.innerHTML = `
                <td>${yearText}</td>
                <td>${this.formatCurrency(yearData.monthlyWithdrawal)}</td>
                <td>${this.formatCurrency(yearData.yearlyWithdrawal)}</td>
                <td>${this.formatCurrency(yearData.yearlyReturns)}</td>
                <td>${this.formatCurrency(yearData.balance)}</td>
            `;
            
            if (yearData.balance === 0) {
                row.style.backgroundColor = 'rgba(var(--color-error-rgb), 0.1)';
            }
            
            tableBody.appendChild(row);
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    resetSIP() {
        document.getElementById('sip-form').reset();
        document.getElementById('sip-results').classList.add('hidden');
        
        if (this.sipChart) {
            this.sipChart.destroy();
            this.sipChart = null;
        }
        
        // Remove error states
        document.querySelectorAll('#sip-form .form-control').forEach(input => {
            input.classList.remove('error', 'success');
        });
        document.querySelectorAll('#sip-form .error-message').forEach(msg => msg.remove());
        
        this.sipData = null;
    }

    resetSWP() {
        document.getElementById('swp-form').reset();
        document.getElementById('swp-results').classList.add('hidden');
        
        if (this.swpChart) {
            this.swpChart.destroy();
            this.swpChart = null;
        }
        
        // Clear table
        document.querySelector('#swp-breakdown-table tbody').innerHTML = '';
        
        // Remove error states
        document.querySelectorAll('#swp-form .form-control').forEach(input => {
            input.classList.remove('error', 'success');
        });
        document.querySelectorAll('#swp-form .error-message').forEach(msg => msg.remove());
        
        this.swpData = null;
    }

    downloadSIPPDF() {
        if (!this.sipData) {
            alert('Please calculate SIP results first before downloading PDF');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Title
            pdf.setFontSize(20);
            pdf.text('SIP Calculator Report', 20, 20);
            
            // Date
            pdf.setFontSize(10);
            pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`, 20, 30);
            
            // Input Summary
            pdf.setFontSize(14);
            pdf.text('Input Parameters', 20, 45);
            pdf.setFontSize(10);
            const inputs = [
                `Initial Corpus: ${this.formatCurrency(this.sipData.inputData.initialCorpus)}`,
                `Monthly Contribution: ${this.formatCurrency(this.sipData.inputData.monthlyContribution)}`,
                `Yearly Step Up: ${this.sipData.inputData.stepUpPercentage}%`,
                `Expected Return: ${this.sipData.inputData.expectedReturn}% p.a.`,
                `Investment Period: ${this.sipData.inputData.years} years`
            ];
            
            let yPos = 55;
            inputs.forEach(input => {
                pdf.text(input, 25, yPos);
                yPos += 7;
            });
            
            // Results Summary
            pdf.setFontSize(14);
            pdf.text('Results Summary', 20, yPos + 10);
            pdf.setFontSize(10);
            yPos += 20;
            
            const results = [
                `Final Balance: ${this.formatCurrency(this.sipData.finalBalance)}`,
                `Total Investment: ${this.formatCurrency(this.sipData.totalInvestment)}`,
                `Returns Accumulated: ${this.formatCurrency(this.sipData.returnsAccumulated)}`,
                `Return Percentage: ${((this.sipData.returnsAccumulated / this.sipData.totalInvestment) * 100).toFixed(2)}%`
            ];
            
            results.forEach(result => {
                pdf.text(result, 25, yPos);
                yPos += 7;
            });
            
            // Add yearly breakdown table
            pdf.setFontSize(12);
            pdf.text('Year-wise Breakdown', 20, yPos + 15);
            yPos += 25;
            
            // Table headers
            pdf.setFontSize(8);
            pdf.text('Year', 25, yPos);
            pdf.text('Investment', 50, yPos);
            pdf.text('Returns', 90, yPos);
            pdf.text('Balance', 130, yPos);
            yPos += 7;
            
            // Table data
            this.sipData.yearlyData.forEach(yearData => {
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text(yearData.year.toString(), 25, yPos);
                pdf.text(this.formatCurrency(yearData.investment), 50, yPos);
                pdf.text(this.formatCurrency(yearData.returns), 90, yPos);
                pdf.text(this.formatCurrency(yearData.balance), 130, yPos);
                yPos += 7;
            });
            
            // Chart capture
            try {
                const canvas = document.getElementById('sip-chart');
                const chartImage = canvas.toDataURL('image/png', 1.0);
                
                if (yPos > 180) {
                    pdf.addPage();
                    yPos = 20;
                }
                
                pdf.addImage(chartImage, 'PNG', 20, yPos + 10, 170, 100);
            } catch (error) {
                console.error('Error adding chart to PDF:', error);
            }
            
            // Add new page for disclaimer
            pdf.addPage();
            pdf.setFontSize(12);
            pdf.text('Important Disclaimers', 20, 20);
            pdf.setFontSize(8);
            const disclaimers = [
                '• This is a hypothetical calculation for illustration purposes only.',
                '• Actual returns may vary based on market conditions and fund performance.',
                '• Past performance does not guarantee future results.',
                '• Please consult with a financial advisor before making investment decisions.',
                '• SIP investments are subject to market risks.',
                '• The calculations assume consistent monthly investments and compounding returns.'
            ];
            
            let disclaimerY = 35;
            disclaimers.forEach(disclaimer => {
                pdf.text(disclaimer, 20, disclaimerY);
                disclaimerY += 10;
            });
            
            pdf.save('SIP_Calculator_Report.pdf');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please ensure you have a stable internet connection and try again.');
        }
    }

    downloadSWPPDF() {
        if (!this.swpData) {
            alert('Please calculate SWP results first before downloading PDF');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Title
            pdf.setFontSize(20);
            pdf.text('SWP Calculator Report', 20, 20);
            
            // Date
            pdf.setFontSize(10);
            pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`, 20, 30);
            
            // Input Summary
            pdf.setFontSize(14);
            pdf.text('Input Parameters', 20, 45);
            pdf.setFontSize(10);
            const inputs = [
                `Initial Corpus: ${this.formatCurrency(this.swpData.inputData.initialCorpus)}`,
                `Monthly Withdrawal: ${this.formatCurrency(this.swpData.inputData.monthlyWithdrawal)}`,
                `Yearly Inflation: ${this.swpData.inputData.inflationPercentage}%`,
                `Expected Return: ${this.swpData.inputData.expectedReturn}% p.a.`,
                `Withdrawal Period: ${this.swpData.inputData.years} years`
            ];
            
            let yPos = 55;
            inputs.forEach(input => {
                pdf.text(input, 25, yPos);
                yPos += 7;
            });
            
            // Results Summary
            pdf.setFontSize(14);
            pdf.text('Results Summary', 20, yPos + 10);
            pdf.setFontSize(10);
            yPos += 20;
            
            const results = [
                `Final Balance: ${this.formatCurrency(this.swpData.finalBalance)}`,
                `Total Withdrawal: ${this.formatCurrency(this.swpData.totalWithdrawal)}`,
                `Returns Accumulated: ${this.formatCurrency(this.swpData.returnsAccumulated)}`
            ];
            
            if (this.swpData.corpusExhausted) {
                results.push(`Warning: Corpus exhausted after ${Math.floor(this.swpData.exhaustionMonth / 12)} years, ${this.swpData.exhaustionMonth % 12} months`);
            }
            
            results.forEach(result => {
                pdf.text(result, 25, yPos);
                yPos += 7;
            });
            
            // Chart capture
            try {
                const canvas = document.getElementById('swp-chart');
                const chartImage = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(chartImage, 'PNG', 20, yPos + 10, 170, 80);
            } catch (error) {
                console.error('Error adding chart to PDF:', error);
            }
            
            // New page for detailed breakdown
            pdf.addPage();
            pdf.setFontSize(14);
            pdf.text('Year-wise Detailed Breakdown', 20, 20);
            
            // Table headers
            pdf.setFontSize(8);
            const headers = ['Year', 'Monthly Withdrawal', 'Total Withdrawal', 'Returns Earned', 'Balance Left'];
            let tableY = 35;
            const colWidths = [20, 35, 35, 35, 35];
            let tableX = 20;
            
            headers.forEach((header, index) => {
                pdf.text(header, tableX, tableY);
                tableX += colWidths[index];
            });
            
            tableY += 10;
            
            // Table data
            this.swpData.yearlyData.forEach((yearData, index) => {
                if (tableY > 270) {
                    pdf.addPage();
                    tableY = 20;
                }
                
                tableX = 20;
                const rowData = [
                    yearData.partial ? `${yearData.year}*` : yearData.year.toString(),
                    this.formatCurrency(yearData.monthlyWithdrawal),
                    this.formatCurrency(yearData.yearlyWithdrawal),
                    this.formatCurrency(yearData.yearlyReturns),
                    this.formatCurrency(yearData.balance)
                ];
                
                rowData.forEach((data, colIndex) => {
                    pdf.text(data, tableX, tableY);
                    tableX += colWidths[colIndex];
                });
                
                tableY += 7;
            });
            
            // Add disclaimers
            if (tableY > 230) {
                pdf.addPage();
                tableY = 20;
            }
            
            pdf.setFontSize(8);
            if (this.swpData.yearlyData.some(y => y.partial)) {
                pdf.text('* Partial year', 20, tableY + 10);
                tableY += 15;
            }
            
            pdf.setFontSize(12);
            pdf.text('Important Disclaimers', 20, tableY + 10);
            pdf.setFontSize(8);
            const disclaimers = [
                '• This is a hypothetical calculation for illustration purposes only.',
                '• Actual returns may vary based on market conditions and fund performance.',
                '• Withdrawal calculations assume consistent monthly returns.',
                '• Inflation adjustments are applied annually to withdrawal amounts.',
                '• Please consult with a financial advisor before making withdrawal decisions.',
                '• SWP investments are subject to market risks and corpus depletion risk.'
            ];
            
            let disclaimerY = tableY + 25;
            disclaimers.forEach(disclaimer => {
                if (disclaimerY > 280) {
                    pdf.addPage();
                    disclaimerY = 20;
                }
                pdf.text(disclaimer, 20, disclaimerY);
                disclaimerY += 10;
            });
            
            pdf.save('SWP_Calculator_Report.pdf');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please ensure you have a stable internet connection and try again.');
        }
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FinanceCalculator();
});