let accounts = []; // Array to store account objects
let editingAccountIndex = -1; // To track the index of the account being edited

function showAccountForm() {
    const accountType = document.getElementById('account-type').value;
    document.getElementById('everyday-form').style.display = 'none';
    document.getElementById('credit-form').style.display = 'none';
    document.getElementById('offset-form').style.display = 'none';
    document.getElementById('mortgage-form').style.display = 'none';

    if (accountType === 'everyday') {
        document.getElementById('everyday-form').style.display = 'block';
    } else if (accountType === 'credit') {
        document.getElementById('credit-form').style.display = 'block';
    } else if (accountType === 'offset') {
        document.getElementById('offset-form').style.display = 'block';
    } else if (accountType === 'mortgage') {
        document.getElementById('mortgage-form').style.display = 'block';
    }
}

function addEverydayAccount() {
    const name = document.getElementById('everyday-name').value.trim();
    const bank = document.getElementById('everyday-bank').value.trim();
    const balance = parseFloat(document.getElementById('everyday-balance').value);
    const interestRate = parseFloat(document.getElementById('everyday-interest-rate').value);

    if (name && bank && !isNaN(balance)) {
        const newAccount = {
            type: 'everyday',
            name: name,
            bank: bank,
            balance: balance,
            interestRate: isNaN(interestRate) ? 0 : interestRate,
        };
        addOrUpdateAccount(newAccount);
        clearAccountForms();
    } else {
        alert('Please fill in all required fields for Everyday Account.');
    }
}

function addCreditAccount() {
    const name = document.getElementById('credit-name').value.trim();
    const bank = document.getElementById('credit-bank').value.trim();
    const availableBalance = parseFloat(document.getElementById('credit-available-balance').value);
    const limit = parseFloat(document.getElementById('credit-limit').value);
    const interestRate = parseFloat(document.getElementById('credit-interest-rate').value);

    if (name && bank && !isNaN(availableBalance) && !isNaN(limit)) {
        const newAccount = {
            type: 'credit',
            name: name,
            bank: bank,
            availableBalance: availableBalance,
            limit: limit,
            interestRate: isNaN(interestRate) ? 0 : interestRate,
        };
        addOrUpdateAccount(newAccount);
        clearAccountForms();
    } else {
        alert('Please fill in all required fields for Credit Account.');
    }
}

function addOffsetAccount() {
    const name = document.getElementById('offset-name').value.trim();
    const bank = document.getElementById('offset-bank').value.trim();
    const balance = parseFloat(document.getElementById('offset-balance').value);

    if (name && bank && !isNaN(balance)) {
        const newAccount = {
            type: 'offset',
            name: name,
            bank: bank,
            balance: balance,
        };
        addOrUpdateAccount(newAccount);
        clearAccountForms();
    } else {
        alert('Please fill in all required fields for Offset Account.');
    }
}

function addMortgageAccount() {
    const name = document.getElementById('mortgage-name').value.trim();
    const bank = document.getElementById('mortgage-bank').value.trim();
    const balance = parseFloat(document.getElementById('mortgage-balance').value);
    const interestRate = parseFloat(document.getElementById('mortgage-interest-rate').value);

    if (name && bank && !isNaN(balance)) {
        const newAccount = {
            type: 'mortgage',
            name: name,
            bank: bank,
            balance: balance,
            interestRate: isNaN(interestRate) ? 0 : interestRate,
        };
        addOrUpdateAccount(newAccount);
        clearAccountForms();
    } else {
        alert('Please fill in all required fields for Mortgage Account.');
    }
}

function addOrUpdateAccount(account) {
    if (editingAccountIndex !== -1) {
        accounts[editingAccountIndex] = account;
        editingAccountIndex = -1;
        document.querySelector('#account-input-container h2').textContent = 'Add Account';
        enableAllAccountEditButtons();
    } else {
        accounts.push(account);
    }
    renderAccountsTables(); // Call the new rendering function
}

function renderAccountsTables() {
    const everydayBody = document.getElementById('everyday-accounts-body');
    const creditBody = document.getElementById('credit-accounts-body');
    const offsetBody = document.getElementById('offset-accounts-body');
    const mortgageBody = document.getElementById('mortgage-accounts-body');

    everydayBody.innerHTML = '';
    creditBody.innerHTML = '';
    offsetBody.innerHTML = '';
    mortgageBody.innerHTML = '';

    accounts.forEach((account, index) => {
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('action-buttons');
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-button');
        editButton.setAttribute('data-account-index', index);
        editButton.onclick = () => enableEditAccountRow(index);
        editButton.disabled = editingAccountIndex !== -1 && editingAccountIndex !== index;
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');
        deleteButton.onclick = () => deleteAccount(index);
        actionsCell.appendChild(deleteButton);

        if (account.type === 'everyday') {
            const row = everydayBody.insertRow();
            row.setAttribute('data-account-index', index);
            renderEverydayAccountRow(account, row, actionsCell);
        } else if (account.type === 'credit') {
            const row = creditBody.insertRow();
            row.setAttribute('data-account-index', index);
            renderCreditAccountRow(account, row, actionsCell);
        } else if (account.type === 'offset') {
            const row = offsetBody.insertRow();
            row.setAttribute('data-account-index', index);
            renderOffsetAccountRow(account, row, actionsCell);
        } else if (account.type === 'mortgage') {
            const row = mortgageBody.insertRow();
            row.setAttribute('data-account-index', index);
            renderMortgageAccountRow(account, row, actionsCell);
        }
    });
}

