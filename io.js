function saveData() {
    const allData = {
        accounts: accounts,
        income: incomeEntries,
        expenses: expenseEntries
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
                    if (loadedData.accounts && typeof renderAccountsTables === 'function') {
                        accounts = loadedData.accounts;
                        renderAccountsTables();
                    }
                    if (loadedData.income) {
                        incomeEntries = loadedData.income;
                        if (typeof renderIncomeTable === 'function' && typeof renderFrequencySummary === 'function') {
                            renderIncomeTable();
                            renderFrequencySummary();
                        } else {
                            console.error('Error: renderIncomeTable or renderFrequencySummary is not defined when loading income.');
                            alert('Error loading income data. Please ensure the application scripts are loaded correctly.');
                        }
                    }
                    if (loadedData.expenses) {
                        expenseEntries = loadedData.expenses;
                        if (typeof renderExpenseTable === 'function' && typeof renderExpenseSummary === 'function') {
                            renderExpenseTable();
                            renderExpenseSummary();
                        } else {
                            console.error('Error: renderExpenseTable or renderExpenseSummary is not defined when loading expenses.');
                            alert('Error loading expense data. Please ensure the application scripts are loaded correctly.');
                        }
                    }

                    // Call renderExpenseAnalysisTable after loading income and expenses
                    if (typeof renderExpenseAnalysisTable === 'function') {
                        renderExpenseAnalysisTable();
                        renderHeaderCalculations();
                    } else {
                        console.error('Error: renderExpenseAnalysisTable is not defined after loading data.');
                    }

                    alert('Data loaded successfully!');
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
