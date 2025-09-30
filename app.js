// Personal Finance Calculator JavaScript

class FinanceCalculator {
    constructor() {
        this.currentTab = 'sip';
        this.sipChart = null;
        this.swpChart = null;
        this.retirementCorpusChart = null;
        this.retirementIncomeExpenseChart = null;
        this.retirementSustainabilityChart = null;
        this.sipData = null;
        this.swpData = null;
        this.retirementData = null;
        
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
        document.getElementById('retirement-form').addEventListener('submit', (e) => this.handleRetirementSubmit(e));

        // Reset buttons
        document.getElementById('sip-reset').addEventListener('click', () => this.resetSIP());
        document.getElementById('swp-reset').addEventListener('click', () => this.resetSWP());
        document.getElementById('retirement-reset').addEventListener('click', () => this.resetRetirement());

        // PDF download buttons
        document.getElementById('sip-download-pdf').addEventListener('click', () => this.downloadSIPPDF());
        document.getElementById('swp-download-pdf').addEventListener('click', () => this.downloadSWPPDF());
        document.getElementById('retirement-download-pdf').addEventListener('click', () => this.downloadRetirementPDF());

        // Input formatting and validation
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', (e) => this.validateInput(e));
            input.addEventListener('blur', (e) => this.formatCurrencyInput(e));
            input.addEventListener('change', (e) => this.clearValidationErrors(e));
        });

        // Special validation for retirement age
        document.getElementById('retirement-retirement-age').addEventListener('input', () => this.validateRetirementAge());
        document.getElementById('retirement-current-age').addEventListener('input', () => this.validateRetirementAge());
        
        // Select field change handler
        document.getElementById('retirement-lifestyle-factor').addEventListener('change', (e) => this.clearValidationErrors(e));
    }

    clearValidationErrors(e) {
        const input = e.target;
        // Clear HTML5 validation states
        input.setCustomValidity('');
        
        // Remove visual error states
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
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
        setTimeout(() => {
            if (tabName === 'sip' && this.sipData) {
                this.createSIPChart();
            } else if (tabName === 'swp' && this.swpData) {
                this.createSWPChart();
            } else if (tabName === 'retirement' && this.retirementData) {
                this.createRetirementCharts();
            }
        }, 100);
    }

    validateInput(e) {
        const input = e.target;
        const value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);

        // Clear custom validity first
        input.setCustomValidity('');

        // Remove existing error states
        input.classList.remove('error', 'success');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        if (input.value && (isNaN(value) || value < min || value > max)) {
            input.classList.add('error');
            input.setCustomValidity(`Please enter a value between ${this.formatNumberForDisplay(min)} and ${this.formatNumberForDisplay(max)}`);
            const errorMsg = document.createElement('span');
            errorMsg.className = 'error-message';
            errorMsg.textContent = `Please enter a value between ${this.formatNumberForDisplay(min)} and ${this.formatNumberForDisplay(max)}`;
            input.parentNode.appendChild(errorMsg);
        } else if (input.value && value >= min && value <= max) {
            input.classList.add('success');
        }
    }

    validateRetirementAge() {
        const currentAge = parseInt(document.getElementById('retirement-current-age').value);
        const retirementAge = parseInt(document.getElementById('retirement-retirement-age').value);
        
        const retirementAgeInput = document.getElementById('retirement-retirement-age');
        const existingError = retirementAgeInput.parentNode.querySelector('.age-validation-error');
        if (existingError) {
            existingError.remove();
        }

        // Clear custom validity
        retirementAgeInput.setCustomValidity('');

        if (currentAge && retirementAge && retirementAge <= currentAge) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'age-validation-error';
            errorDiv.textContent = 'Retirement age must be greater than current age';
            retirementAgeInput.parentNode.appendChild(errorDiv);
            retirementAgeInput.classList.add('error');
            retirementAgeInput.setCustomValidity('Retirement age must be greater than current age');
        } else if (currentAge && retirementAge && retirementAge > currentAge) {
            retirementAgeInput.classList.remove('error');
            retirementAgeInput.classList.add('success');
        }
    }

    formatCurrencyInput(e) {
        const input = e.target;
        if (input.id.includes('corpus') || input.id.includes('contribution') || input.id.includes('withdrawal') || input.id.includes('savings') || input.id.includes('expenses')) {
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

    formatNumberForDisplay(num) {
        if (num >= 1000) {
            return this.formatCurrency(num);
        }
        return num.toString();
    }

    // SIP Calculator Methods
    handleSIPSubmit(e) {
        e.preventDefault();
        
        // Clear all custom validities before validation
        const form = e.target;
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.setCustomValidity('');
        });
        
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

    displaySIPResults() {
        const results = this.sipData;
        
        document.getElementById('sip-final-balance').textContent = this.formatCurrency(results.finalBalance);
        document.getElementById('sip-total-investment').textContent = this.formatCurrency(results.totalInvestment);
        document.getElementById('sip-returns-accumulated').textContent = this.formatCurrency(results.returnsAccumulated);
        
        document.getElementById('sip-results').classList.remove('hidden');
        
        // Add calculation status
        this.showCalculationStatus('sip', 'success', 'SIP calculation completed successfully!');
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

    resetSIP() {
        document.getElementById('sip-form').reset();
        document.getElementById('sip-results').classList.add('hidden');
        
        if (this.sipChart) {
            this.sipChart.destroy();
            this.sipChart = null;
        }
        
        // Remove error states and custom validity
        document.querySelectorAll('#sip-form .form-control').forEach(input => {
            input.classList.remove('error', 'success');
            input.setCustomValidity('');
        });
        document.querySelectorAll('#sip-form .error-message').forEach(msg => msg.remove());
        
        this.sipData = null;
    }

    // SWP Calculator Methods
    handleSWPSubmit(e) {
        e.preventDefault();
        
        // Clear all custom validities before validation
        const form = e.target;
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.setCustomValidity('');
        });
        
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

    resetSWP() {
        document.getElementById('swp-form').reset();
        document.getElementById('swp-results').classList.add('hidden');
        
        if (this.swpChart) {
            this.swpChart.destroy();
            this.swpChart = null;
        }
        
        // Clear table
        document.querySelector('#swp-breakdown-table tbody').innerHTML = '';
        
        // Remove error states and custom validity
        document.querySelectorAll('#swp-form .form-control').forEach(input => {
            input.classList.remove('error', 'success');
            input.setCustomValidity('');
        });
        document.querySelectorAll('#swp-form .error-message').forEach(msg => msg.remove());
        
        this.swpData = null;
    }

    // Retirement Calculator Methods
    handleRetirementSubmit(e) {
        e.preventDefault();
        
        // Clear all custom validities before validation
        const form = e.target;
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            input.setCustomValidity('');
        });
        
        const formData = {
            currentAge: parseInt(document.getElementById('retirement-current-age').value),
            retirementAge: parseInt(document.getElementById('retirement-retirement-age').value),
            currentSavings: parseFloat(document.getElementById('retirement-current-savings').value),
            monthlySavings: parseFloat(document.getElementById('retirement-monthly-savings').value),
            salaryGrowth: parseFloat(document.getElementById('retirement-salary-growth').value),
            expectedReturn: parseFloat(document.getElementById('retirement-expected-return').value),
            currentExpenses: parseFloat(document.getElementById('retirement-current-expenses').value),
            lifestyleFactor: parseFloat(document.getElementById('retirement-lifestyle-factor').value),
            inflationRate: parseFloat(document.getElementById('retirement-inflation-rate').value),
            lifeExpectancy: parseInt(document.getElementById('retirement-life-expectancy').value)
        };

        if (this.validateRetirementForm(formData)) {
            this.calculateRetirement(formData);
        }
    }

    validateRetirementForm(data) {
        const errors = [];
        
        if (!data.currentAge || data.currentAge < 18 || data.currentAge > 70) {
            errors.push('Current age must be between 18 and 70');
        }
        if (!data.retirementAge || data.retirementAge < 30 || data.retirementAge > 80) {
            errors.push('Retirement age must be between 30 and 80');
        }
        if (data.currentAge && data.retirementAge && data.retirementAge <= data.currentAge) {
            errors.push('Retirement age must be greater than current age');
        }
        if (data.currentSavings === undefined || data.currentSavings < 0) {
            errors.push('Current savings cannot be negative');
        }
        if (!data.monthlySavings || data.monthlySavings < 500) {
            errors.push('Monthly savings must be at least ₹500');
        }
        if (data.salaryGrowth === undefined || data.salaryGrowth < 0) {
            errors.push('Salary growth rate cannot be negative');
        }
        if (!data.expectedReturn || data.expectedReturn <= 0) {
            errors.push('Expected return must be greater than 0%');
        }
        if (!data.currentExpenses || data.currentExpenses < 1000) {
            errors.push('Current monthly expenses must be at least ₹1,000');
        }
        if (!data.lifestyleFactor) {
            errors.push('Please select a retirement lifestyle factor');
        }
        if (data.inflationRate === undefined || data.inflationRate < 0) {
            errors.push('Inflation rate cannot be negative');
        }
        if (!data.lifeExpectancy || data.lifeExpectancy < 75 || data.lifeExpectancy > 100) {
            errors.push('Life expectancy must be between 60 and 110');
        }
        if (data.retirementAge && data.lifeExpectancy && data.lifeExpectancy <= data.retirementAge) {
            errors.push('Life expectancy must be greater than retirement age');
        }

        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return false;
        }
        return true;
    }

    calculateRetirement(data) {
        const yearsToRetirement = data.retirementAge - data.currentAge;
        const retirementYears = data.lifeExpectancy - data.retirementAge;
        const monthlyReturn = data.expectedReturn / 100 / 12;
        const annualReturn = data.expectedReturn / 100;
        
        // Calculate corpus accumulation until retirement
        let currentCorpus = data.currentSavings;
        let currentMonthlySavings = data.monthlySavings;
        const corpusGrowthData = [];
        
        for (let year = 1; year <= yearsToRetirement; year++) {
            // Apply annual growth to existing corpus
            currentCorpus = currentCorpus * (1 + annualReturn);
            
            // Add yearly savings (12 months worth)
            const yearlySavings = currentMonthlySavings * 12;
            currentCorpus += yearlySavings;
            
            corpusGrowthData.push({
                year: year,
                age: data.currentAge + year,
                corpus: currentCorpus,
                annualSavings: yearlySavings,
                monthlySavings: currentMonthlySavings
            });
            
            // Apply salary growth for next year
            if (year < yearsToRetirement) {
                currentMonthlySavings = currentMonthlySavings * (1 + data.salaryGrowth / 100);
            }
        }
        
        const corpusAtRetirement = currentCorpus;
        
        // Calculate future expenses at retirement
        const futureMonthlyExpenses = data.currentExpenses * Math.pow(1 + data.inflationRate / 100, yearsToRetirement) * (data.lifestyleFactor / 100);
        const futureAnnualExpenses = futureMonthlyExpenses * 12;
        
        // Calculate sustainable monthly income using 4% withdrawal rule
        const sustainableMonthlyIncome = (corpusAtRetirement * 0.04) / 12;
        
        // Calculate surplus/deficit
        const monthlySurplusDeficit = sustainableMonthlyIncome - futureMonthlyExpenses;
        
        // Calculate retirement readiness score
        const readinessScore = Math.min(100, Math.max(0, (sustainableMonthlyIncome / futureMonthlyExpenses) * 100));
        
        // Calculate corpus sustainability during retirement
        const sustainabilityData = [];
        let remainingCorpus = corpusAtRetirement;
        let currentRetirementExpenses = futureMonthlyExpenses;
        
        for (let year = 1; year <= retirementYears; year++) {
            // Apply returns to remaining corpus
            remainingCorpus = remainingCorpus * (1 + annualReturn);
            
            // Deduct annual expenses
            const annualExpenses = currentRetirementExpenses * 12;
            remainingCorpus = Math.max(0, remainingCorpus - annualExpenses);
            
            sustainabilityData.push({
                year: year,
                age: data.retirementAge + year,
                corpus: remainingCorpus,
                monthlyExpenses: currentRetirementExpenses,
                annualExpenses: annualExpenses
            });
            
            // Apply inflation to expenses for next year
            currentRetirementExpenses = currentRetirementExpenses * (1 + data.inflationRate / 100);
            
            // Break if corpus is exhausted
            if (remainingCorpus <= 0) {
                break;
            }
        }
        
        // Generate recommendations
        const recommendations = this.generateRetirementRecommendations(data, {
            corpusAtRetirement,
            futureMonthlyExpenses,
            sustainableMonthlyIncome,
            readinessScore,
            yearsToRetirement,
            retirementYears
        });

        this.retirementData = {
            inputData: data,
            yearsToRetirement,
            retirementYears,
            corpusAtRetirement,
            futureMonthlyExpenses,
            sustainableMonthlyIncome,
            monthlySurplusDeficit,
            readinessScore,
            corpusGrowthData,
            sustainabilityData,
            recommendations
        };

        this.displayRetirementResults();
        this.createRetirementCharts();
        this.createRetirementTable();
    }

    generateRetirementRecommendations(inputData, calculatedData) {
        const recommendations = [];
        const { corpusAtRetirement, futureMonthlyExpenses, sustainableMonthlyIncome, readinessScore, yearsToRetirement } = calculatedData;
        
        // Readiness score based recommendations
        if (readinessScore >= 90) {
            recommendations.push({
                type: 'success',
                title: 'Excellent Retirement Preparedness',
                description: 'You are well-prepared for retirement. Consider diversifying your portfolio and exploring tax-efficient investment options.'
            });
        } else if (readinessScore >= 75) {
            recommendations.push({
                type: 'success',
                title: 'Good Retirement Preparedness',
                description: 'You are on track for a comfortable retirement. Consider increasing your savings slightly to build additional buffer.'
            });
        } else if (readinessScore >= 60) {
            recommendations.push({
                type: 'warning',
                title: 'Adequate but Needs Improvement',
                description: 'Your retirement planning needs attention. Consider increasing monthly savings or extending working years.'
            });
        } else {
            recommendations.push({
                type: 'error',
                title: 'Critical Retirement Gap',
                description: 'Urgent action needed. Significantly increase savings, reduce expenses, or consider working longer.'
            });
        }
        
        // Specific actionable recommendations
        if (sustainableMonthlyIncome < futureMonthlyExpenses) {
            const shortfall = futureMonthlyExpenses - sustainableMonthlyIncome;
            const additionalCorpusNeeded = shortfall * 12 / 0.04;
            const additionalMonthlySavings = this.calculateAdditionalSavingsNeeded(additionalCorpusNeeded, yearsToRetirement, inputData.expectedReturn);
            
            recommendations.push({
                type: 'warning',
                title: 'Increase Monthly Savings',
                description: `To bridge the gap, consider increasing monthly savings by ₹${this.formatNumber(additionalMonthlySavings)}`
            });
        }
        
        // Emergency fund recommendation
        const emergencyFundTarget = inputData.currentExpenses * 6;
        if (inputData.currentSavings < emergencyFundTarget) {
            recommendations.push({
                type: 'warning',
                title: 'Build Emergency Fund',
                description: `Maintain 6 months of expenses (₹${this.formatNumber(emergencyFundTarget)}) as emergency fund separate from retirement corpus.`
            });
        }
        
        // Healthcare inflation consideration
        recommendations.push({
            type: 'warning',
            title: 'Healthcare Cost Planning',
            description: 'Healthcare costs typically inflate at 8-10% annually. Consider health insurance and dedicated healthcare fund.'
        });
        
        // Tax planning
        recommendations.push({
            type: 'success',
            title: 'Tax-Efficient Investments',
            description: 'Maximize tax-saving investments like ELSS, PPF, and NPS to reduce current tax burden and build retirement corpus.'
        });
        
        return recommendations;
    }

    calculateAdditionalSavingsNeeded(additionalCorpus, years, expectedReturn) {
        const monthlyRate = expectedReturn / 100 / 12;
        const totalMonths = years * 12;
        
        // PMT calculation for additional corpus needed
        const pmt = (additionalCorpus * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        return Math.round(pmt);
    }

    displayRetirementResults() {
        const results = this.retirementData;
        
        // Update readiness score
        this.updateReadinessScore(results.readinessScore);
        
        // Update result cards
        document.getElementById('retirement-years-to-retirement').textContent = `${results.yearsToRetirement} years`;
        document.getElementById('retirement-corpus-at-retirement').textContent = this.formatCurrency(results.corpusAtRetirement);
        document.getElementById('retirement-monthly-income').textContent = this.formatCurrency(results.sustainableMonthlyIncome);
        document.getElementById('retirement-monthly-expenses').textContent = this.formatCurrency(results.futureMonthlyExpenses);
        
        const surplusDeficitElement = document.getElementById('retirement-surplus-deficit');
        surplusDeficitElement.textContent = this.formatCurrency(Math.abs(results.monthlySurplusDeficit));
        
        if (results.monthlySurplusDeficit >= 0) {
            surplusDeficitElement.className = 'result-value positive';
        } else {
            surplusDeficitElement.className = 'result-value negative';
        }
        
        // Display recommendations
        this.displayRecommendations(results.recommendations);
        
        document.getElementById('retirement-results').classList.remove('hidden');
        
        // Add calculation status
        if (results.readinessScore >= 75) {
            this.showCalculationStatus('retirement', 'success', 'Retirement planning analysis completed successfully!');
        } else if (results.readinessScore >= 60) {
            this.showCalculationStatus('retirement', 'warning', 'Retirement planning completed - improvement needed!');
        } else {
            this.showCalculationStatus('retirement', 'error', 'Critical retirement gap identified - urgent action required!');
        }
    }

    updateReadinessScore(score) {
        const scoreElement = document.getElementById('readiness-score-value');
        const textElement = document.getElementById('readiness-score-text');
        const progressElement = document.getElementById('readiness-progress');
        const circleElement = document.querySelector('.score-circle');
        
        scoreElement.textContent = Math.round(score) + '%';
        progressElement.style.width = score + '%';
        
        // Update text and color based on score
        let text, color;
        if (score >= 90) {
            text = 'Excellent - You\'re retirement ready!';
            color = 'var(--color-success)';
        } else if (score >= 75) {
            text = 'Good - Minor adjustments needed';
            color = 'var(--color-primary)';
        } else if (score >= 60) {
            text = 'Adequate - Needs improvement';
            color = 'var(--color-warning)';
        } else {
            text = 'Poor - Urgent action required';
            color = 'var(--color-error)';
        }
        
        textElement.textContent = text;
        
        // Update circle gradient
        const angle = (score / 100) * 360;
        circleElement.style.background = `conic-gradient(${color} ${angle}deg, var(--color-secondary) ${angle}deg)`;
    }

    displayRecommendations(recommendations) {
        const container = document.getElementById('retirement-recommendations');
        container.innerHTML = '';
        
        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = `recommendation-item ${rec.type}`;
            
            const iconClass = rec.type === 'success' ? 'success' : rec.type === 'warning' ? 'warning' : 'error';
            const iconSymbol = rec.type === 'success' ? '✓' : rec.type === 'warning' ? '!' : '×';
            
            item.innerHTML = `
                <div class="recommendation-icon ${iconClass}">${iconSymbol}</div>
                <div class="recommendation-content">
                    <h5>${rec.title}</h5>
                    <p>${rec.description}</p>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    createRetirementCharts() {
        this.createRetirementCorpusChart();
        this.createRetirementIncomeExpenseChart();
        this.createRetirementSustainabilityChart();
    }

    createRetirementCorpusChart() {
        const ctx = document.getElementById('retirement-corpus-chart').getContext('2d');
        
        if (this.retirementCorpusChart) {
            this.retirementCorpusChart.destroy();
        }

        const data = this.retirementData.corpusGrowthData;
        const labels = data.map(d => `Year ${d.year}`);
        const corpusData = data.map(d => d.corpus);
        const savingsData = data.map(d => d.annualSavings);

        this.retirementCorpusChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Corpus Growth',
                        data: corpusData,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Annual Savings',
                        data: savingsData,
                        type: 'bar',
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
                        text: 'Retirement Corpus Accumulation'
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
                }
            }
        });
    }

    createRetirementIncomeExpenseChart() {
        const ctx = document.getElementById('retirement-income-expense-chart').getContext('2d');
        
        if (this.retirementIncomeExpenseChart) {
            this.retirementIncomeExpenseChart.destroy();
        }

        const income = this.retirementData.sustainableMonthlyIncome;
        const expenses = this.retirementData.futureMonthlyExpenses;

        this.retirementIncomeExpenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Available Income', 'Monthly Expenses', 'Surplus/Buffer'],
                datasets: [{
                    data: [
                        Math.min(income, expenses),
                        expenses,
                        Math.max(0, income - expenses)
                    ],
                    backgroundColor: ['#1FB8CD', '#B4413C', '#5D878F'],
                    borderColor: ['#1FB8CD', '#B4413C', '#5D878F'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Retirement Income vs Expenses'
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ₹' + context.parsed.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        });
    }

    createRetirementSustainabilityChart() {
        const ctx = document.getElementById('retirement-sustainability-chart').getContext('2d');
        
        if (this.retirementSustainabilityChart) {
            this.retirementSustainabilityChart.destroy();
        }

        const data = this.retirementData.sustainabilityData.slice(0, 20); // Show first 20 years
        const labels = data.map(d => `Age ${d.age}`);
        const corpusData = data.map(d => d.corpus);
        const expensesData = data.map(d => d.annualExpenses);

        this.retirementSustainabilityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Remaining Corpus',
                        data: corpusData,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Annual Expenses',
                        data: expensesData,
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Corpus Sustainability During Retirement'
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
                }
            }
        });
    }

    createRetirementTable() {
        const tableBody = document.querySelector('#retirement-breakdown-table tbody');
        tableBody.innerHTML = '';

        // Show corpus growth data until retirement
        this.retirementData.corpusGrowthData.forEach(yearData => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${yearData.year}</td>
                <td>${yearData.age}</td>
                <td>${this.formatCurrency(yearData.annualSavings)}</td>
                <td>${this.formatCurrency(yearData.corpus)}</td>
                <td>-</td>
                <td>Growing</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add retirement years data (show first 10 years of retirement)
        const retirementData = this.retirementData.sustainabilityData.slice(0, 10);
        retirementData.forEach(yearData => {
            const row = document.createElement('tr');
            
            const sustainability = yearData.corpus > 0 ? 
                `${Math.round((yearData.corpus / this.retirementData.corpusAtRetirement) * 100)}%` : 
                'Exhausted';
            
            row.innerHTML = `
                <td>R+${yearData.year}</td>
                <td>${yearData.age}</td>
                <td>-</td>
                <td>${this.formatCurrency(yearData.corpus)}</td>
                <td>${this.formatCurrency(yearData.annualExpenses)}</td>
                <td>${sustainability}</td>
            `;
            
            if (yearData.corpus <= 0) {
                row.classList.add('corpus-exhausted');
            }
            
            tableBody.appendChild(row);
        });
    }

    resetRetirement() {
        document.getElementById('retirement-form').reset();
        document.getElementById('retirement-results').classList.add('hidden');
        
        // Destroy all retirement charts
        if (this.retirementCorpusChart) {
            this.retirementCorpusChart.destroy();
            this.retirementCorpusChart = null;
        }
        if (this.retirementIncomeExpenseChart) {
            this.retirementIncomeExpenseChart.destroy();
            this.retirementIncomeExpenseChart = null;
        }
        if (this.retirementSustainabilityChart) {
            this.retirementSustainabilityChart.destroy();
            this.retirementSustainabilityChart = null;
        }
        
        // Clear table
        document.querySelector('#retirement-breakdown-table tbody').innerHTML = '';
        
        // Remove error states and custom validity
        document.querySelectorAll('#retirement-form .form-control').forEach(input => {
            input.classList.remove('error', 'success');
            input.setCustomValidity('');
        });
        document.querySelectorAll('#retirement-form .error-message, #retirement-form .age-validation-error').forEach(msg => msg.remove());
        
        this.retirementData = null;
    }

    // Utility Methods
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

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatNumber(amount) {
        return new Intl.NumberFormat('en-IN').format(Math.round(amount));
    }

    // PDF Generation Methods (keeping existing methods intact)
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
            
            // Add disclaimers
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

    downloadRetirementPDF() {
        if (!this.retirementData) {
            alert('Please calculate retirement plan first before downloading PDF');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Title Page
            pdf.setFontSize(24);
            pdf.text('Comprehensive Retirement Planning Report', 20, 30);
            
            pdf.setFontSize(12);
            pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`, 20, 45);
            
            // Executive Summary
            pdf.setFontSize(16);
            pdf.text('Executive Summary', 20, 65);
            
            pdf.setFontSize(12);
            const execSummary = [
                `Retirement Readiness Score: ${Math.round(this.retirementData.readinessScore)}%`,
                `Years to Retirement: ${this.retirementData.yearsToRetirement}`,
                `Projected Corpus at Retirement: ${this.formatCurrency(this.retirementData.corpusAtRetirement)}`,
                `Monthly Income Possible: ${this.formatCurrency(this.retirementData.sustainableMonthlyIncome)}`,
                `Future Monthly Expenses: ${this.formatCurrency(this.retirementData.futureMonthlyExpenses)}`,
                `Monthly Surplus/Deficit: ${this.formatCurrency(this.retirementData.monthlySurplusDeficit)}`
            ];
            
            let yPos = 80;
            execSummary.forEach(item => {
                pdf.text(item, 25, yPos);
                yPos += 10;
            });
            
            // Input Parameters
            pdf.addPage();
            pdf.setFontSize(16);
            pdf.text('Input Parameters', 20, 30);
            
            pdf.setFontSize(10);
            const inputs = [
                `Current Age: ${this.retirementData.inputData.currentAge} years`,
                `Retirement Age: ${this.retirementData.inputData.retirementAge} years`,
                `Current Savings: ${this.formatCurrency(this.retirementData.inputData.currentSavings)}`,
                `Monthly Savings: ${this.formatCurrency(this.retirementData.inputData.monthlySavings)}`,
                `Expected Salary Growth: ${this.retirementData.inputData.salaryGrowth}% p.a.`,
                `Expected Investment Return: ${this.retirementData.inputData.expectedReturn}% p.a.`,
                `Current Monthly Expenses: ${this.formatCurrency(this.retirementData.inputData.currentExpenses)}`,
                `Retirement Lifestyle Factor: ${this.retirementData.inputData.lifestyleFactor}%`,
                `Expected Inflation Rate: ${this.retirementData.inputData.inflationRate}% p.a.`,
                `Life Expectancy: ${this.retirementData.inputData.lifeExpectancy} years`
            ];
            
            yPos = 45;
            inputs.forEach(input => {
                pdf.text(input, 25, yPos);
                yPos += 8;
            });
            
            // Recommendations
            pdf.addPage();
            pdf.setFontSize(16);
            pdf.text('Key Recommendations', 20, 30);
            
            yPos = 45;
            this.retirementData.recommendations.forEach((rec, index) => {
                if (yPos > 250) {
                    pdf.addPage();
                    yPos = 30;
                }
                
                pdf.setFontSize(12);
                pdf.text(`${index + 1}. ${rec.title}`, 25, yPos);
                yPos += 10;
                
                pdf.setFontSize(10);
                const lines = pdf.splitTextToSize(rec.description, 160);
                lines.forEach(line => {
                    pdf.text(line, 30, yPos);
                    yPos += 7;
                });
                yPos += 5;
            });
            
            // Charts (if possible to capture)
            try {
                pdf.addPage();
                pdf.setFontSize(16);
                pdf.text('Visual Analysis', 20, 30);
                
                // Try to capture charts
                const corpusCanvas = document.getElementById('retirement-corpus-chart');
                const corpusImage = corpusCanvas.toDataURL('image/png', 1.0);
                pdf.addImage(corpusImage, 'PNG', 20, 40, 170, 80);
                
                const pieCanvas = document.getElementById('retirement-income-expense-chart');
                const pieImage = pieCanvas.toDataURL('image/png', 1.0);
                pdf.addImage(pieImage, 'PNG', 20, 130, 170, 80);
                
            } catch (error) {
                console.error('Error adding charts to PDF:', error);
            }
            
            // Year-wise breakdown
            pdf.addPage();
            pdf.setFontSize(16);
            pdf.text('Year-wise Projection (First 10 Years)', 20, 30);
            
            // Table headers
            pdf.setFontSize(8);
            const headers = ['Year', 'Age', 'Annual Savings', 'Corpus', 'Status'];
            yPos = 45;
            let tableX = 20;
            const colWidths = [20, 20, 35, 40, 30];
            
            headers.forEach((header, index) => {
                pdf.text(header, tableX, yPos);
                tableX += colWidths[index];
            });
            
            yPos += 10;
            
            // Show first 10 years of data
            const tableData = this.retirementData.corpusGrowthData.slice(0, 10);
            tableData.forEach(yearData => {
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
                
                tableX = 20;
                const rowData = [
                    yearData.year.toString(),
                    yearData.age.toString(),
                    this.formatCurrency(yearData.annualSavings),
                    this.formatCurrency(yearData.corpus),
                    'Accumulating'
                ];
                
                rowData.forEach((data, colIndex) => {
                    pdf.text(data, tableX, yPos);
                    tableX += colWidths[colIndex];
                });
                
                yPos += 8;
            });
            
            // Important notes and disclaimers
            pdf.addPage();
            pdf.setFontSize(16);
            pdf.text('Important Notes & Disclaimers', 20, 30);
            
            pdf.setFontSize(10);
            const notes = [
                'Calculation Methodology:',
                '• Future value calculations use compound annual growth rate (CAGR)',
                '• Inflation adjustments applied to future expenses',
                '• 4% withdrawal rule used for sustainable retirement income',
                '• Healthcare inflation typically 2-3% higher than general inflation',
                '',
                'Key Assumptions:',
                '• Consistent monthly savings with annual growth',
                '• Returns are reinvested and compounded annually',
                '• Tax implications not factored in detailed calculations',
                '• No major economic disruptions or market crashes',
                '',
                'Recommendations:',
                '• Review and update plan annually',
                '• Consider professional financial advice',
                '• Maintain emergency fund separate from retirement corpus',
                '• Diversify investments across asset classes',
                '• Consider tax-efficient investment options',
                '',
                'Disclaimers:',
                '• This is a hypothetical projection for planning purposes only',
                '• Actual returns may vary significantly from projections',
                '• Past performance does not guarantee future results',
                '• Consult with certified financial planners before major decisions',
                '• Regular monitoring and adjustments recommended',
                '• Healthcare costs may require separate planning'
            ];
            
            yPos = 45;
            notes.forEach(note => {
                if (yPos > 280) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text(note, 20, yPos);
                yPos += 7;
            });
            
            pdf.save('Comprehensive_Retirement_Planning_Report.pdf');
            
        } catch (error) {
            console.error('Error generating retirement PDF:', error);
            alert('Error generating PDF. Please ensure you have a stable internet connection and try again.');
        }
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FinanceCalculator();
});
