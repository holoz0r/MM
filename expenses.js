let expenseEntries = [];
let editingExpenseIndex = -1; // To keep track of the index being edited

function convertExpenseFrequency(amount, frequency) {
    switch (frequency) {
        case 'daily':
            return {
                daily: amount,
                weekly: amount * 7,
                fortnightly: amount * 14,
                monthly: amount * (365.25 / 12),
                quarterly: amount * (365.25 / 4),
                yearly: amount * 365.25
            };
        case 'weekly':
            return {
                daily: amount / 7,
                weekly: amount,
                fortnightly: amount * 2,
                monthly: amount * (52 / 12),
                quarterly: amount * (52 / 4),
                yearly: amount * 52
            };
        case 'fortnightly':
            return {
                daily: amount / 14,
                weekly: amount / 2,
                fortnightly: amount,
                monthly: amount * (52 / 24),
                quarterly: amount * (52 / 8),
                yearly: amount * 26
            };
        case 'monthly':
            return {
                daily: amount / (365.25 / 12),
                weekly: amount / (52 / 12),
                fortnightly: amount / (52 / 24),
                monthly: amount,
                quarterly: amount * 3,
                yearly: amount * 12
            };
        case 'quarterly':
            return {
                daily: amount / (365.25 / 4),
                weekly: amount / (52 / 4),
                fortnightly: amount / (52 / 8),
                monthly: amount / 3,
                quarterly: amount,
                yearly: amount * 4
            };
        case 'yearly':
            return {
                daily: amount / 365.25,
                weekly: amount / 52,
                fortnightly: amount / 26,
                monthly: amount / 12,
                quarterly: amount / 4,
                yearly: amount
            };
        default:
            return {};
    }
}

function addExpense() {
    const amountInput = document.getElementById('expense-amount');
    const sourceInput = document.getElementById('expense-source');
    const frequencySelect = document.getElementById('expense-frequency');
    const categoryInput = document.getElementById('expense-category'); // New category input

    const amount = parseFloat(amountInput.value);
    const source = sourceInput.value.trim();
    const frequency = frequencySelect.value;
    const category = categoryInput.value.trim(); // Get category

    if (isNaN(amount) || source === '' || category === '') {
        alert('Please enter a valid amount, source, and category for the expense.');
        return;
    }

    const convertedValues = convertExpenseFrequency(amount, frequency);
    const newExpense = {
        amount: amount,
        source: source,
        category: category, // Include category
        frequency: frequency,
        ...convertedValues
    };

    if (editingExpenseIndex !== -1) {
        expenseEntries[editingExpenseIndex] = newExpense;
        const rowToUpdate = document.querySelector(`#expense-table-body tr[data-expense-index="${editingExpenseIndex}"]`);
        if (rowToUpdate) {
            renderExpenseRow(newExpense, editingExpenseIndex, rowToUpdate);
        }
        editingExpenseIndex = -1;
        document.querySelector('.expense-form h2').textContent = 'Add Expense';
        document.querySelector('.expense-form button').textContent = 'Add Expense';
        enableAllExpenseEditButtons();
    } else {
        expenseEntries.push(newExpense);
        renderExpenseRow(newExpense, expenseEntries.length - 1);
    }

    renderExpenseSummary(); // Call AFTER updating expenseEntries
    renderExpenseAnalysisTable();

    // Clear the form
    amountInput.value = '';
    sourceInput.value = '';
    frequencySelect.value = 'daily';
    categoryInput.value = ''; // Clear category input
}

function renderExpenseTable() {
    const tableBody = document.getElementById('expense-table-body');
    tableBody.innerHTML = '';

    expenseEntries.forEach((expense, index) => {
        renderExpenseRow(expense, index);
    });
}

function renderExpenseRow(expense, index, existingRow = null) {
    let row;
    if (existingRow) {
        row = existingRow;
        row.innerHTML = '';
    } else {
        const tableBody = document.getElementById('expense-table-body');
        row = tableBody.insertRow();
        row.setAttribute('data-expense-index', index);
    }

    // Reordered columns: Source (Description) then Amount
    const sourceCell = row.insertCell();
    sourceCell.textContent = expense.source;

    const amountCell = row.insertCell();
    amountCell.textContent = `$${expense.amount.toFixed(2)}`;

    const categoryCell = row.insertCell(); // New category cell
    categoryCell.textContent = expense.category;

    const frequencyCell = row.insertCell();
    frequencyCell.textContent = expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1);

    const actionsCell = row.insertCell();
    actionsCell.classList.add('action-buttons');
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.classList.add('edit-button');
    editButton.setAttribute('data-expense-index', index);
    editButton.onclick = () => enableEditExpenseRow(index);
    editButton.disabled = editingExpenseIndex !== -1 && editingExpenseIndex !== index;
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');
    deleteButton.onclick = () => deleteExpense(index);
    actionsCell.appendChild(deleteButton);
}

