document.addEventListener('DOMContentLoaded', () => {
    const countdownTabButton = document.querySelector('.tab-button[data-tab="countdown"]');
    if (countdownTabButton) {
        countdownTabButton.addEventListener('click', renderCountdownData);
    }

    const initialTab = document.querySelector('.tab-button.active');
    if (initialTab && initialTab.getAttribute('data-tab') === 'countdown') {
        renderCountdownData();
    }
});

function calculateTotalAssetsForCountdown(accounts) {
    let totalAssets = 0;
    accounts.forEach(account => {
        if (account.type !== 'mortgage' && account.type !== 'credit' && !isNaN(parseFloat(account.balance))) {
            totalAssets += parseFloat(account.balance);
        }
    });
    return totalAssets;
}

function calculateTotalLiabilitiesForCountdown(accounts) {
    let totalLiabilities = 0;
    accounts.forEach(account => {
        if (account.type === 'credit') {
            const owing = parseFloat(account.limit) - parseFloat(account.availableBalance);
            if (!isNaN(owing) && owing > 0) {
                totalLiabilities += owing;
            }
        } else if (account.type === 'mortgage' && !isNaN(parseFloat(account.balance))) {
            // Mortgage balance is typically negative, so we add its absolute value as a liability
            totalLiabilities += Math.abs(parseFloat(account.balance));
        }
    });
    return totalLiabilities;
}

function calculateOverallPosition() {
    const totalAssets = calculateTotalAssetsForCountdown(accounts);
    const totalLiabilities = calculateTotalLiabilitiesForCountdown(accounts);
    return totalAssets - totalLiabilities;
}

function calculateTimeUntilNoMoney(totalAssets, totalExpenses) {
    if (totalExpenses === 0) {
        return Infinity; // Avoid division by zero
    }
    return totalAssets / totalExpenses;
}

function getTotalExpensesForFrequency(frequency) {
    return expenseEntries.reduce((sum, expense) => {
        switch (frequency) {
            case 'yearly':
                return sum + (expense.yearly || 0);
            case 'monthly':
                return sum + (expense.monthly || 0);
            case 'fortnightly':
                return sum + (expense.fortnightly || 0);
            case 'weekly':
                return sum + (expense.weekly || 0);
            case 'daily':
                return sum + (expense.daily || 0);
            case 'hourly':
                return sum + (expense.daily || 0) / 24;
            default:
                return sum;
        }
    }, 0);
}

function getProjectedDateOfNoFunds(amount) { 
    const currentTotalExpensesPerDay = getTotalExpensesForFrequency('daily');

    if (currentTotalExpensesPerDay <= 0 || amount <= 0) {
        return 'N/A';
    }

    const daysUntilEmpty = amount / currentTotalExpensesPerDay;
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + (daysUntilEmpty * 24 * 60 * 60 * 1000));

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return futureDate.toLocaleDateString(undefined, options);
}

