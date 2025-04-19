function calculateTotalForFrequency(entries, frequency) {
    return entries.reduce((sum, entry) => {
        let value = 0;
        switch (frequency) {
            case 'daily':
                value = entry.daily || 0;
                break;
            case 'weekly':
                value = entry.weekly || 0;
                break;
            case 'fortnightly':
                value = entry.fortnightly || 0;
                break;
            case 'monthly':
                value = entry.monthly || 0;
                break;
            case 'quarterly':
                value = entry.quarterly || 0;
                break;
            case 'yearly':
                value = entry.yearly || 0;
                break;
        }
        return sum + parseFloat(entry.amount) * value;
    }, 0);
}

function calculateIncomeMinusExpenses(incomeEntries, expenseEntries, frequency) {
    const totalIncome = calculateTotalForFrequency(incomeEntries, frequency);
    const totalExpenses = calculateTotalForFrequency(expenseEntries, frequency);
    return totalIncome - totalExpenses;
}

function calculateTotalDebt(accounts) {
    let totalDebt = 0;
    let mortgageBalance = 0;
    let totalOffset = 0;

    accounts.forEach(account => {
        if (account.type === 'credit card') {
            const owing = parseFloat(account.limit) - parseFloat(account.available);
            if (!isNaN(owing) && owing > 0) {
                totalDebt += owing;
            }
        } else if (account.name && account.name.toLowerCase().includes('mortgage')) {
            mortgageBalance = parseFloat(account.balance);
            if (isNaN(mortgageBalance)) mortgageBalance = 0;
        } else if (account.name && account.name.toLowerCase().includes('offset')) {
            const offsetBalance = parseFloat(account.balance);
            if (!isNaN(offsetBalance)) {
                totalOffset += offsetBalance;
            }
        }
    });

    if (mortgageBalance < 0) {
        totalDebt += Math.abs(mortgageBalance) - totalOffset;
    } else if (mortgageBalance > 0) {
        totalDebt += mortgageBalance - totalOffset;
    }

    return Math.max(0, totalDebt);
}

function calculateTotalMoney(accounts) {
    let totalMoney = 0;
    accounts.forEach(account => {
        if ((account.name && account.name.toLowerCase().includes('offset')) || account.type === 'everyday') {
            const balance = parseFloat(account.balance);
            if (!isNaN(balance)) {
                totalMoney += balance;
            }
        }
    });
    return totalMoney;
}

function renderHeaderCalculations() {
    const headerTitle = document.getElementById('header-title');
    const headerCalculations = document.getElementById('header-calculations');
    const netPositionDebt = document.getElementById('net-position-debt');
    const netPositionMoney = document.getElementById('net-position-money');

    if (headerTitle) {
        headerTitle.textContent = 'Budget Tracker';
    }

    if (headerCalculations) {
        headerCalculations.innerHTML = '';
        const frequencies = ['daily', 'weekly', 'monthly', 'yearly'];
        const calculationsTable = document.createElement('table');
        const headerRow = calculationsTable.insertRow();
        headerRow.insertCell().textContent = 'Interval';
        headerRow.insertCell().textContent = 'Income - Expenses';

        frequencies.forEach(freq => {
            const result = calculateIncomeMinusExpenses(incomeEntries, expenseEntries, freq);
            const row = calculationsTable.insertRow();
            row.insertCell().textContent = freq.charAt(0).toUpperCase() + freq.slice(1);
            const resultCell = row.insertCell();
            resultCell.textContent = `$${result.toFixed(2)}`;
            if (result < 0) {
                resultCell.style.color = 'red';
            } else if (result > 0) {
                resultCell.style.color = 'green';
            }
        });
        headerCalculations.appendChild(calculationsTable);
    }

    if (netPositionDebt) {
        const totalDebt = calculateTotalDebt(accounts);
        netPositionDebt.textContent = `Total Debt: $${totalDebt.toFixed(2)}`;
    }

    if (netPositionMoney) {
        const totalMoney = calculateTotalMoney(accounts);
        netPositionMoney.textContent = `Total Money: $${totalMoney.toFixed(2)}`;
    }
}

