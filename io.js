function saveData() {
    const allData = {
        accounts: accounts,
        income: incomeEntries,
        expenses: expenseEntries,
        goals: goals
    };

    const jsonData = JSON.stringify(allData);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Data saved to budget_data.json');
}

function loadData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedData = JSON.parse(e.target.result);
                    let loadSuccessful = true;

                    if (loadedData.accounts) {
                        accounts = loadedData.accounts;
                        if (typeof renderAccountsTables === 'function') {
                            renderAccountsTables();
                        } else {
                            console.error('Error: renderAccountsTables is not defined when loading accounts.');
                            alert('Error loading account data. Please ensure the application scripts are loaded correctly.');
                            loadSuccessful = false;
                        }
                    }
                    if (loadedData.income) {
                        incomeEntries = loadedData.income;
                        if (typeof renderIncomeTable === 'function') {
                            renderIncomeTable();
                        } else {
                            console.error('Error: renderIncomeTable is not defined when loading income.');
                            alert('Error loading income data. Please ensure the application scripts are loaded correctly.');
                            loadSuccessful = false;
                        }
                    }
                    if (loadedData.expenses) {
                        expenseEntries = loadedData.expenses;
                        if (typeof renderExpenseTable === 'function') {
                            renderExpenseTable();
                        } else {
                            console.error('Error: renderExpenseTable is not defined when loading expenses.');
                            alert('Error loading expense data. Please ensure the application scripts are loaded correctly.');
                            loadSuccessful = false;
                        }
                    }

                    // "goals" is a newer, optional key — older budget_data.json files simply
                    // won't have it, so we default to an empty list rather than failing.
                    // normalizeGoal migrates goals saved under the earlier absolute-target
                    // model (no amountType) into the current fixed/bufferMonths shape.
                    goals = loadedData.goals || [];
                    if (typeof normalizeGoal === 'function') {
                        goals = goals.map(normalizeGoal);
                    }
                    if (typeof renderGoalsTable === 'function') {
                        renderGoalsTable();
                    } else {
                        console.error('Error: renderGoalsTable is not defined when loading goals.');
                    }

                    // Call all rendering and calculation functions after loading data
                    if (typeof renderFrequencySummary === 'function') {
                        renderFrequencySummary();
                    } else {
                        console.error('Error: renderFrequencySummary is not defined after loading data.');
                    }

                    if (typeof renderExpenseSummary === 'function') {
                        renderExpenseSummary();
                    } else {
                        console.error('Error: renderExpenseSummary is not defined after loading data.');
                    }

                    if (typeof renderNetPositionSummary === 'function') {
                        renderNetPositionSummary();
                    } else {
                        console.error('Error: renderNetPositionSummary is not defined after loading data.');
                    }

                    if (typeof renderExpenseAnalysisTable === 'function') {
                        renderExpenseAnalysisTable();
                    } else {
                        console.error('Error: renderExpenseAnalysisTable is not defined after loading data.');
                    }

                    if (typeof renderCategoryAnalysisTable === 'function') {
                        renderCategoryAnalysisTable();
                    } else {
                        console.error('Error: renderCategoryAnalysisTable is not defined after loading data.');
                    }

                    if (typeof renderHeaderCalculations === 'function') {
                        renderHeaderCalculations();
                    } else {
                        console.error('Error: renderHeaderCalculations is not defined after loading data.');
                    }

                    const countdownTabButton = document.querySelector('.tab-buttons-header button[data-tab="countdown"]');
                    if (countdownTabButton && typeof renderCountdownData === 'function') {
                        renderCountdownData();
                    } else if (countdownTabButton) {
                        console.error('Error: renderCountdownData is not defined after loading data.');
                    }

                    if (loadSuccessful) {
                        alert('Data loaded successfully!');
                        // Programmatically trigger a click on the 'View & Edit' tab button
                        const viewTabButton = document.querySelector('.tab-buttons-header button[data-tab="view"]');
                        if (viewTabButton) {
                            viewTabButton.click();
                        } else {
                            console.warn('Warning: View & Edit tab button not found. Navigation to View tab failed.');
                        }
                        // Set a flag in localStorage to indicate data was just loaded
                        localStorage.setItem('justLoadedData', 'true');
                    }

                } catch (error) {
                    alert('Error loading data: Invalid JSON file.');
                    console.error('Error loading data:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    fileInput.click();
}