function renderCountdownData() {
    const totalAssetsElement = document.getElementById('total-assets');
    const totalLiabilitiesElement = document.getElementById('total-liabilities');
    const overallPositionElement = document.getElementById('overall-position');
    const timeUntilNoMoneyBody = document.getElementById('time-until-no-money-body');
    const dateOfNoFundsElement = document.getElementById('date-of-no-funds');
    const assetBreakdownBody = document.getElementById('asset-breakdown-body');
    const liabilityBreakdownBody = document.getElementById('liability-breakdown-body');
    const netTimeUntilNoMoneyBody = document.getElementById('net-time-until-no-money-body');
    const netDateOfNoFundsElement = document.getElementById('net-date-of-no-funds');

    if (!totalAssetsElement || !totalLiabilitiesElement || !overallPositionElement || !timeUntilNoMoneyBody || !dateOfNoFundsElement || !assetBreakdownBody || !liabilityBreakdownBody || !netTimeUntilNoMoneyBody || !netDateOfNoFundsElement) {
        console.error('One or more countdown elements not found in the HTML.');
        return;
    }

    const totalAssets = calculateTotalAssetsForCountdown(accounts);
    const totalLiabilities = calculateTotalLiabilitiesForCountdown(accounts);
    const overallPosition = calculateOverallPosition();

    totalAssetsElement.textContent = `$${totalAssets.toFixed(2)}`;
    totalLiabilitiesElement.textContent = `$${totalLiabilities.toFixed(2)}`;
    overallPositionElement.textContent = `$${overallPosition.toFixed(2)}`;
    if (overallPosition < 0) {
        overallPositionElement.classList.add('negative');
        overallPositionElement.classList.remove('positive');
    } else {
        overallPositionElement.classList.add('positive');
        overallPositionElement.classList.remove('negative');
    }

    timeUntilNoMoneyBody.innerHTML = '';
    netTimeUntilNoMoneyBody.innerHTML = '';

    const timeCalculations = [
        { unit: 'Years', duration: calculateTimeUntilNoMoney(totalAssets, getTotalExpensesForFrequency('yearly')), expense: getTotalExpensesForFrequency('yearly'), frequency: 'year' },
        { unit: 'Months', duration: calculateTimeUntilNoMoney(totalAssets, getTotalExpensesForFrequency('monthly')), expense: getTotalExpensesForFrequency('monthly'), frequency: 'month' },
        { unit: 'Fortnights', duration: calculateTimeUntilNoMoney(totalAssets, getTotalExpensesForFrequency('fortnightly')), expense: getTotalExpensesForFrequency('fortnightly'), frequency: 'fortnight' },
        { unit: 'Weeks', duration: calculateTimeUntilNoMoney(totalAssets, getTotalExpensesForFrequency('weekly')), expense: getTotalExpensesForFrequency('weekly'), frequency: 'week' },
        { unit: 'Days', duration: calculateTimeUntilNoMoney(totalAssets, getTotalExpensesForFrequency('daily')), expense: getTotalExpensesForFrequency('daily'), frequency: 'day' },
        { unit: 'Hours', duration: calculateTimeUntilNoMoney(totalAssets, getTotalExpensesForFrequency('hourly')), expense: getTotalExpensesForFrequency('hourly'), frequency: 'hour' },
    ];

    timeCalculations.forEach(item => {
        const row = timeUntilNoMoneyBody.insertRow();
        const cell = row.insertCell();
        cell.innerHTML = `${item.duration === Infinity ? '∞' : item.duration.toFixed(2)} ${item.unit} left at $${item.expense.toFixed(2)} per ${item.frequency}<br>`;
    });

    // Calculate and render Time Until No Money (Net)
    const netTimeCalculations = [
        { unit: 'Years', duration: calculateTimeUntilNoMoney(overallPosition, getTotalExpensesForFrequency('yearly')), expense: getTotalExpensesForFrequency('yearly'), frequency: 'year' },
        { unit: 'Months', duration: calculateTimeUntilNoMoney(overallPosition, getTotalExpensesForFrequency('monthly')), expense: getTotalExpensesForFrequency('monthly'), frequency: 'month' },
        { unit: 'Fortnights', duration: calculateTimeUntilNoMoney(overallPosition, getTotalExpensesForFrequency('fortnightly')), expense: getTotalExpensesForFrequency('fortnightly'), frequency: 'fortnight' },
        { unit: 'Weeks', duration: calculateTimeUntilNoMoney(overallPosition, getTotalExpensesForFrequency('weekly')), expense: getTotalExpensesForFrequency('weekly'), frequency: 'week' },
        { unit: 'Days', duration: calculateTimeUntilNoMoney(overallPosition, getTotalExpensesForFrequency('daily')), expense: getTotalExpensesForFrequency('daily'), frequency: 'day' },
        { unit: 'Hours', duration: calculateTimeUntilNoMoney(overallPosition, getTotalExpensesForFrequency('hourly')), expense: getTotalExpensesForFrequency('hourly'), frequency: 'hour' },
    ];

    netTimeCalculations.forEach(item => {
        const row = netTimeUntilNoMoneyBody.insertRow();
        const cell = row.insertCell();
        cell.innerHTML = `${item.duration === Infinity ? '∞' : item.duration.toFixed(2)} ${item.unit} left at $${item.expense.toFixed(2)} per ${item.frequency}<br>`;
    });

    const projectedDate = getProjectedDateOfNoFunds(totalAssets);
    dateOfNoFundsElement.textContent = projectedDate;

    // Calculate and render Net Projected Date of No Funds
    const netProjectedDate = getProjectedDateOfNoFunds(overallPosition);
    netDateOfNoFundsElement.textContent = netProjectedDate;

    // Render Asset Breakdown
    assetBreakdownBody.innerHTML = '';
    accounts.forEach(account => {
        if (account.type !== 'mortgage' && account.type !== 'credit' && parseFloat(account.balance) > 0 && !isNaN(parseFloat(account.balance))) {
            const row = assetBreakdownBody.insertRow();
            const nameCell = row.insertCell();
            const balanceCell = row.insertCell();
            nameCell.textContent = account.name || account.bank || 'Account';
            balanceCell.textContent = `$${parseFloat(account.balance).toFixed(2)}`;
        }
    });

    // Render Liability Breakdown
    liabilityBreakdownBody.innerHTML = '';
    accounts.forEach(account => {
        if (account.type === 'credit') {
            const owing = parseFloat(account.limit) - parseFloat(account.availableBalance);
            if (!isNaN(owing) && owing > 0) {
                const row = liabilityBreakdownBody.insertRow();
                const nameCell = row.insertCell();
                const debtCell = row.insertCell();
                nameCell.textContent = account.name || account.bank || 'Credit Card';
                debtCell.textContent = `$${owing.toFixed(2)}`;
            }
        } else if (account.type === 'mortgage' && parseFloat(account.balance) < 0 && !isNaN(parseFloat(account.balance))) {
            const row = liabilityBreakdownBody.insertRow();
            const nameCell = row.insertCell();
            const debtCell = row.insertCell();
            nameCell.textContent = account.name || account.bank || 'Mortgage';
            debtCell.textContent = `$${Math.abs(parseFloat(account.balance)).toFixed(2)}`;
        }
    });
}

// Ensure the countdown data is rendered if the data is loaded and the tab is active
document.addEventListener('dataUpdated', () => {
    const countdownTabButton = document.querySelector('.tab-button[data-tab="countdown"]');
    if (countdownTabButton && countdownTabButton.classList.contains('active')) {
        renderCountdownData();
    }
});