function renderEverydayAccountRow(account, row, actionsCell) {
    row.insertCell().textContent = account.name;
    row.insertCell().textContent = account.bank;
    row.insertCell().textContent = `$${account.balance ? account.balance.toFixed(2) : '-'}`;
    row.insertCell().textContent = account.interestRate ? `${account.interestRate.toFixed(2)}%` : '-';
    row.insertCell().appendChild(actionsCell);
}

function renderCreditAccountRow(account, row, actionsCell) {
    row.insertCell().textContent = account.name;
    row.insertCell().textContent = account.bank;
    row.insertCell().textContent = `$${account.availableBalance ? account.availableBalance.toFixed(2) : '-'}`;
    row.insertCell().textContent = `$${account.limit ? account.limit.toFixed(2) : '-'}`;
    row.insertCell().textContent = account.interestRate ? `${account.interestRate.toFixed(2)}%` : '-';
    row.insertCell().appendChild(actionsCell);
}

function renderOffsetAccountRow(account, row, actionsCell) {
    row.insertCell().textContent = account.name;
    row.insertCell().textContent = account.bank;
    row.insertCell().textContent = `$${account.balance ? account.balance.toFixed(2) : '-'}`;
    row.insertCell().appendChild(actionsCell);
}

function renderMortgageAccountRow(account, row, actionsCell) {
    row.insertCell().textContent = account.name;
    row.insertCell().textContent = account.bank;
    row.insertCell().textContent = `$${account.balance ? account.balance.toFixed(2) : '-'}`;
    row.insertCell().textContent = account.interestRate ? `${account.interestRate.toFixed(2)}%` : '-';
    row.insertCell().appendChild(actionsCell);
}

function enableEditAccountRow(index) {
    const accountToEdit = accounts[index];
    const row = document.querySelector(`[data-account-index="${index}"]`);
    if (!row) return;

    disableAllAccountEditButtons(index);

    if (accountToEdit.type === 'everyday') {
        populateEverydayEditRow(row, accountToEdit);
    } else if (accountToEdit.type === 'credit') {
        populateCreditEditRow(row, accountToEdit);
    } else if (accountToEdit.type === 'offset') {
        populateOffsetEditRow(row, accountToEdit);
    } else if (accountToEdit.type === 'mortgage') {
        populateMortgageEditRow(row, accountToEdit);
    }

    editingAccountIndex = index;
}

function populateEverydayEditRow(row, account) {
    row.cells[0].innerHTML = `<input type="text" value="${account.name}">`;
    row.cells[1].innerHTML = `<input type="text" value="${account.bank}">`;
    row.cells[2].innerHTML = `<input type="number" value="${account.balance}">`;
    row.cells[3].innerHTML = `<input type="number" step="0.01" value="${account.interestRate || ''}">`;
    const actionsCell = row.cells[4];
    actionsCell.innerHTML = '';
    createAccountEditActions(actionsCell, account.type, account);
}

function populateCreditEditRow(row, account) {
    row.cells[0].innerHTML = `<input type="text" value="${account.name}">`;
    row.cells[1].innerHTML = `<input type="text" value="${account.bank}">`;
    row.cells[2].innerHTML = `<input type="number" value="${account.availableBalance}">`;
    row.cells[3].innerHTML = `<input type="number" value="${account.limit}">`;
    row.cells[4].innerHTML = `<input type="number" step="0.01" value="${account.interestRate || ''}">`;
    const actionsCell = row.cells[5];
    actionsCell.innerHTML = '';
    createAccountEditActions(actionsCell, account.type, account);
}

function populateOffsetEditRow(row, account) {
    row.cells[0].innerHTML = `<input type="text" value="${account.name}">`;
    row.cells[1].innerHTML = `<input type="text" value="${account.bank}">`;
    row.cells[2].innerHTML = `<input type="number" value="${account.balance}">`;
    const actionsCell = row.cells[3];
    actionsCell.innerHTML = '';
    createAccountEditActions(actionsCell, account.type, account);
}

function populateMortgageEditRow(row, account) {
    row.cells[0].innerHTML = `<input type="text" value="${account.name}">`;
    row.cells[1].innerHTML = `<input type="text" value="${account.bank}">`;
    row.cells[2].innerHTML = `<input type="number" value="${account.balance}">`;
    row.cells[3].innerHTML = `<input type="number" step="0.01" value="${account.interestRate || ''}">`;
    const actionsCell = row.cells[4];
    actionsCell.innerHTML = '';
    createAccountEditActions(actionsCell, account.type, account);
}