function deleteExpense(index) {
    if (confirm('Are you sure you want to delete this expense entry?')) {
        expenseEntries.splice(index, 1);
        renderExpenseTable();
        renderExpenseSummary(); 
        renderExpenseAnalysisTable();
    }
}

function enableEditExpenseRow(index) {
    const row = document.querySelector(`#expense-table-body tr[data-expense-index="${index}"]`);
    if (!row) return;

    disableAllExpenseEditButtons(index);

    const currentExpense = expenseEntries[index];

    // Corresponding to the new column order
    const sourceCell = row.cells[0];
    const amountCell = row.cells[1];
    const categoryCell = row.cells[2];
    const frequencyCell = row.cells[3];

    sourceCell.innerHTML = `<input type="text" value="${currentExpense.source}">`;
    amountCell.innerHTML = `<input type="number" value="${currentExpense.amount}">`;
    categoryCell.innerHTML = `<input type="text" value="${currentExpense.category}">`; // Edit category

    const frequencySelect = document.createElement('select');
    const frequencies = ['daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'];
    frequencies.forEach(freq => {
        const option = document.createElement('option');
        option.value = freq;
        option.textContent = freq.charAt(0).toUpperCase() + freq.slice(1);
        option.selected = freq === currentExpense.frequency;
        frequencySelect.appendChild(option);
    });
    frequencyCell.innerHTML = '';
    frequencyCell.appendChild(frequencySelect);

    const actionsCell = row.cells[4];
    actionsCell.innerHTML = '';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.classList.add('save-button');
    saveButton.onclick = () => saveEditedExpenseRow(index);
    actionsCell.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.classList.add('cancel-button');
    cancelButton.onclick = () => {
        renderExpenseTable();
        editingExpenseIndex = -1;
        enableAllExpenseEditButtons();
    };
    actionsCell.appendChild(cancelButton);

    editingExpenseIndex = index;
}

function saveEditedExpenseRow(index) {
    const row = document.querySelector(`#expense-table-body tr[data-expense-index="${index}"]`);
    if (!row) return;

    // Corresponding to the new column order
    const sourceInput = row.cells[0].querySelector('input[type="text"]');
    const amountInput = row.cells[1].querySelector('input[type="number"]');
    const categoryInput = row.cells[2].querySelector('input[type="text"]'); // Get edited category
    const frequencySelect = row.cells[3].querySelector('select');

    if (!amountInput || !sourceInput || !frequencySelect || !categoryInput) return;

    const amount = parseFloat(amountInput.value);
    const source = sourceInput.value.trim();
    const frequency = frequencySelect.value;
    const category = categoryInput.value.trim(); // Get edited category value

    if (isNaN(amount) || source === '' || category === '') {
        alert('Please enter a valid amount, source, and category for the expense.');
        return;
    }

    const updatedExpense = convertExpenseFrequency(amount, frequency);
    updatedExpense.amount = amount;
    updatedExpense.source = source;
    updatedExpense.category = category; // Update category
    updatedExpense.frequency = frequency;

    expenseEntries[index] = updatedExpense;
    editingExpenseIndex = -1;
    renderExpenseRow(updatedExpense, index, row);
    renderExpenseSummary(); // Update summary after saving
    enableAllExpenseEditButtons();
    renderExpenseAnalysisTable(); 
}

function disableAllExpenseEditButtons(currentIndex) {
    const editButtons = document.querySelectorAll('#expense-table-body tr .edit-button');
    editButtons.forEach(button => {
        const index = parseInt(button.getAttribute('data-expense-index'));
        if (index !== currentIndex) {
            button.disabled = true;
        }
    });
}

function enableAllExpenseEditButtons() {
    const editButtons = document.querySelectorAll('#expense-table-body tr .edit-button');
    editButtons.forEach(button => {
        button.disabled = false;
    });
}

function renderExpenseSummary() {
    const summaryContainer = document.getElementById('expense-summary-details');
    summaryContainer.innerHTML = ''; // Clear previous summary

    if (expenseEntries.length === 0) {
        summaryContainer.textContent = 'No expense entries yet.';
        return;
    }

    const aggregatedExpenses = {
        daily: 0,
        weekly: 0,
        fortnightly: 0,
        monthly: 0,
        quarterly: 0,
        yearly: 0,
    };

    expenseEntries.forEach(expense => {
        aggregatedExpenses.daily += expense.daily || 0;
        aggregatedExpenses.weekly += expense.weekly || 0;
        aggregatedExpenses.fortnightly += expense.fortnightly || 0;
        aggregatedExpenses.monthly += expense.monthly || 0;
        aggregatedExpenses.quarterly += expense.quarterly || 0;
        aggregatedExpenses.yearly += expense.yearly || 0;
    });

    for (const frequency in aggregatedExpenses) {
        const card = document.createElement('div');
        card.classList.add('summary-card');
        card.innerHTML = `
            <h3>${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Expenses</h3>
            <p>$${aggregatedExpenses[frequency].toFixed(2)}</p>
        `;
        summaryContainer.appendChild(card);
    }
}

// Initial rendering
renderExpenseTable();
renderExpenseSummary();
