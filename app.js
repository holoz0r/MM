document.addEventListener('DOMContentLoaded', () => {
    // --- STATE VARIABLES ---
    let budgetExpenses = [];
    let actualExpenses = [];
    let currentView = 'weekly'; // 'daily', 'weekly', 'monthly', 'yearly'
    let currentDate = new Date();
    let expenseChart = null; // 7. For Chart.js

    // --- DOM ELEMENTS ---
    // File Buttons
    const btnLoadBudget = document.getElementById('btnLoadBudget');
    const fileLoadBudget = document.getElementById('fileLoadBudget');
    const btnLoadSpending = document.getElementById('btnLoadSpending');
    const fileLoadSpending = document.getElementById('fileLoadSpending');
    const btnSaveSpending = document.getElementById('btnSaveSpending');

    // Tab Navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Expense Form
    const expenseEntryForm = document.getElementById('expense-entry-form');
    const expenseDateInput = document.getElementById('expense-date');
    const expenseAmountInput = document.getElementById('expense-amount');
    const expenseDescriptionInput = document.getElementById('expense-description');
    const expenseCategorySelect = document.getElementById('expense-category-select');

    // Dashboard Elements
    const currentPeriodDisplay = document.getElementById('current-period-display');
    const btnPrevPeriod = document.getElementById('btnPrevPeriod');
    const btnNextPeriod = document.getElementById('btnNextPeriod');
    const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
    const summaryBudgeted = document.getElementById('summary-budgeted');
    const summaryActual = document.getElementById('summary-actual');
    const summaryVariance = document.getElementById('summary-variance');
    const expenseBreakdownTbody = document.getElementById('expense-breakdown-tbody');

    // Expense Log List
    const fullExpenseListTbody = document.getElementById('full-expense-list-tbody');

    // 6. Overspend Tab
    const overspendTbody = document.getElementById('overspend-tbody');

    // 7. Charts Tab
    const chartPeriodSelect = document.getElementById('chart-period-select');
    const expenseChartCanvas = document.getElementById('expense-chart').getContext('2d');

    // 8. Insights Tab
    const categoryVarianceTbody = document.getElementById('category-variance-tbody');
    const recurringTbody = document.getElementById('recurring-tbody');
    const recurringTotalLine = document.getElementById('recurring-total-line');
    const runwayNetPositionInput = document.getElementById('runway-net-position');
    const runwayMonthlyIncomeInput = document.getElementById('runway-monthly-income');
    const runwayResults = document.getElementById('runway-results');

    // --- INITIALIZATION ---
    expenseDateInput.valueAsDate = new Date(); // Set default date to today
    loadDataFromStorage(); // 5. Load from localStorage on startup
    loadRunwayInputsFromStorage();
    updateDashboard();

    // --- 5. BROWSER STORAGE (SAVE) ---
    function saveBudgetToStorage() {
        localStorage.setItem('userBudgetPlan', JSON.stringify({ expenses: budgetExpenses }));
    }

    function saveSpendingToStorage() {
        localStorage.setItem('userSpendingLog', JSON.stringify(actualExpenses));
    }

    function loadRunwayInputsFromStorage() {
        const netPos = localStorage.getItem('runwayNetPosition');
        const income = localStorage.getItem('runwayMonthlyIncome');
        if (netPos !== null && runwayNetPositionInput) runwayNetPositionInput.value = netPos;
        if (income !== null && runwayMonthlyIncomeInput) runwayMonthlyIncomeInput.value = income;
    }

    if (runwayNetPositionInput) {
        runwayNetPositionInput.addEventListener('input', () => {
            localStorage.setItem('runwayNetPosition', runwayNetPositionInput.value);
            updateRunwayCalc();
        });
    }
    if (runwayMonthlyIncomeInput) {
        runwayMonthlyIncomeInput.addEventListener('input', () => {
            localStorage.setItem('runwayMonthlyIncome', runwayMonthlyIncomeInput.value);
            updateRunwayCalc();
        });
    }

    // --- 5. BROWSER STORAGE (LOAD) ---
    function loadDataFromStorage() {
        const savedBudget = localStorage.getItem('userBudgetPlan');
        if (savedBudget) {
            try {
                const budgetData = JSON.parse(savedBudget);
                budgetExpenses = budgetData.expenses || [];
                populateCategoryDropdown();
            } catch (e) {
                console.error('Failed to load saved budget:', e);
                localStorage.removeItem('userBudgetPlan');
            }
        }

        const savedSpending = localStorage.getItem('userSpendingLog');
        if (savedSpending) {
            try {
                actualExpenses = JSON.parse(savedSpending).map(exp => ({
                    ...exp,
                    id: exp.id || Date.now() + Math.random(), // 4. Ensure old items get an ID
                                                                       date: new Date(exp.date)
                }));
                actualExpenses.sort((a, b) => b.date - a.date);
            } catch (e) {
                console.error('Failed to load saved spending:', e);
                localStorage.removeItem('userSpendingLog');
            }
        }

        // Render AFTER loading
        if (actualExpenses.length > 0) {
            renderFullExpenseList();
        }
    }


    // --- FILE HANDLING ---
    btnLoadBudget.addEventListener('click', () => fileLoadBudget.click());
    fileLoadBudget.addEventListener('change', (e) => loadJsonFile(e, (data) => {
        budgetExpenses = data.expenses || [];
        populateCategoryDropdown();
        saveBudgetToStorage(); // 5. Save to storage
        runAllUpdates();
        alert('Budget (Plan) loaded successfully!');
    }));

    btnLoadSpending.addEventListener('click', () => fileLoadSpending.click());
    fileLoadSpending.addEventListener('change', (e) => loadJsonFile(e, (data) => {
        actualExpenses = (data || []).map(exp => ({
            ...exp,
            id: exp.id || Date.now() + Math.random(), // 4. Ensure old items get an ID
                                                  date: new Date(exp.date)
        }));
        actualExpenses.sort((a, b) => b.date - a.date);
        saveSpendingToStorage(); // 5. Save to storage
        runAllUpdates();
        alert('Spending (Log) loaded successfully!');
    }));

    btnSaveSpending.addEventListener('click', () => {
        saveSpendingToStorage(); // 5. Also save to storage
        const dataStr = JSON.stringify(actualExpenses, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'spending_data.json';
        a.click();
        URL.revokeObjectURL(url);
        alert('Spending (Log) saved!');
    });

    function loadJsonFile(event, callback) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                callback(data);
            } catch (err) {
                console.error('Error parsing JSON file:', err);
                alert('Error: Could not read or parse file.');
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset file input
    }

    // --- GLOBAL UPDATE FUNCTION ---
    /** Runs all data-dependent UI updates */
    function runAllUpdates() {
        updateDashboard();
        renderFullExpenseList();
        updateOverspendReport(); // 6.
        populateChartPeriodSelector(); // 7.
        renderChart(); // 7.
        updateInsightsTab(); // 8.
    }

    // --- TAB NAVIGATION ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => {
                content.classList.toggle('active', content.id === `${targetTab}-tab`);
            });

            // 6. Update overspend tab when clicked
            if (targetTab === 'overspend') {
                updateOverspendReport();
            }
            // 7. Update charts tab when clicked
            if (targetTab === 'charts') {
                populateChartPeriodSelector();
                renderChart();
            }
            // 8. Update insights tab when clicked
            if (targetTab === 'insights') {
                updateInsightsTab();
            }
        });
    });

    // --- EXPENSE ENTRY ---
    function populateCategoryDropdown() {
        expenseCategorySelect.innerHTML = '<option value="">-- Select Budget Item --</option>';

        const uncategorizedOption = document.createElement('option');
        uncategorizedOption.value = 'Uncategorized';
        uncategorizedOption.textContent = 'Uncategorized';
        expenseCategorySelect.appendChild(uncategorizedOption);

        const sortedExpenses = [...budgetExpenses].sort((a, b) => a.source.localeCompare(b.source));

        sortedExpenses.forEach(item => {
            const option = document.createElement('option');
            option.value = item.source;
            option.textContent = item.source;
            expenseCategorySelect.appendChild(option);
        });
    }

    expenseEntryForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newExpense = {
            id: Date.now(),
                                      date: new Date(expenseDateInput.value),
                                      amount: parseFloat(expenseAmountInput.value),
                                      description: expenseDescriptionInput.value,
                                      category: expenseCategorySelect.value
        };

        actualExpenses.push(newExpense);
        actualExpenses.sort((a, b) => b.date - a.date);
        saveSpendingToStorage(); // 5.

        expenseEntryForm.reset();
        expenseDateInput.valueAsDate = new Date();

        runAllUpdates(); // Update all tabs

        document.querySelector('.tab-button[data-tab="log-list"]').click();
    });

    // --- 3. IN-LINE EDITING & EXPENSE LOG ---
    function renderFullExpenseList() {
        fullExpenseListTbody.innerHTML = '';
        if (actualExpenses.length === 0) {
            fullExpenseListTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No expenses logged yet.</td></tr>';
            return;
        }

        actualExpenses.forEach(exp => {
            const tr = document.createElement('tr');
            tr.dataset.id = exp.id; // Store id on the row
            tr.innerHTML = `
            <td>${exp.date.toLocaleDateString()}</td>
            <td>${exp.category}</td>
            <td>${escapeHTML(exp.description)}</td>
            <td>${formatCurrency(exp.amount)}</td>
            <td class="action-buttons">
            <button class="edit-button" data-id="${exp.id}">Edit</button>
            <button class="delete-button" data-id="${exp.id}">Delete</button>
            </td>
            `;
            fullExpenseListTbody.appendChild(tr);
        });
    }

    fullExpenseListTbody.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        // --- DELETE ---
        if (e.target.classList.contains('delete-button')) {
            if (confirm('Are you sure you want to delete this expense?')) {
                actualExpenses = actualExpenses.filter(exp => exp.id != id);
                saveSpendingToStorage(); // 5.
                runAllUpdates(); // Re-render everything
            }
        }

        // --- EDIT ---
        if (e.target.classList.contains('edit-button')) {
            const expense = actualExpenses.find(exp => exp.id == id);
            const row = e.target.closest('tr');

            // Build category dropdown HTML
            let categoryOptions = `<option value="Uncategorized">Uncategorized</option>`;
            budgetExpenses.sort((a, b) => a.source.localeCompare(b.source)).forEach(item => {
                const selected = item.source === expense.category ? 'selected' : '';
                categoryOptions += `<option value="${escapeHTML(item.source)}" ${selected}>${escapeHTML(item.source)}</option>`;
            });

            // ISO date format (YYYY-MM-DD) for input[type=date]
            const isoDate = expense.date.toISOString().split('T')[0];

            row.innerHTML = `
            <td><input type="date" value="${isoDate}" class="edit-date"></td>
            <td><select class="edit-category">${categoryOptions}</select></td>
            <td><input type="text" value="${escapeHTML(expense.description)}" class="edit-description"></td>
            <td><input type="number" value="${expense.amount}" step="0.01" class="edit-amount"></td>
            <td class="action-buttons">
            <button class="save-button" data-id="${id}">Save</button>
            <button class="cancel-button" data-id="${id}">Cancel</button>
            </td>
            `;
            // Add/Remove full-width styles for inputs
            row.querySelectorAll('input, select').forEach(el => {
                el.style.width = '100%';
                el.style.boxSizing = 'border-box';
            });
        }

        // --- CANCEL ---
        if (e.target.classList.contains('cancel-button')) {
            renderFullExpenseList(); // Just re-render the list
        }

        // --- SAVE ---
        if (e.target.classList.contains('save-button')) {
            const row = e.target.closest('tr');
            const expense = actualExpenses.find(exp => exp.id == id);

            expense.date = new Date(row.querySelector('.edit-date').value);
            expense.category = row.querySelector('.edit-category').value;
            expense.description = row.querySelector('.edit-description').value;
            expense.amount = parseFloat(row.querySelector('.edit-amount').value);

            actualExpenses.sort((a, b) => b.date - a.date); // Re-sort
            saveSpendingToStorage(); // 5.
            runAllUpdates(); // Re-render everything
        }
    });


    // --- DASHBOARD: DATE & VIEW CONTROLS ---
    viewToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 1. Fixed button state toggling
            viewToggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentView = button.dataset.view;
            updateDashboard();
        });
    });

    btnPrevPeriod.addEventListener('click', () => {
        if (currentView === 'daily') {
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (currentView === 'weekly') {
            currentDate.setDate(currentDate.getDate() - 7);
        } else if (currentView === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentView === 'yearly') {
            currentDate.setFullYear(currentDate.getFullYear() - 1);
        }
        updateDashboard();
    });

    btnNextPeriod.addEventListener('click', () => {
        if (currentView === 'daily') {
            currentDate.setDate(currentDate.getDate() + 1);
        } else if (currentView === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (currentView === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentView === 'yearly') {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        updateDashboard();
    });

    // --- DASHBOARD: CORE LOGIC ---
    function getPeriodRange(date, view) {
        let startDate = new Date(date);
        let endDate = new Date(date);
        let numDays = 1;

        if (view === 'daily') {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            numDays = 1;
        } else if (view === 'weekly') {
            const dayOfWeek = startDate.getDay();
            const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(startDate.setDate(diff));
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            numDays = 7;
        } else if (view === 'monthly') {
            startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            numDays = endDate.getDate();
        } else if (view === 'yearly') {
            startDate = new Date(date.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(date.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            const year = date.getFullYear();
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            numDays = isLeap ? 366 : 365;
        }
        return { startDate, endDate, numDays };
    }

    /**
     * Helper function for updateDashboard, overspend, and charts.
     * Aggregates budget vs actual for a given period.
     */
    function aggregatePeriodData(startDate, endDate, numDays) {
        const budgetItemMap = new Map();

        // 1. Calculate Budget Totals
        let totalBudget = 0;
        budgetExpenses.forEach(item => {
            const dailyAmount = item.daily || 0;
            const periodBudget = dailyAmount * numDays;
            totalBudget += periodBudget;
            budgetItemMap.set(item.source, {
                budgeted: periodBudget,
                actual: 0
            });
        });

        // 2. Calculate Actual Totals
        let totalActual = 0;
        const relevantActuals = actualExpenses.filter(exp =>
        exp.date >= startDate && exp.date <= endDate
        );

        relevantActuals.forEach(exp => {
            totalActual += exp.amount;
            const category = exp.category;
            if (budgetItemMap.has(category)) {
                budgetItemMap.get(category).actual += exp.amount;
            } else {
                if (!budgetItemMap.has('Uncategorized')) {
                    budgetItemMap.set('Uncategorized', { budgeted: 0, actual: 0 });
                }
                budgetItemMap.get('Uncategorized').actual += exp.amount;
            }
        });

        return { budgetItemMap, totalBudget, totalActual };
    }

    function updateDashboard() {
        if (budgetExpenses.length === 0) return;

        const period = getPeriodRange(currentDate, currentView);
        currentPeriodDisplay.textContent = `${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`;

        const { budgetItemMap, totalBudget, totalActual } = aggregatePeriodData(period.startDate, period.endDate, period.numDays);

        const totalVariance = totalBudget - totalActual;
        summaryBudgeted.textContent = formatCurrency(totalBudget);
        summaryActual.textContent = formatCurrency(totalActual);
        summaryVariance.textContent = formatCurrency(totalVariance);
        summaryVariance.className = totalVariance >= 0 ? 'positive' : 'negative';

        expenseBreakdownTbody.innerHTML = '';
        const sortedMap = new Map([...budgetItemMap.entries()].sort());

        sortedMap.forEach((data, source) => {
            const variance = data.budgeted - data.actual;
            // 2. Use class on <td> for variance styling
            const varianceClass = variance >= 0 ? 'positive' : 'negative';
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${escapeHTML(source)}</td>
            <td>${formatCurrency(data.budgeted)}</td>
            <td>${formatCurrency(data.actual)}</td>
            <td class="${varianceClass}">${formatCurrency(variance)}</td>
            `;
            expenseBreakdownTbody.appendChild(tr);
        });
    }

    // --- 6. OVERSPEND TAB ---
    function updateOverspendReport() {
        if (budgetExpenses.length === 0 || actualExpenses.length === 0) {
            overspendTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Load budget and spending files to see report.</td></tr>';
            return;
        }

        // Create a map of monthly data
        const monthlyData = new Map();

        // Helper to get YYYY-MM key
        const getMonthKey = (date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        // 1. Tally all actuals by month and category
        actualExpenses.forEach(exp => {
            const monthKey = getMonthKey(exp.date);
            if (!monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, new Map());
            }
            const monthMap = monthlyData.get(monthKey);

            const category = exp.category;
            const currentActual = monthMap.get(category)?.actual || 0;
            monthMap.set(category, { actual: currentActual + exp.amount, budgeted: 0 });
        });

        // 2. Calculate budget for each month/category that has spending
        monthlyData.forEach((monthMap, monthKey) => {
            const [year, month] = monthKey.split('-').map(Number);
            const numDays = new Date(year, month, 0).getDate(); // Days in that specific month

            budgetExpenses.forEach(item => {
                const category = item.source;
                const monthlyBudget = (item.daily || 0) * numDays;

                if (monthMap.has(category)) {
                    monthMap.get(category).budgeted = monthlyBudget;
                } else {
                    // Include items that were budgeted but not spent? For now, no.
                }
            });
            // Also add Uncategorized
            if (monthMap.has('Uncategorized')) {
                monthMap.get('Uncategorized').budgeted = 0;
            }
        });

        // 3. Render the table
        overspendTbody.innerHTML = '';
        let hasOverspend = false;

        // Sort months descending
        const sortedMonthKeys = [...monthlyData.keys()].sort().reverse();

        for (const monthKey of sortedMonthKeys) {
            const monthMap = monthlyData.get(monthKey);
            const sortedCategories = [...monthMap.keys()].sort();

            for (const category of sortedCategories) {
                const data = monthMap.get(category);
                const overspend = data.actual - data.budgeted;

                if (overspend > 0) {
                    hasOverspend = true;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                    <td>${monthKey}</td>
                    <td>${escapeHTML(category)}</td>
                    <td>${formatCurrency(data.budgeted)}</td>
                    <td>${formatCurrency(data.actual)}</td>
                    <td class="negative" style="font-weight:bold;">${formatCurrency(overspend)}</td>
                    `;
                    overspendTbody.appendChild(tr);
                }
            }
        }

        if (!hasOverspend) {
            overspendTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No overspending found!</td></tr>';
        }
    }

    // --- 7. CHARTS TAB ---

    /** Gets all unique periods (YYYY-MM and YYYY) from spending */
    function getUniquePeriods() {
        const periods = new Set();
        actualExpenses.forEach(exp => {
            periods.add(exp.date.getFullYear().toString());
            periods.add(`${exp.date.getFullYear()}-${(exp.date.getMonth() + 1).toString().padStart(2, '0')}`);
        });
        return [...periods].sort().reverse(); // Newest first
    }

    function populateChartPeriodSelector() {
        const periods = getUniquePeriods();
        chartPeriodSelect.innerHTML = '';

        if (periods.length === 0) {
            chartPeriodSelect.innerHTML = '<option value="">No data</option>';
            return;
        }

        periods.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            chartPeriodSelect.appendChild(option);
        });
    }

    // Add listener to re-render chart on selection
    chartPeriodSelect.addEventListener('change', () => renderChart());

    function renderChart() {
        if (budgetExpenses.length === 0) return;

        const period = chartPeriodSelect.value;
        if (!period) {
            // Clear chart if no period
            if (expenseChart) {
                expenseChart.destroy();
                expenseChart = null;
            }
            return;
        }

        let startDate, endDate, numDays;

        if (period.length === 4) { // Yearly
            const year = parseInt(period, 10);
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            numDays = isLeap ? 366 : 365;
        } else { // Monthly
            const [year, month] = period.split('-').map(Number);
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0); // Last day of month
            numDays = endDate.getDate();
        }
        endDate.setHours(23, 59, 59, 999); // Ensure end date is inclusive

        const { budgetItemMap } = aggregatePeriodData(startDate, endDate, numDays);

        // Filter out items with 0 budget and 0 spend
        const filteredMap = new Map();
        budgetItemMap.forEach((data, source) => {
            if (data.budgeted > 0 || data.actual > 0) {
                filteredMap.set(source, data);
            }
        });

        const sortedMap = new Map([...filteredMap.entries()].sort());

        const labels = [...sortedMap.keys()];
        const budgetedData = [...sortedMap.values()].map(d => d.budgeted);
        const actualData = [...sortedMap.values()].map(d => d.actual);

        if (expenseChart) {
            expenseChart.destroy();
        }

        expenseChart = new Chart(expenseChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Budgeted',
                        data: budgetedData,
                        backgroundColor: 'rgba(105, 201, 159, 0.6)', // #69C99F
                                 borderColor: 'rgba(105, 201, 159, 1)',
                                 borderWidth: 1
                    },
                    {
                        label: 'Actual',
                        data: actualData,
                        backgroundColor: 'rgba(35, 64, 59, 0.6)', // #23403B
                                 borderColor: 'rgba(35, 64, 59, 1)',
                                 borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // =====================================================================
    // --- 8. INSIGHTS TAB: category variance, recurring detection, runway ---
    // =====================================================================

    function normalizeDescription(str) {
        return (str || '')
            .toLowerCase()
            .replace(/[^a-z\s]/g, ' ')   // strip digits/punctuation (store numbers, dates, etc.)
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Returns the sorted list of distinct "YYYY-MM" months present in actualExpenses,
     *  excluding the current (likely partial) month so averages aren't skewed low. */
    function getFullMonthsOnFile() {
        const months = new Set();
        actualExpenses.forEach(exp => {
            months.add(`${exp.date.getFullYear()}-${(exp.date.getMonth() + 1).toString().padStart(2, '0')}`);
        });
        const sorted = [...months].sort();
        const nowKey = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
        return sorted.filter(m => m !== nowKey);
    }

    function computeCategoryVariance() {
        const fullMonths = getFullMonthsOnFile();
        if (fullMonths.length === 0 || budgetExpenses.length === 0) return [];

        const monthlyCatTotals = new Map(); // month -> category -> total
        actualExpenses.forEach(exp => {
            const key = `${exp.date.getFullYear()}-${(exp.date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!fullMonths.includes(key)) return;
            if (!monthlyCatTotals.has(key)) monthlyCatTotals.set(key, new Map());
            const catMap = monthlyCatTotals.get(key);
            catMap.set(exp.category, (catMap.get(exp.category) || 0) + exp.amount);
        });

        const allCategories = new Set(budgetExpenses.map(b => b.source));
        monthlyCatTotals.forEach(catMap => catMap.forEach((_, cat) => allCategories.add(cat)));

        const results = [];
        allCategories.forEach(cat => {
            const budgetItem = budgetExpenses.find(b => b.source === cat);
            const budgetedMonthly = budgetItem ? (budgetItem.daily || 0) * 30.44 : 0;

            let total = 0;
            fullMonths.forEach(m => {
                total += (monthlyCatTotals.get(m) || new Map()).get(cat) || 0;
            });
            const actualMonthly = total / fullMonths.length;
            const variance = actualMonthly - budgetedMonthly;

            results.push({ category: cat, budgetedMonthly, actualMonthly, variance, annualImpact: variance * 12 });
        });

        results.sort((a, b) => b.variance - a.variance);
        return results;
    }

    function computeRecurringCharges() {
        const groups = new Map(); // normalizedDescription -> { descriptions:Set, category, months:Set, total, count }
        actualExpenses.forEach(exp => {
            const key = normalizeDescription(exp.description);
            if (!key) return;
            const monthKey = `${exp.date.getFullYear()}-${(exp.date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!groups.has(key)) {
                groups.set(key, { label: exp.description, category: exp.category, months: new Set(), total: 0, count: 0 });
            }
            const g = groups.get(key);
            g.months.add(monthKey);
            g.total += exp.amount;
            g.count += 1;
        });

        const recurring = [];
        let recurringTotal = 0;
        let oneOffTotal = 0;

        groups.forEach(g => {
            if (g.months.size >= 3) {
                const avg = g.total / g.count;
                const annualized = avg * 12; // treat as roughly monthly cadence
                recurring.push({ label: g.label, category: g.category, monthsSeen: g.months.size, avgAmount: avg, annualized });
                recurringTotal += annualized;
            } else {
                oneOffTotal += g.total;
            }
        });

        recurring.sort((a, b) => b.annualized - a.annualized);
        return { recurring, recurringTotal, oneOffTotal };
    }

    function updateInsightsTab() {
        if (!categoryVarianceTbody) return;

        // --- Category variance table ---
        const variance = computeCategoryVariance();
        if (variance.length === 0) {
            categoryVarianceTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Need at least one full calendar month of logged spending (and a loaded budget) to compute this.</td></tr>';
        } else {
            categoryVarianceTbody.innerHTML = variance.map(v => `
                <tr>
                    <td>${escapeHTML(v.category)}</td>
                    <td>${formatCurrency(v.budgetedMonthly)}</td>
                    <td>${formatCurrency(v.actualMonthly)}</td>
                    <td class="${v.variance <= 0 ? 'positive' : 'negative'}">${formatCurrency(v.variance)}</td>
                    <td class="${v.annualImpact <= 0 ? 'positive' : 'negative'}">${formatCurrency(v.annualImpact)}</td>
                </tr>
            `).join('');
        }

        // --- Recurring commitments table ---
        const { recurring, recurringTotal, oneOffTotal } = computeRecurringCharges();
        if (recurring.length === 0) {
            recurringTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No description has recurred in 3+ different months yet.</td></tr>';
            recurringTotalLine.textContent = '';
        } else {
            recurringTbody.innerHTML = recurring.map(r => `
                <tr>
                    <td>${escapeHTML(r.label)}</td>
                    <td>${escapeHTML(r.category)}</td>
                    <td>${r.monthsSeen}</td>
                    <td>${formatCurrency(r.avgAmount)}</td>
                    <td>${formatCurrency(r.annualized)}</td>
                </tr>
            `).join('');
            recurringTotalLine.textContent =
                `Recurring commitments total roughly ${formatCurrency(recurringTotal)}/year. ` +
                `Everything else (one-off / irregular purchases) totals ${formatCurrency(oneOffTotal)} over the period logged.`;
        }

        updateRunwayCalc();
    }

    function updateRunwayCalc() {
        if (!runwayResults) return;

        const netPosition = parseFloat(runwayNetPositionInput.value);
        const monthlyIncome = parseFloat(runwayMonthlyIncomeInput.value);

        if (isNaN(netPosition) || isNaN(monthlyIncome) || budgetExpenses.length === 0) {
            runwayResults.innerHTML = '<p style="text-align:center; color:#888;">Enter your net position and monthly income above to see this.</p>';
            return;
        }

        const monthlyBudgetTotal = budgetExpenses.reduce((sum, b) => sum + (b.daily || 0) * 30.44, 0);

        const fullMonths = getFullMonthsOnFile();
        let monthlyActualTotal = monthlyBudgetTotal; // fallback if no logged history yet
        if (fullMonths.length > 0) {
            const totalsByMonth = new Map();
            actualExpenses.forEach(exp => {
                const key = `${exp.date.getFullYear()}-${(exp.date.getMonth() + 1).toString().padStart(2, '0')}`;
                if (!fullMonths.includes(key)) return;
                totalsByMonth.set(key, (totalsByMonth.get(key) || 0) + exp.amount);
            });
            const sum = fullMonths.reduce((s, m) => s + (totalsByMonth.get(m) || 0), 0);
            monthlyActualTotal = sum / fullMonths.length;
        }

        const dailyNetBudgeted = (monthlyIncome - monthlyBudgetTotal) / 30.44;
        const dailyNetActual = (monthlyIncome - monthlyActualTotal) / 30.44;

        const projectedDate = (dailyRate) => {
            if (dailyRate >= 0) return null; // growing, not depleting
            const days = netPosition / Math.abs(dailyRate);
            const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            return { days, date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) };
        };

        const budgetedProjection = projectedDate(dailyNetBudgeted);
        const actualProjection = projectedDate(dailyNetActual);

        let html = '<div class="runway-grid">';
        html += `<div><h4>At your budgeted rate</h4><p>${dailyNetBudgeted >= 0
            ? `Growing by ${formatCurrency(dailyNetBudgeted)}/day`
            : `Depleting — projected zero on ${budgetedProjection.date} (${Math.round(budgetedProjection.days)} days)`}</p></div>`;
        html += `<div><h4>At your actual logged rate</h4><p>${dailyNetActual >= 0
            ? `Growing by ${formatCurrency(dailyNetActual)}/day`
            : `Depleting — projected zero on ${actualProjection.date} (${Math.round(actualProjection.days)} days)`}</p></div>`;
        html += '</div>';

        if (dailyNetBudgeted >= 0 && dailyNetActual < 0) {
            html += `<p class="negative" style="text-align:center; font-weight:bold;">
                Your plan is sustainable, but your actual spending is not — at this rate you flip from
                building wealth to burning through savings. Closing this gap is worth
                ${formatCurrency((dailyNetBudgeted - dailyNetActual) * 30.44)}/month.</p>`;
        } else if (dailyNetActual < dailyNetBudgeted) {
            const daysDiff = actualProjection && budgetedProjection ? Math.round(actualProjection.days) - Math.round(budgetedProjection.days) : null;
            html += `<p class="negative" style="text-align:center; font-weight:bold;">
                Sticking to your budget instead of your current actual pace is worth
                ${formatCurrency((dailyNetBudgeted - dailyNetActual) * 30.44)}/month
                ${daysDiff !== null ? `— roughly ${Math.abs(daysDiff)} extra days of runway.` : ''}</p>`;
        } else {
            html += `<p class="positive" style="text-align:center; font-weight:bold;">You're currently spending less than planned — nice work.</p>`;
        }

        runwayResults.innerHTML = html;
    }

    // --- UTILITY FUNCTIONS ---
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
        }).format(amount);
    }

    function escapeHTML(str) {
        if (str === null || str === undefined) {
            return '';
        }
        return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

});