let totalAnnualIncomeCached = 0;
function calculateTotalAnnualIncome() {
    if (incomeEntries && incomeEntries.length > 0) {
        totalAnnualIncomeCached = incomeEntries.reduce((sum, income) => {
            switch (income.frequency) {
                case 'daily':
                    return sum + parseFloat(income.amount) * 365.25;
                case 'weekly':
                    return sum + parseFloat(income.amount) * 52;
                case 'fortnightly':
                    return sum + parseFloat(income.amount) * 26;
                case 'monthly':
                    return sum + parseFloat(income.amount) * 12;
                case 'quarterly':
                    return sum + parseFloat(income.amount) * 4;
                case 'yearly':
                    return sum + parseFloat(income.amount);
                default:
                    return sum + parseFloat(income.amount);
            }
        }, 0);
    }
    return totalAnnualIncomeCached;
}

function renderExpenseAnalysisTable() {
    const analysisContainer = document.getElementById('expense-analysis-container');
    if (!analysisContainer) {
        console.error('Expense analysis container not found in HTML.');
        return;
    }
    analysisContainer.innerHTML = `
        <h2>Expense Analysis</h2>
        <table id="expense-analysis-table">
            <thead>
                <tr>
                    <th data-sort="description">Description</th>
                    <th data-sort="category">Category</th>
                    <th data-sort="daily">Daily</th>
                    <th data-sort="weekly">Weekly</th>
                    <th data-sort="fortnightly">Fortnightly</th>
                    <th data-sort="monthly">Monthly</th>
                    <th data-sort="yearly">Yearly</th>
                    <th data-sort="percentageOfTotalExpense">\% of Expense</th>
                    <th data-sort="percentageOfTotalIncome">\% of Income</th>
                </tr>
            </thead>
            <tbody id="expense-analysis-table-body">
            </tbody>
        </table>
    `;

    const tableBody = document.getElementById('expense-analysis-table-body');
    if (!tableBody) {
        console.error('Expense analysis table body not found.');
        return;
    }
    tableBody.innerHTML = '';

    if (expenseEntries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9">No expense data available.</td></tr>';
        return;
    }

    const totalAnnualIncome = calculateTotalAnnualIncome();
    const totalAnnualExpense = expenseEntries.reduce((sum, expense) => sum + getAnnualExpense(expense), 0);

    expenseEntries.forEach(expense => {
        const row = tableBody.insertRow();

        const descriptionCell = row.insertCell();
        descriptionCell.textContent = expense.source;

        const categoryCell = row.insertCell();
        categoryCell.textContent = expense.category;

        const dailyCell = row.insertCell();
        dailyCell.textContent = `$${(expense.amount * (expense.frequency === 'daily' ? 1 : expense.frequency === 'weekly' ? 1/7 : expense.frequency === 'fortnightly' ? 1/14 : expense.frequency === 'monthly' ? 1/30.44 : expense.frequency === 'quarterly' ? 1/91.33 : expense.frequency === 'yearly' ? 1/365.25 : 0)).toFixed(2)}`;

        const weeklyCell = row.insertCell();
        weeklyCell.textContent = `$${(expense.amount * (expense.frequency === 'daily' ? 7 : expense.frequency === 'weekly' ? 1 : expense.frequency === 'fortnightly' ? 1/2 : expense.frequency === 'monthly' ? 1/4.35 : expense.frequency === 'quarterly' ? 1/13.04 : expense.frequency === 'yearly' ? 1/52 : 0)).toFixed(2)}`;

        const fortnightlyCell = row.insertCell();
        fortnightlyCell.textContent = `$${(expense.amount * (expense.frequency === 'daily' ? 14 : expense.frequency === 'weekly' ? 2 : expense.frequency === 'fortnightly' ? 1 : expense.frequency === 'monthly' ? 1/2.17 : expense.frequency === 'quarterly' ? 2/13.04 : expense.frequency === 'yearly' ? 2/52 : 0)).toFixed(2)}`;

        const monthlyCell = row.insertCell();
        monthlyCell.textContent = `$${(expense.amount * (expense.frequency === 'daily' ? 30.44 : expense.frequency === 'weekly' ? 4.35 : expense.frequency === 'fortnightly' ? 2.17 : expense.frequency === 'monthly' ? 1 : expense.frequency === 'quarterly' ? 1/3 : expense.frequency === 'yearly' ? 1/12 : 0)).toFixed(2)}`;

        const yearlyCell = row.insertCell();
        yearlyCell.textContent = `$${getAnnualExpense(expense).toFixed(2)}`;

        const percentageOfTotalExpenseCell = row.insertCell();
        const percentageOfExpense = totalAnnualExpense > 0 ? (getAnnualExpense(expense) / totalAnnualExpense) * 100 : 0;
        percentageOfTotalExpenseCell.textContent = `${percentageOfExpense.toFixed(2)}%`;

        const percentageOfTotalIncomeCell = row.insertCell();
        const percentageOfIncome = totalAnnualIncome > 0 ? (getAnnualExpense(expense) / totalAnnualIncome) * 100 : 0;
        percentageOfTotalIncomeCell.textContent = `${percentageOfIncome.toFixed(2)}%`;
    });

    const headers = document.querySelectorAll('#expense-analysis-table th');
    headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const sortBy = header.getAttribute('data-sort');
            sortTable(sortBy, tableBody);
            updateSortIcons(header, headers);
        });
    });
}

