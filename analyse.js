// analyse.js

function calculateTotalForFrequency(entries, frequency) {
    return entries.reduce((sum, entry) => {
        switch (frequency) {
            case 'daily':
                return sum + (entry.daily || 0);
            case 'weekly':
                return sum + (entry.weekly || 0);
            case 'fortnightly':
                return sum + (entry.fortnightly || 0);
            case 'monthly':
                return sum + (entry.monthly || 0);
            case 'quarterly':
                return sum + (entry.quarterly || 0);
            case 'yearly':
                return sum + (entry.yearly || 0);
            default:
                return sum;
        }
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
        } else if (account.name.toLowerCase().includes('mortgage')) {
            mortgageBalance = parseFloat(account.balance);
            if (isNaN(mortgageBalance)) mortgageBalance = 0;
        } else if (account.name.toLowerCase().includes('offset')) {
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

    return Math.max(0, totalDebt); // Debt cannot be negative
}

function calculateTotalMoney(accounts) {
    let totalMoney = 0;
    accounts.forEach(account => {
        if (account.name.toLowerCase().includes('offset') || account.type === 'everyday') {
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
                    <th data-sort="amount">Amount ($)</th>
                    <th data-sort="percentageOfTotalExpense">Of Total Expense (%)</th>
                    <th data-sort="percentageOfTotalIncome">Of Total Income (%)</th>
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
    tableBody.innerHTML = ''; // Clear previous data

    if (expenseEntries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No expense data available.</td></tr>';
        return;
    }

    let totalAnnualIncome = 0;
    if (typeof calculateTotalAnnualIncome === 'function') {
        totalAnnualIncome = calculateTotalAnnualIncome();
    } else {
        console.warn('calculateTotalAnnualIncome function not found in income.js. Using 0 for income percentage.');
    }

    function getAnnualExpense(expense) {
        switch (expense.frequency) {
            case 'daily':
                return expense.amount * 365.25;
            case 'weekly':
                return expense.amount * 52;
            case 'fortnightly':
                return expense.amount * 26;
            case 'monthly':
                return expense.amount * 12;
            case 'quarterly':
                return expense.amount * 4;
            case 'yearly':
                return expense.amount;
            default:
                return expense.amount;
        }
    }

    const totalAnnualExpense = expenseEntries.reduce((sum, expense) => sum + getAnnualExpense(expense), 0);

    expenseEntries.forEach(expense => {
        const row = tableBody.insertRow();

        const descriptionCell = row.insertCell();
        descriptionCell.textContent = expense.source;

        const amountCell = row.insertCell();
        amountCell.textContent = `$${expense.amount.toFixed(2)}`;

        const percentageOfTotalExpenseCell = row.insertCell();
        const percentageOfExpense = totalAnnualExpense > 0 ? (getAnnualExpense(expense) / totalAnnualExpense) * 100 : 0;
        percentageOfTotalExpenseCell.textContent = percentageOfExpense.toFixed(2);

        const percentageOfTotalIncomeCell = row.insertCell();
        const percentageOfIncome = totalAnnualIncome > 0 ? (getAnnualExpense(expense) / totalAnnualIncome) * 100 : 0;
        percentageOfTotalIncomeCell.textContent = percentageOfIncome.toFixed(2);
    });

    const headers = document.querySelectorAll('#expense-analysis-table th');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.getAttribute('data-sort');
            sortTable(sortBy, tableBody);
        });
        header.style.cursor = 'pointer';
    });
}

function sortTable(sortBy, tableBody) {
    const rows = Array.from(tableBody.rows);
    const isNumber = sortBy === 'amount' || sortBy === 'percentageOfTotalExpense' || sortBy === 'percentageOfTotalIncome';

    const sortedRows = rows.sort((a, b) => {
        const aValue = isNumber ? parseFloat(a.cells[getColumnIndex(sortBy)].textContent) : a.cells[getColumnIndex(sortBy)].textContent.toLowerCase();
        const bValue = isNumber ? parseFloat(b.cells[getColumnIndex(sortBy)].textContent) : b.cells[getColumnIndex(sortBy)].textContent.toLowerCase();

        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
    });

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    sortedRows.forEach(row => tableBody.appendChild(row));
}

function getColumnIndex(sortBy) {
    switch (sortBy) {
        case 'description': return 0;
        case 'amount': return 1;
        case 'percentageOfTotalExpense': return 2;
        case 'percentageOfTotalIncome': return 3;
        default: return 0;
    }
}

// Call these functions whenever data changes
document.addEventListener('DOMContentLoaded', () => {
    renderExpenseAnalysisTable();
    renderHeaderCalculations();
});
