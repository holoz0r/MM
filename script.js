document.addEventListener('DOMContentLoaded', () => {
    // --- Local Storage Management ---
    const loadData = () => {
        return {
            income: JSON.parse(localStorage.getItem('income')) || [],
            expenses: JSON.parse(localStorage.getItem('expenses')) || [],
            accounts: JSON.parse(localStorage.getItem('accounts')) || {
                everyday: [],
                savings: [],
                offset: [],
                credit: [],
                mortgage: [],
            },
        };
    };

    const saveData = (data) => {
        localStorage.setItem('income', JSON.stringify(data.income));
        localStorage.setItem('expenses', JSON.stringify(data.expenses));
        localStorage.setItem('accounts', JSON.stringify(data.accounts));
    };

    let data = loadData();

    // --- Frequency Normalization ---
    const normalizeFrequency = (amount, frequency) => {
        const frequencyMultipliers = {
            daily: 365,
            weekly: 52,
            fortnightly: 26,
            monthly: 12,
            quarterly: 4,
            yearly: 1,
        };
        return amount * frequencyMultipliers[frequency];
    };

    // --- Table Rendering Functions ---
    const renderIncomeTable = () => {
        const incomeTableBody = document.querySelector('#income-table tbody');
        incomeTableBody.innerHTML = '';

        data.income.forEach((income, index) => {
            const row = incomeTableBody.insertRow();
            row.innerHTML = `
                <td>${income.source}</td>
                <td>${(income.frequency === 'weekly' ? income.amount : normalizeFrequency(income.amount, income.frequency) / 52).toFixed(2)}</td>
                <td>${(income.frequency === 'fortnightly' ? income.amount : normalizeFrequency(income.amount, income.frequency) / 26).toFixed(2)}</td>
                <td>${(income.frequency === 'monthly' ? income.amount : normalizeFrequency(income.amount, income.frequency) / 12).toFixed(2)}</td>
                <td>${(income.frequency === 'quarterly' ? income.amount : normalizeFrequency(income.amount, income.frequency) / 4).toFixed(2)}</td>
                <td>${normalizeFrequency(income.amount, income.frequency).toFixed(2)}</td>
                <td>
                    <button class="edit-income" data-index="${index}">Edit</button>
                    <button class="delete-income" data-index="${index}">Delete</button>
                </td>
            `;
        });
        updateIncomeTotals();
    };

    const renderExpenseTable = () => {
        const expenseTableBody = document.querySelector('#expense-table tbody');
        expenseTableBody.innerHTML = '';

        data.expenses.forEach((expense, index) => {
            const row = expenseTableBody.insertRow();
            row.innerHTML = `
                <td>${expense.name}</td>
                <td>${expense.category}</td>
                <td>${(expense.frequency === 'daily' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 365).toFixed(2)}</td>
                <td>${(expense.frequency === 'weekly' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 52).toFixed(2)}</td>
                <td>${(expense.frequency === 'fortnightly' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 26).toFixed(2)}</td>
                <td>${(expense.frequency === 'monthly' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 12).toFixed(2)}</td>
                <td>${(expense.frequency === 'quarterly' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 4).toFixed(2)}</td>
                <td>${normalizeFrequency(expense.amount, expense.frequency).toFixed(2)}</td>
                <td>
                    <button class="edit-expense" data-index="${index}">Edit</button>
                    <button class="delete-expense" data-index="${index}">Delete</button>
                </td>
            `;
        });
        updateExpenseTotals();
    };

const renderAccountTables = () => {
    const accountTypes = ['everyday', 'savings', 'offset', 'credit', 'mortgage'];
    accountTypes.forEach(type => {
        const tableBody = document.querySelector(`#${type}-account-table tbody`);
        tableBody.innerHTML = '';

        data.accounts[type].forEach((account, index) => {
            const row = tableBody.insertRow();
            let rowContent = `
                <td>${account.name || ''}</td>
                <td>${account.bank || ''}</td>
            `;

            if (type === 'credit') {
                rowContent += `
                    <td>${account.available || ''}</td>
                    <td>${account.limit || ''}</td>
                    <td>${account.interest || 'N/A'}</td>
                `;
            } else if (type === 'mortgage'){
                rowContent += `<td>${account.owing || ''}</td>`;
                rowContent += `<td>${account.interest || 'N/A'}</td>`;
            } else if (type !== 'offset') {
                rowContent += `<td>${account.balance || ''}</td>`;
                rowContent += `<td>${account.interest || 'N/A'}</td>`;
            } else {
                rowContent += `<td>${account.balance || ''}</td>`;
            }

            rowContent += `
                <td>
                    <button class="edit-account" data-type="${type}" data-index="${index}">Edit</button>
                    <button class="delete-account" data-type="${type}" data-index="${index}">Delete</button>
                </td>
            `;
            row.innerHTML = rowContent;
        });
    });
};

    // --- Total Calculation Functions ---
    const updateIncomeTotals = () => {
        const weeklyTotal = data.income.reduce((sum, income) => sum + (income.frequency === 'weekly' ? income.amount : normalizeFrequency(income.amount, income.frequency) / 52), 0).toFixed(2);
        const fortnightlyTotal = data.income.reduce((sum, income) => sum + (income.frequency === 'fortnightly' ? income.amount : normalizeFrequency(income.amount, income.frequency) / 26), 0).toFixed(2);
        const monthlyTotal = data.income.reduce((sum, income) => sum + (income.frequency === 'monthly' ? income.amount : normalizeFrequency(income.amount, income.frequency) / 12), 0).toFixed(2);
        const quarterlyTotal = data.income.reduce((sum, income) => sum + (income.frequency === 'quarterly' ? income.amount : normalizeFrequency(income.amount, income.frequency) / 4), 0).toFixed(2);
        const yearlyTotal = data.income.reduce((sum, income) => sum + normalizeFrequency(income.amount, income.frequency), 0).toFixed(2);

        document.querySelector('#total-weekly-income').textContent = weeklyTotal;
        document.querySelector('#total-fortnightly-income').textContent = fortnightlyTotal;
        document.querySelector('#total-monthly-income').textContent = monthlyTotal;
        document.querySelector('#total-quarterly-income').textContent = quarterlyTotal;
        document.querySelector('#total-yearly-income').textContent = yearlyTotal;

        document.querySelector('#total-income-card').textContent = `$${yearlyTotal}`;
    };

    const updateExpenseTotals = () => {
        const dailyTotal = data.expenses.reduce((sum, expense) => sum + (expense.frequency === 'daily' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 365), 0).toFixed(2);
        const weeklyTotal = data.expenses.reduce((sum, expense) => sum + (expense.frequency === 'weekly' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 52), 0).toFixed(2);
        const fortnightlyTotal = data.expenses.reduce((sum, expense) => sum + (expense.frequency === 'fortnightly' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 26), 0).toFixed(2);
        const monthlyTotal = data.expenses.reduce((sum, expense) => sum + (expense.frequency === 'monthly' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 12), 0).toFixed(2);
        const quarterlyTotal = data.expenses.reduce((sum, expense) => sum + (expense.frequency === 'quarterly' ? expense.amount : normalizeFrequency(expense.amount, expense.frequency) / 4), 0).toFixed(2);
        const yearlyTotal = data.expenses.reduce((sum, expense) => sum + normalizeFrequency(expense.amount, expense.frequency), 0).toFixed(2);

        document.querySelector('#total-daily-expense').textContent = dailyTotal;
        document.querySelector('#total-weekly-expense').textContent = weeklyTotal;
        document.querySelector('#total-fortnightly-expense').textContent = fortnightlyTotal;
        document.querySelector('#total-monthly-expense').textContent = monthlyTotal;
        document.querySelector('#total-quarterly-expense').textContent = quarterlyTotal;
        document.querySelector('#total-yearly-expense').textContent = yearlyTotal;

        document.querySelector('#total-expenses-card').textContent = `$${yearlyTotal}`;
    };

    // --- Form Handling ---
    document.querySelector('#income-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const source = document.querySelector('#income-source').value;
        const amount = parseFloat(document.querySelector('#income-amount').value);
        const frequency = document.querySelector('#income-frequency').value;

        if (amount <= 0) {
            alert('Amount must be positive.');
            return;
        }

        data.income.push({ source, amount, frequency });
        saveData(data);
        renderIncomeTable();
        document.querySelector('#income-form').reset();
    });

    document.querySelector('#expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.querySelector('#expense-name').value;
        const category = document.querySelector('#expense-category').value;
        const amount = parseFloat(document.querySelector('#expense-amount').value);
        const frequency = document.querySelector('#expense-frequency').value;

        if (amount <= 0) {
            alert('Amount must be positive.');
            return;
        }

        data.expenses.push({ name, category, amount, frequency });
        saveData(data);
        renderExpenseTable();
        document.querySelector('#expense-form').reset();
    });

    document.querySelector('#account-type-selector').addEventListener('change', (e) => {
        const selectedType = e.target.value;
        document.querySelectorAll('.account-form').forEach(form => {
            form.style.display = 'none';
        });
        document.querySelector(`#${selectedType}-account-form`).style.display = 'block';
    });
    //Account submission functions.
    const submitEverydayAccount = (formData) => {
        const account = {
            name: formData.get('everyday-name'),
            bank: formData.get('everyday-bank'),
            balance: parseFloat(formData.get('everyday-balance')) || 0,
            interest: parseFloat(formData.get('everyday-interest')) || null,
        };
        console.log(account);
        data.accounts.everyday.push(account);
        return true;
    };

    const submitSavingsAccount = (formData) => {
        const account = {
            name: formData.get('savings-name'),
            bank: formData.get('savings-bank'),
            balance: parseFloat(formData.get('savings-balance')) || 0,
            interest: parseFloat(formData.get('savings-interest')) || null,
        };
        console.log(account);
        data.accounts.savings.push(account);
        return true;
    };

    const submitOffsetAccount = (formData) => {
        const account = {
            name: formData.get('offset-name'),
            bank: formData.get('offset-bank'),
            balance: parseFloat(formData.get('offset-balance')) || 0,
            interest: parseFloat(formData.get('offset-interest')) || null,
        };
        console.log(account);
        data.accounts.offset.push(account);
        return true;
    };

    const submitCreditAccount = (formData) => {
        const account = {
            name: formData.get('credit-name'),
            bank: formData.get('credit-bank'),
            available: parseFloat(formData.get('credit-available')) || 0,
            limit: parseFloat(formData.get('credit-limit')) || 0,
            interest: parseFloat(formData.get('credit-interest')) || null,
        };
        if (account.available <= 0 || account.limit <= 0) {
            alert('Available and limit must be positive.');
            return false;
        }
        console.log(account);
        data.accounts.credit.push(account);
        return true;
    };

    const submitMortgageAccount = (formData) => {
        const account = {
            name: formData.get('mortgage-name'),
            bank: formData.get('mortgage-bank'),
            owing: parseFloat(formData.get('mortgage-owing')) || 0,
            interest: parseFloat(formData.get('mortgage-interest')) || null,
        };
        console.log(account);
        data.accounts.mortgage.push(account);
        return true;
    };

    document.querySelectorAll('.account-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = e.target.id.replace('-account-form', '');
            const formData = new FormData(e.target);
            let success = false;

            switch (type) {
                case 'everyday':
                    success = submitEverydayAccount(formData);
                    break;
                case 'savings':
                    success = submitSavingsAccount(formData);
                    break;
                case 'offset':
                    success = submitOffsetAccount(formData);
                    break;
                case 'credit':
                    success = submitCreditAccount(formData);
                    break;
                case 'mortgage':
                    success = submitMortgageAccount(formData);
                    break;
            }
            if (success) {
                saveData(data);
                renderAccountTables();
                e.target.reset();
            }
        });
    });

    // --- Tab Switching ---
    document.querySelectorAll('.tab-button').forEach((button) => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            document.querySelectorAll('.tab-pane').forEach((pane) => {
                pane.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('.tab-button').forEach((btn) => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });

    document.querySelectorAll('.form-tab-button').forEach((button) => {
        button.addEventListener('click', () => {
            const formId = button.dataset.form;
            document.querySelectorAll('.form-pane').forEach((pane) => {
                pane.classList.remove('active');
            });
            document.getElementById(formId).classList.add('active');
            document.querySelectorAll('.form-tab-button').forEach((btn) => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });
    // --- Edit and Delete Functionality ---
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-income')) {
            const index = parseInt(e.target.dataset.index);
            const income = data.income[index];
            const row = e.target.closest('tr');

            row.innerHTML = `
                <td><input type="text" value="${income.source}" class="edit-source"></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                    <select class="edit-frequency">
                        <option value="weekly" ${income.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                        <option value="fortnightly" ${income.frequency === 'fortnightly' ? 'selected' : ''}>Fortnightly</option>
                        <option value="monthly" ${income.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        <option value="quarterly" ${income.frequency === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                        <option value="yearly" ${income.frequency === 'yearly' ? 'selected' : ''}>Yearly</option>
                    </select>
                    <input type="number" value="${income.amount}" class="edit-amount">
                    <button class="save-edit-income" data-index="${index}">Save</button>
                    <button class="cancel-edit">Cancel</button>
                </td>
            `;
        }

        if (e.target.classList.contains('save-edit-income')) {
            const index = parseInt(e.target.dataset.index);
            const row = e.target.closest('tr');
            data.income[index].source = row.querySelector('.edit-source').value;
            data.income[index].amount = parseFloat(row.querySelector('.edit-amount').value);
            data.income[index].frequency = row.querySelector('.edit-frequency').value;
            saveData(data);
            renderIncomeTable();
        }

        if (e.target.classList.contains('cancel-edit')) {
            renderIncomeTable();
        }

        if (e.target.classList.contains('delete-income')) {
            if (confirm('Are you sure you want to delete this income entry?')) {
                const index = parseInt(e.target.dataset.index);
                data.income.splice(index, 1);
                saveData(data);
                renderIncomeTable();
            }
        }
        if (e.target.classList.contains('edit-expense')) {
            const index = parseInt(e.target.dataset.index);
            const expense = data.expenses[index];
            const row = e.target.closest('tr');

            row.innerHTML = `
                <td><input type="text" value="${expense.name}" class="edit-name"></td>
                <td><input type="text" value="${expense.category}" class="edit-category"></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                    <select class="edit-frequency">
                        <option value="daily" ${expense.frequency === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="weekly" ${expense.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                        <option value="fortnightly" ${expense.frequency === 'fortnightly' ? 'selected' : ''}>Fortnightly</option>
                        <option value="monthly" ${expense.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        <option value="quarterly" ${expense.frequency === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                        <option value="yearly" ${expense.frequency === 'yearly' ? 'selected' : ''}>Yearly</option>
                    </select>
                    <input type="number" value="${expense.amount}" class="edit-amount">
                    <button class="save-edit-expense" data-index="${index}">Save</button>
                    <button class="cancel-edit">Cancel</button>
                </td>
            `;
        }

        if (e.target.classList.contains('save-edit-expense')) {
            const index = parseInt(e.target.dataset.index);
            const row = e.target.closest('tr');
            data.expenses[index].name = row.querySelector('.edit-name').value;
            data.expenses[index].category = row.querySelector('.edit-category').value;
            data.expenses[index].amount = parseFloat(row.querySelector('.edit-amount').value);
            data.expenses[index].frequency = row.querySelector('.edit-frequency').value;
            saveData(data);
            renderExpenseTable();
        }

        if (e.target.classList.contains('cancel-edit')) {
            renderExpenseTable();
        }

        if (e.target.classList.contains('delete-expense')) {
            if (confirm('Are you sure you want to delete this expense entry?')) {
                const index = parseInt(e.target.dataset.index);
                data.expenses.splice(index, 1);
                saveData(data);
                renderExpenseTable();
            }
        }

        if (e.target.classList.contains('edit-account')) {
            const index = parseInt(e.target.dataset.index);
            const type = e.target.dataset.type;
            const account = data.accounts[type][index];
            const row = e.target.closest('tr');

            let inputFields = `
                <td><input type="text" class="edit-name" value="${account.name}"></td>
                <td><input type="text" class="edit-bank" value="${account.bank}"></td>
                <td><input type="number" class="edit-balance" value="${account.balance || account.owing}"></td>
            `;

            if (type === 'credit') {
                inputFields += `
                    <td><input type="number" class="edit-available" value="${account.available}"></td>
                    <td><input type="number" class="edit-limit" value="${account.limit}"></td>
                `;
            }

            if (type !== 'offset') {
                inputFields += `<td><input type="number" class="edit-interest" value="${account.interest}"></td>`;
            }

            row.innerHTML = `
                ${inputFields}
                <td>
                    <button class="save-edit-account" data-type="${type}" data-index="${index}">Save</button>
                    <button class="cancel-edit">Cancel</button>
                </td>
            `;
        }
        if (e.target.classList.contains('save-edit-account')) {
            const index = parseInt(e.target.dataset.index);
            const type = e.target.dataset.type;
            const row = e.target.closest('tr');
            const account = data.accounts[type][index];

            account.name = row.querySelector('.edit-name').value;
            account.bank = row.querySelector('.edit-bank').value;
            if (type == 'mortgage'){
                account.owing = parseFloat(row.querySelector('.edit-balance').value);
            } else if (type !== 'credit') {
                account.balance = parseFloat(row.querySelector('.edit-balance').value);
            }
            if (type === 'credit') {
                account.available = parseFloat(row.querySelector('.edit-available').value);
                account.limit = parseFloat(row.querySelector('.edit-limit').value);
            }
            if (type !== 'offset') {
                account.interest = parseFloat(row.querySelector('.edit-interest').value);
            }
            saveData(data);
            renderAccountTables();
        }

        if (e.target.classList.contains('cancel-edit')) {
            renderAccountTables();
        }

        if (e.target.classList.contains('delete-account')) {
            if (confirm('Are you sure you want to delete this account?')) {
                const index = parseInt(e.target.dataset.index);
                const type = e.target.dataset.type;
                data.accounts[type].splice(index, 1);
                saveData(data);
                renderAccountTables();
            }
        }
    });

    // --- Load/Save JSON ---
    document.querySelector('#file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                data = JSON.parse(event.target.result);
                saveData(data);
                renderIncomeTable();
                renderExpenseTable();
                renderAccountTables();
            };
            reader.readAsText(file);
        }
    });

    document.querySelector('#save-button').addEventListener('click', () => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'budget-data.json';
        a.click();
        URL.revokeObjectURL(url);
    });

// --- Dark Mode Functionality ---
const themeSwitch = document.getElementById('theme-switch');
const currentTheme = localStorage.getItem('theme');

const setTheme = (theme) => {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
    themeSwitch.checked = theme === 'dark';
};

if (currentTheme) {
    setTheme(currentTheme);
}

// Add event listener to the theme switch
themeSwitch.addEventListener('change', function() {
    setTheme(this.checked ? 'dark' : 'light');
});

    // --- Initial Rendering ---
    renderIncomeTable();
    renderExpenseTable();
    renderAccountTables();
});