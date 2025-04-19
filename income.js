let incomeEntries = [];
let editingIndex = -1; // To keep track of the index being edited

function convertFrequency(amount, frequency) {
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

function addIncome() {
    const amountInput = document.getElementById('income-amount');
    const sourceInput = document.getElementById('income-source');
    const frequencySelect = document.getElementById('income-frequency');

    const amount = parseFloat(amountInput.value);
    const source = sourceInput.value.trim();
    const frequency = frequencySelect.value;

    if (isNaN(amount) || source === '') {
        alert('Please enter a valid amount and source.');
        return;
    }

    const convertedValues = convertFrequency(amount, frequency);
    const newIncome = {
        amount: amount,
        source: source,
        frequency: frequency,
        ...convertedValues
    };

    if (editingIndex !== -1) {
        incomeEntries[editingIndex] = newIncome;
        const rowToUpdate = document.querySelector(`#income-table-body tr[data-index="${editingIndex}"]`);
        if (rowToUpdate) {
            renderIncomeRow(newIncome, editingIndex, rowToUpdate);
        }
        editingIndex = -1;
        document.querySelector('.input-form h2').textContent = 'Add Income';
        document.querySelector('.input-form button').textContent = 'Add Income';
        enableAllEditButtons();
    } else {
        incomeEntries.push(newIncome);
        renderIncomeRow(newIncome, incomeEntries.length - 1);
    }

    renderFrequencySummary(); // Call AFTER updating incomeEntries
    renderExpenseAnalysisTable();
    renderAccountsTables();

    // Clear the form
    amountInput.value = '';
    sourceInput.value = '';
    frequencySelect.value = 'daily';
}

function renderIncomeTable() {
    const tableBody = document.getElementById('income-table-body');
    tableBody.innerHTML = '';

    incomeEntries.forEach((income, index) => {
        renderIncomeRow(income, index);
    });
}

function renderIncomeRow(income, index, existingRow = null) {
    let row;
    if (existingRow) {
        row = existingRow;
        row.innerHTML = '';
    } else {
        const tableBody = document.getElementById('income-table-body');
        row = tableBody.insertRow();
        row.setAttribute('data-index', index);
    }

    const amountCell = row.insertCell();
    amountCell.textContent = `$${income.amount.toFixed(2)}`;

    const sourceCell = row.insertCell();
    sourceCell.textContent = income.source;

    const frequencyCell = row.insertCell();
    frequencyCell.textContent = income.frequency.charAt(0).toUpperCase() + income.frequency.slice(1);

    const actionsCell = row.insertCell();
    actionsCell.classList.add('action-buttons');
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.classList.add('edit-button');
    editButton.setAttribute('data-index', index);
    editButton.onclick = () => enableEditRow(index);
    editButton.disabled = editingIndex !== -1 && editingIndex !== index;
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');
    deleteButton.onclick = () => deleteIncome(index);
    actionsCell.appendChild(deleteButton);
}

function deleteIncome(index) {
    if (confirm('Are you sure you want to delete this income entry?')) {
        incomeEntries.splice(index, 1);
        renderIncomeTable();
        renderFrequencySummary(); // Update summary after deletion
        renderExpenseAnalysisTable();
        renderAccountsTables();
    }
}

function enableEditRow(index) {
    const row = document.querySelector(`#income-table-body tr[data-index="${index}"]`);
    if (!row) return;

    disableAllEditButtons(index);

    const currentIncome = incomeEntries[index];

    const amountCell = row.cells[0];
    const sourceCell = row.cells[1];
    const frequencyCell = row.cells[2];

    amountCell.innerHTML = `<input type="number" value="${currentIncome.amount}">`;
    sourceCell.innerHTML = `<input type="text" value="${currentIncome.source}">`;

    const frequencySelect = document.createElement('select');
    const frequencies = ['daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'];
    frequencies.forEach(freq => {
        const option = document.createElement('option');
        option.value = freq;
        option.textContent = freq.charAt(0).toUpperCase() + freq.slice(1);
        option.selected = freq === currentIncome.frequency;
        frequencySelect.appendChild(option);
    });
    frequencyCell.innerHTML = '';
    frequencyCell.appendChild(frequencySelect);

    const actionsCell = row.cells[3];
    actionsCell.innerHTML = '';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.classList.add('save-button');
    saveButton.onclick = () => saveEditedRow(index);
    actionsCell.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.classList.add('cancel-button');
    cancelButton.onclick = () => {
        renderIncomeTable();
        editingIndex = -1;
        enableAllEditButtons();
    };
    actionsCell.appendChild(cancelButton);

    editingIndex = index;
}

function saveEditedRow(index) {
    const row = document.querySelector(`#income-table-body tr[data-index="${index}"]`);
    if (!row) return;

    const amountInput = row.cells[0].querySelector('input[type="number"]');
    const sourceInput = row.cells[1].querySelector('input[type="text"]');
    const frequencySelect = row.cells[2].querySelector('select');

    if (!amountInput || !sourceInput || !frequencySelect) return;

    const amount = parseFloat(amountInput.value);
    const source = sourceInput.value.trim();
    const frequency = frequencySelect.value;

    if (isNaN(amount) || source === '') {
        alert('Please enter a valid amount and source.');
        return;
    }

    const updatedIncome = convertFrequency(amount, frequency);
    updatedIncome.amount = amount;
    updatedIncome.source = source;
    updatedIncome.frequency = frequency;

    incomeEntries[index] = updatedIncome;
    editingIndex = -1;
    renderIncomeRow(updatedIncome, index, row);
    renderFrequencySummary(); // Update summary after saving
    enableAllEditButtons();
    renderExpenseAnalysisTable();
    renderAccountsTables();
}

function disableAllEditButtons(currentIndex) {
    const editButtons = document.querySelectorAll('#income-table-body tr .edit-button');
    editButtons.forEach(button => {
        const index = parseInt(button.getAttribute('data-index'));
        if (index !== currentIndex) {
            button.disabled = true;
        }
    });
}

function enableAllEditButtons() {
    const editButtons = document.querySelectorAll('#income-table-body tr .edit-button');
    editButtons.forEach(button => {
        button.disabled = false;
    });
}

function renderFrequencySummary() {
    const summaryContainer = document.getElementById('frequency-summary-details');
    summaryContainer.innerHTML = ''; // Clear previous summary

    if (incomeEntries.length === 0) {
        summaryContainer.textContent = 'No income entries yet.';
        return;
    }

    const aggregatedIncome = {
        daily: 0,
        weekly: 0,
        fortnightly: 0,
        monthly: 0,
        quarterly: 0,
        yearly: 0,
    };

    incomeEntries.forEach(income => {
        aggregatedIncome.daily += income.daily || 0;
        aggregatedIncome.weekly += income.weekly || 0;
        aggregatedIncome.fortnightly += income.fortnightly || 0;
        aggregatedIncome.monthly += income.monthly || 0;
        aggregatedIncome.quarterly += income.quarterly || 0;
        aggregatedIncome.yearly += income.yearly || 0;
    });

    for (const frequency in aggregatedIncome) {
        const card = document.createElement('div');
        card.classList.add('summary-card');
        card.innerHTML = `
            <h3>${frequency.charAt(0).toUpperCase() + frequency.slice(1)}</h3>
            <p>$${aggregatedIncome[frequency].toFixed(2)}</p>
        `;
        summaryContainer.appendChild(card);
    }
}

// Initial rendering
renderIncomeTable();
renderFrequencySummary();