function updateSortIcons(currentHeader, allHeaders) {
    allHeaders.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
    });
    const isAsc = currentHeader.classList.contains('sorted-asc');
    currentHeader.classList.toggle('sorted-asc', !isAsc);
    currentHeader.classList.toggle('sorted-desc', isAsc);
}

function getAnnualExpense(expense) {
    switch (expense.frequency) {
        case 'daily':
            return parseFloat(expense.amount) * 365.25;
        case 'weekly':
            return parseFloat(expense.amount) * 52;
        case 'fortnightly':
            return parseFloat(expense.amount) * 26;
        case 'monthly':
            return parseFloat(expense.amount) * 12;
        case 'quarterly':
            return parseFloat(expense.amount) * 4;
        case 'yearly':
            return parseFloat(expense.amount);
        default:
            return parseFloat(expense.amount);
    }
}

function sortTable(sortBy, tableBody) {
    const rows = Array.from(tableBody.rows);
    const isNumber = sortBy === 'daily' || sortBy === 'weekly' || sortBy === 'fortnightly' || sortBy === 'monthly' || sortBy === 'yearly' || sortBy === 'percentageOfTotalExpense' || sortBy === 'percentageOfTotalIncome';

    const sortedRows = rows.sort((a, b) => {
        const aValue = a.cells[getColumnIndex(sortBy)].textContent.replace('$', '').replace('%', '').toLowerCase();
        const bValue = b.cells[getColumnIndex(sortBy)].textContent.replace('$', '').replace('%', '').toLowerCase();

        let comparison = 0;
        if (isNumber) {
            comparison = parseFloat(aValue) - parseFloat(bValue);
        } else {
            comparison = aValue.localeCompare(bValue);
        }

        const header = Array.from(document.querySelectorAll('#expense-analysis-table th')).find(th => th.getAttribute('data-sort') === sortBy);
        const isAsc = header && header.classList.contains('sorted-asc');
        return isAsc ? comparison : -comparison;
    });

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    sortedRows.forEach(row => tableBody.appendChild(row));
}

function getColumnIndex(sortBy) {
    switch (sortBy) {
        case 'description': return 0;
        case 'category': return 1;
        case 'daily': return 2;
        case 'weekly': return 3;
        case 'fortnightly': return 4;
        case 'monthly': return 5;
        case 'yearly': return 6;
        case 'percentageOfTotalExpense': return 7;
        case 'percentageOfTotalIncome': return 8;
        default: return 0;
    }
}

function renderNetPositionSummary() {
    const netPositionSummaryDetails = document.getElementById('net-position-summary-details');
    if (!netPositionSummaryDetails) {
        console.error('Net position summary details container not found.');
        return;
    }
    netPositionSummaryDetails.innerHTML = '';

    const periods = [
        { label: 'Daily', key: 'daily' },
        { label: 'Weekly', key: 'weekly' },
        { label: 'Fortnightly', key: 'fortnightly' },
        { label: 'Monthly', key: 'monthly' },
        { label: 'Quarterly', key: 'quarterly' },
        { label: 'Yearly', key: 'yearly' },
    ];

    periods.forEach(period => {
        let totalIncome = 0;
        incomeEntries.forEach(income => {
            totalIncome += getAmountForFrequency(income.amount, income.frequency, period.key);
        });

        let totalExpenses = 0;
        expenseEntries.forEach(expense => {
            totalExpenses += getAmountForFrequency(expense.amount, expense.frequency, period.key);
        });

        const netPosition = totalIncome - totalExpenses;

        const summaryCard = document.createElement('div');
        summaryCard.classList.add('summary-card');

        const title = document.createElement('h3');
        title.textContent = period.label;
        summaryCard.appendChild(title);

        const amount = document.createElement('p');
        amount.textContent = `$${netPosition.toFixed(2)}`;
        if (netPosition > 0) {
            amount.classList.add('positive');
        } else if (netPosition < 0) {
            amount.classList.add('negative');
        }
        summaryCard.appendChild(amount);

        netPositionSummaryDetails.appendChild(summaryCard);
    });
}