function createAccountEditActions(actionsCell, type, originalAccount) {
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.classList.add('save-button');
    saveButton.onclick = () => saveEditedAccountRow(editingAccountIndex, type);
    actionsCell.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.classList.add('cancel-button');
    cancelButton.onclick = () => {
        renderAccountsTables();
        editingAccountIndex = -1;
        enableAllAccountEditButtons();
    };
    actionsCell.appendChild(cancelButton);
}

function saveEditedAccountRow(index, type) {
    const row = document.querySelector(`[data-account-index="${index}"]`);
    if (!row) return;

    const updatedAccount = { type: type };

    if (type === 'everyday') {
        updatedAccount.name = row.cells[0].querySelector('input[type="text"]').value.trim();
        updatedAccount.bank = row.cells[1].querySelector('input[type="text"]').value.trim();
        updatedAccount.balance = parseFloat(row.cells[2].querySelector('input[type="number"]').value);
        updatedAccount.interestRate = parseFloat(row.cells[3].querySelector('input[type="number"]').value) || 0;
        if (!updatedAccount.name || !updatedAccount.bank || isNaN(updatedAccount.balance)) return;
    } else if (type === 'credit') {
        updatedAccount.name = row.cells[0].querySelector('input[type="text"]').value.trim();
        updatedAccount.bank = row.cells[1].querySelector('input[type="text"]').value.trim();
        updatedAccount.availableBalance = parseFloat(row.cells[2].querySelector('input[type="number"]').value);
        updatedAccount.limit = parseFloat(row.cells[3].querySelector('input[type="number"]').value);
        updatedAccount.interestRate = parseFloat(row.cells[4].querySelector('input[type="number"]').value) || 0;
        if (!updatedAccount.name || !updatedAccount.bank || isNaN(updatedAccount.availableBalance) || isNaN(updatedAccount.limit)) return;
    } else if (type === 'offset') {
        updatedAccount.name = row.cells[0].querySelector('input[type="text"]').value.trim();
        updatedAccount.bank = row.cells[1].querySelector('input[type="text"]').value.trim();
        updatedAccount.balance = parseFloat(row.cells[2].querySelector('input[type="number"]').value);
        if (!updatedAccount.name || !updatedAccount.bank || isNaN(updatedAccount.balance)) return;
    } else if (type === 'mortgage') {
        updatedAccount.name = row.cells[0].querySelector('input[type="text"]').value.trim();
        updatedAccount.bank = row.cells[1].querySelector('input[type="text"]').value.trim();
        updatedAccount.balance = parseFloat(row.cells[2].querySelector('input[type="number"]').value);
        updatedAccount.interestRate = parseFloat(row.cells[3].querySelector('input[type="number"]').value) || 0;
        if (!updatedAccount.name || !updatedAccount.bank || isNaN(updatedAccount.balance)) return;
    }

    accounts[index] = updatedAccount;
    editingAccountIndex = -1;
    renderAccountsTables();
    enableAllAccountEditButtons();
}

function deleteAccount(index) {
    if (confirm('Are you sure you want to delete this account?')) {
        accounts.splice(index, 1);
        renderAccountsTables();
    }
}

function clearAccountForms() {
    document.getElementById('account-type').value = '';
    document.getElementById('everyday-name').value = '';
    document.getElementById('everyday-bank').value = '';
    document.getElementById('everyday-balance').value = '';
    document.getElementById('everyday-interest-rate').value = '';
    document.getElementById('credit-name').value = '';
    document.getElementById('credit-bank').value = '';
    document.getElementById('credit-available-balance').value = '';
    document.getElementById('credit-limit').value = '';
    document.getElementById('credit-interest-rate').value = '';
    document.getElementById('offset-name').value = '';
    document.getElementById('offset-bank').value = '';
    document.getElementById('offset-balance').value = '';
    document.getElementById('mortgage-name').value = '';
    document.getElementById('mortgage-bank').value = '';
    document.getElementById('mortgage-balance').value = '';
    document.getElementById('mortgage-interest-rate').value = '';

    // Hide all forms after clearing
    showAccountForm();
}

function disableAllAccountEditButtons(currentIndex) {
    const editButtons = document.querySelectorAll('#accounts-section .edit-button');
    editButtons.forEach(button => {
        const index = parseInt(button.getAttribute('data-account-index'));
        if (index !== currentIndex) {
            button.disabled = true;
        }
    });
}

function enableAllAccountEditButtons() {
    const editButtons = document.querySelectorAll('#accounts-section .edit-button');
    editButtons.forEach(button => {
        button.disabled = false;
    });
}

// Initial rendering of accounts tables (if any data exists in local storage, for example)
renderAccountsTables();