function getAmountForFrequency(amount, entryFrequency, targetFrequency) {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) return 0;

    switch (entryFrequency) {
        case 'daily':
            return amountValue * getMultiplier(targetFrequency, 'daily');
        case 'weekly':
            return amountValue * getMultiplier(targetFrequency, 'weekly');
        case 'fortnightly':
            return amountValue * getMultiplier(targetFrequency, 'fortnightly');
        case 'monthly':
            return amountValue * getMultiplier(targetFrequency, 'monthly');
        case 'quarterly':
            return amountValue * getMultiplier(targetFrequency, 'quarterly');
        case 'yearly':
            return amountValue * getMultiplier(targetFrequency, 'yearly');
        default:
            return 0;
    }
}

function getMultiplier(target, base) {
    const multipliers = {
        daily: 1,
        weekly: 7,
        fortnightly: 14,
        monthly: 30.44,
        quarterly: 91.33,
        yearly: 365.25,
    };
    return multipliers[target] / multipliers[base];
}

function renderCategoryAnalysisTable() {
    const categoryAnalysisContainer = document.getElementById('category-analysis-container');
    if (!categoryAnalysisContainer) {
        console.error('Category analysis container not found in HTML.');
        return;
    }
    categoryAnalysisContainer.innerHTML = `
        <center><h2>Expense Analysis by Category</h2></center>
        <div id="category-analysis-table-container">
            <table id="category-analysis-table">
                <thead>
                    <tr>
                        <th data-sort="category">Category</th>
                        <th data-sort="daily">Daily</th>
                        <th data-sort="weekly">Weekly</th>
                        <th data-sort="fortnightly">Fortnightly</th>
                        <th data-sort="monthly">Monthly</th>
                        <th data-sort="yearly">Yearly</th>
                        <th data-sort="percentageOfTotalExpense">\% of Expense</th>
                        <th data-sort="percentageOfTotalIncome">\% of Income</th>
                    </tr>
                </thead>
                <tbody id="category-analysis-table-body">
                </tbody>
            </table>
        </div>
    `;

    const tableBody = document.getElementById('category-analysis-table-body');
    if (!tableBody) {
        console.error('Category analysis table body not found.');
        return;
    }
    tableBody.innerHTML = '';

    if (expenseEntries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No expense data available.</td></tr>';
        return;
    }

    const totalAnnualIncome = calculateTotalAnnualIncome();
    const totalAnnualExpense = expenseEntries.reduce((sum, expense) => sum + getAnnualExpense(expense), 0);

    const categoryExpenses = {};
    expenseEntries.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        if (!categoryExpenses[category]) {
            categoryExpenses[category] = {
                daily: 0,
                weekly: 0,
                fortnightly: 0,
                monthly: 0,
                yearly: 0,
                totalAnnual: 0
            };
        }
        const annualAmount = getAnnualExpense(expense);
        categoryExpenses[category].totalAnnual += annualAmount;
        categoryExpenses[category].daily += parseFloat(expense.amount) * (expense.frequency === 'daily' ? 1 : expense.frequency === 'weekly' ? 1/7 : expense.frequency === 'fortnightly' ? 1/14 : expense.frequency === 'monthly' ? 1/30.44 : expense.frequency === 'quarterly' ? 1/91.33 : expense.frequency === 'yearly' ? 1/365.25 : 0);
        categoryExpenses[category].weekly += parseFloat(expense.amount) * (expense.frequency === 'daily' ? 7 : expense.frequency === 'weekly' ? 1 : expense.frequency === 'fortnightly' ? 1/2 : expense.frequency === 'monthly' ? 1/4.35 : expense.frequency === 'quarterly' ? 1/13.04 : expense.frequency === 'yearly' ? 1/52 : 0);
        categoryExpenses[category].fortnightly += parseFloat(expense.amount) * (expense.frequency === 'daily' ? 14 : expense.frequency === 'weekly' ? 2 : expense.frequency === 'fortnightly' ? 1 : expense.frequency === 'monthly' ? 1/2.17 : expense.frequency === 'quarterly' ? 2/13.04 : expense.frequency === 'yearly' ? 2/52 : 0);
        categoryExpenses[category].monthly += parseFloat(expense.amount) * (expense.frequency === 'daily' ? 30.44 : expense.frequency === 'weekly' ? 4.35 : expense.frequency === 'fortnightly' ? 2.17 : expense.frequency === 'monthly' ? 1 : expense.frequency === 'quarterly' ? 1/3 : expense.frequency === 'yearly' ? 1/12 : 0);
        categoryExpenses[category].yearly += annualAmount;
    });

    for (const category in categoryExpenses) {
        const categoryData = categoryExpenses[category];
        const row = tableBody.insertRow();

        const categoryCell = row.insertCell();
        categoryCell.textContent = category;

        const dailyCell = row.insertCell();
        dailyCell.textContent = `$${categoryData.daily.toFixed(2)}`;

        const weeklyCell = row.insertCell();
        weeklyCell.textContent = `$${categoryData.weekly.toFixed(2)}`;

        const fortnightlyCell = row.insertCell();
        fortnightlyCell.textContent = `$${categoryData.fortnightly.toFixed(2)}`;

        const monthlyCell = row.insertCell();
        monthlyCell.textContent = `$${categoryData.monthly.toFixed(2)}`;

        const yearlyCell = row.insertCell();
        yearlyCell.textContent = `$${categoryData.yearly.toFixed(2)}`;

        const percentageOfTotalExpenseCell = row.insertCell();
        const percentageOfExpense = totalAnnualExpense > 0 ? (categoryData.totalAnnual / totalAnnualExpense) * 100 : 0;
        percentageOfTotalExpenseCell.textContent = `${percentageOfExpense.toFixed(2)}%`;

        const percentageOfTotalIncomeCell = row.insertCell();
        const percentageOfIncome = totalAnnualIncome > 0 ? (categoryData.totalAnnual / totalAnnualIncome) * 100 : 0;
        percentageOfTotalIncomeCell.textContent = `${percentageOfIncome.toFixed(2)}%`;
    }

    const headers = document.querySelectorAll('#category-analysis-table th');
    headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const sortBy = header.getAttribute('data-sort');
            sortCategoryTable(sortBy, tableBody);
            updateSortIcons(header, headers);
        });
    });
}

function sortCategoryTable(sortBy, tableBody) {
    const rows = Array.from(tableBody.rows);
    const isNumber = sortBy === 'daily' || sortBy === 'weekly' || sortBy === 'fortnightly' || sortBy === 'monthly' || sortBy === 'yearly' || sortBy === 'percentageOfTotalExpense' || sortBy === 'percentageOfTotalIncome';

    const sortedRows = rows.sort((a, b) => {
        const aValue = a.cells[getCategoryColumnIndex(sortBy)].textContent.replace('$', '').replace('%', '').toLowerCase();
        const bValue = b.cells[getCategoryColumnIndex(sortBy)].textContent.replace('$', '').replace('%', '').toLowerCase();

        let comparison = 0;
        if (isNumber) {
            comparison = parseFloat(aValue) - parseFloat(bValue);
        } else {
            comparison = aValue.localeCompare(bValue);
        }

        const header = Array.from(document.querySelectorAll('#category-analysis-table th')).find(th => th.getAttribute('data-sort') === sortBy);
        const isAsc = header && header.classList.contains('sorted-asc');
        return isAsc ? comparison : -comparison;
    });

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    sortedRows.forEach(row => tableBody.appendChild(row));
}

function getCategoryColumnIndex(sortBy) {
    switch (sortBy) {
        case 'category': return 0;
        case 'daily': return 1;
        case 'weekly': return 2;
        case 'fortnightly': return 3;
        case 'monthly': return 4;
        case 'yearly': return 5;
        case 'percentageOfTotalExpense': return 6;
        case 'percentageOfTotalIncome': return 7;
        default: return 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderExpenseAnalysisTable();
    renderHeaderCalculations();
    renderFrequencySummary();
    renderExpenseSummary();
    renderNetPositionSummary();
    renderCategoryAnalysisTable(); 
});

document.addEventListener('dataUpdated', () => {
    renderExpenseAnalysisTable();
    renderHeaderCalculations();
    renderFrequencySummary();
    renderExpenseSummary();
    renderNetPositionSummary();
    renderCategoryAnalysisTable();
});
