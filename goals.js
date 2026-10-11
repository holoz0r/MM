// =============================================================================
// GOALS
//
// A goal is an AMOUNT ON TOP of whatever comes before it in priority order
// (array order = priority; index 0 is highest). Each goal's own "cumulative
// target" = current net position + the sum of every goal ahead of it. You
// never enter an absolute net-position number yourself — just the amount
// for this goal — and the running total is computed for you.
//
// Two amount types:
//   - "fixed":        a flat dollar figure you type in (e.g. "$4,000 for new phones")
//   - "bufferMonths": N months of your BUDGETED monthly expenses (e.g. "6 month
//                     buffer"). This stays live — it's recalculated from your
//                     current budget on every render, so it tracks your budget
//                     as it changes rather than freezing at today's number.
//
// Because amounts stack and net position grows continuously, each goal's own
// projected date is simply "when does net position first reach this goal's
// cumulative target", given the current monthly surplus — no separate queue
// timer is needed; the stacking of cumulative targets does that automatically.
//
// Achieved-goal handling differs slightly by type:
//   - "fixed" goals freeze an achievedDate the first time they're met — a
//     historical record, same as a paid-off milestone.
//   - "bufferMonths" goals are NOT frozen, since their target itself moves.
//     Their achieved/not-achieved state is re-evaluated live on every render.
//
// Goals are persisted as a top-level "goals" array in budget_data.json. Older
// files without this key simply result in an empty goals list; an older
// version of this app opening a newer file just ignores the extra key.
// Goals saved under the previous (pre-stacking) absolute-target model are
// migrated defensively on load: a bare "targetAmount" with no "amountType"
// is treated as a fixed amount, so old files don't crash the app, though the
// number will now mean "stack this much on top of the queue" rather than
// "reach this exact net position".
// =============================================================================

let goals = [];
let editingGoalId = null;

const AVG_DAYS_PER_MONTH = 30.44;

function escapeGoalsHTML(str) {
    if (str === null || str === undefined) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function addMonthsToDate(date, months) {
    return new Date(date.getTime() + months * AVG_DAYS_PER_MONTH * 24 * 60 * 60 * 1000);
}

function monthsBetweenDates(dateA, dateB) {
    return (dateB.getTime() - dateA.getTime()) / (AVG_DAYS_PER_MONTH * 24 * 60 * 60 * 1000);
}

/** Defensive migration for goals saved under the earlier absolute-target model. */
function normalizeGoal(goal) {
    if (!goal.amountType) {
        goal.amountType = 'fixed';
        if (goal.fixedAmount === undefined) {
            goal.fixedAmount = goal.targetAmount || 0;
        }
    }
    return goal;
}

/**
 * Correctly converts every income/expense entry to a monthly figure and sums
 * them. Deliberately NOT reusing analyse.js's calculateIncomeMinusExpenses(),
 * which has a pre-existing bug (it multiplies an already-converted monthly
 * amount by the raw entry amount again). This instead reuses the same
 * per-entry conversion helper (getAmountForFrequency) that the Net Position
 * Summary cards already rely on.
 */
function computeMonthlySurplus() {
    return computeMonthlyIncomeTotal() - computeMonthlyBudgetedExpenses();
}

function computeMonthlyIncomeTotal() {
    if (typeof getAmountForFrequency !== 'function') return 0;
    let total = 0;
    (typeof incomeEntries !== 'undefined' ? incomeEntries : []).forEach(income => {
        total += getAmountForFrequency(income.amount, income.frequency, 'monthly');
    });
    return total;
}

function computeMonthlyBudgetedExpenses() {
    if (typeof getAmountForFrequency !== 'function') return 0;
    let total = 0;
    (typeof expenseEntries !== 'undefined' ? expenseEntries : []).forEach(expense => {
        total += getAmountForFrequency(expense.amount, expense.frequency, 'monthly');
    });
    return total;
}

/** Resolves a goal's dollar amount right now, given its type. Buffer-type
 *  amounts are always recalculated live from the current budget. */
function resolveGoalAmount(goal, monthlyBudgetedExpenses) {
    if (goal.amountType === 'bufferMonths') {
        const months = parseFloat(goal.bufferMonths) || 0;
        return months * monthlyBudgetedExpenses;
    }
    return parseFloat(goal.fixedAmount) || 0;
}

/**
 * Walks goals in priority order, stacking each one's amount on top of a
 * running cumulative target (starting at the current net position). Returns
 * an array of projection results aligned by index with the goals array.
 */
function computeGoalProjections(goalsArr, currentNetPosition, monthlySurplus, monthlyBudgetedExpenses) {
    const today = new Date();
    // Cumulative target is an ABSOLUTE net-position threshold — the running sum
    // of goal amounts alone. It is deliberately NOT offset by currentNetPosition:
    // doing so previously made the "gap" for any goal always equal exactly its
    // own amount, regardless of how much net worth you already had, so a goal
    // could never be recognised as already met by existing wealth — only by
    // future growth. Comparing currentNetPosition against this absolute sum is
    // what lets an already-funded buffer show as achieved immediately.
    let cumulativeTarget = 0;
    const results = [];

    goalsArr.forEach(goal => {
        normalizeGoal(goal);
        const amount = resolveGoalAmount(goal, monthlyBudgetedExpenses);
        const sliceStart = cumulativeTarget;
        cumulativeTarget += amount;

        const progressPct = amount > 0
            ? Math.max(0, Math.min(100, ((currentNetPosition - sliceStart) / amount) * 100))
            : 100;

        const isMetRightNow = currentNetPosition >= cumulativeTarget;
        const isFrozenType = goal.amountType !== 'bufferMonths';

        if (isFrozenType && goal.achievedDate) {
            results.push({
                status: 'achieved', projectedDate: new Date(goal.achievedDate),
                amount, cumulativeTarget, progressPct: 100, requiredMonthlySurplus: null
            });
            return;
        }

        if (isMetRightNow) {
            if (isFrozenType) goal.achievedDate = today.toISOString().split('T')[0];
            results.push({
                status: 'achieved', projectedDate: today,
                amount, cumulativeTarget, progressPct: 100, requiredMonthlySurplus: null
            });
            return;
        }

        // Not met — a buffer-type goal should never carry a stale achievedDate.
        if (!isFrozenType) goal.achievedDate = null;

        if (monthlySurplus <= 0) {
            results.push({
                status: 'no-surplus', projectedDate: null,
                amount, cumulativeTarget, progressPct, requiredMonthlySurplus: null
            });
            return;
        }

        const monthsNeeded = (cumulativeTarget - currentNetPosition) / monthlySurplus;
        const projectedDate = addMonthsToDate(today, monthsNeeded);

        let status = 'projected';
        let requiredMonthlySurplus = null;

        if (goal.targetDate) {
            const deadline = new Date(goal.targetDate);
            const monthsAvailable = monthsBetweenDates(today, deadline);
            if (monthsAvailable <= 0) {
                status = 'overdue';
            } else {
                requiredMonthlySurplus = (cumulativeTarget - currentNetPosition) / monthsAvailable;
                status = projectedDate <= deadline ? 'on-track' : 'behind-pace';
            }
        }

        results.push({ status, projectedDate, amount, cumulativeTarget, progressPct, requiredMonthlySurplus });
    });

    return results;
}

// --- Add Goal form ---

function showGoalAmountFields() {
    const type = document.getElementById('goal-amount-type').value;
    document.getElementById('goal-fixed-fields').style.display = type === 'fixed' ? 'block' : 'none';
    document.getElementById('goal-buffer-fields').style.display = type === 'bufferMonths' ? 'block' : 'none';
    if (type === 'bufferMonths') updateGoalBufferPreview();
}

function updateGoalBufferPreview() {
    const months = parseFloat(document.getElementById('goal-buffer-months').value) || 0;
    const preview = months * computeMonthlyBudgetedExpenses();
    document.getElementById('goal-buffer-preview').textContent = `$${preview.toFixed(2)}`;
}

function addGoal() {
    const nameInput = document.getElementById('goal-name');
    const amountType = document.getElementById('goal-amount-type').value;
    const dateInput = document.getElementById('goal-target-date');

    const name = nameInput.value.trim();
    if (!name) {
        alert('Please give this goal a name.');
        return;
    }

    const newGoal = {
        id: Date.now() + Math.random(),
        name: name,
        amountType: amountType,
        targetDate: dateInput.value || null,
        achievedDate: null
    };

    if (amountType === 'bufferMonths') {
        const months = parseFloat(document.getElementById('goal-buffer-months').value);
        if (isNaN(months) || months <= 0) {
            alert('Please enter a positive number of months.');
            return;
        }
        newGoal.bufferMonths = months;
    } else {
        const amount = parseFloat(document.getElementById('goal-fixed-amount').value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a positive dollar amount.');
            return;
        }
        newGoal.fixedAmount = amount;
    }

    goals.push(newGoal);

    nameInput.value = '';
    document.getElementById('goal-fixed-amount').value = '';
    document.getElementById('goal-buffer-months').value = '';
    dateInput.value = '';
    document.getElementById('goal-amount-type').value = 'fixed';
    showGoalAmountFields();

    renderGoalsTable();
}

function deleteGoal(id) {
    if (confirm('Delete this goal?')) {
        goals = goals.filter(g => g.id != id);
        if (editingGoalId == id) editingGoalId = null;
        renderGoalsTable();
    }
}

function moveGoalUp(id) {
    const idx = goals.findIndex(g => g.id == id);
    if (idx > 0) {
        [goals[idx - 1], goals[idx]] = [goals[idx], goals[idx - 1]];
        renderGoalsTable();
    }
}

function moveGoalDown(id) {
    const idx = goals.findIndex(g => g.id == id);
    if (idx !== -1 && idx < goals.length - 1) {
        [goals[idx + 1], goals[idx]] = [goals[idx], goals[idx + 1]];
        renderGoalsTable();
    }
}

function toggleEditGoalAmountFields(id) {
    const type = document.getElementById(`edit-goal-type-${id}`).value;
    document.getElementById(`edit-goal-fixed-wrap-${id}`).style.display = type === 'fixed' ? 'block' : 'none';
    document.getElementById(`edit-goal-buffer-wrap-${id}`).style.display = type === 'bufferMonths' ? 'block' : 'none';
}

function saveEditedGoalRow(id) {
    const goal = goals.find(g => g.id == id);
    if (!goal) return;

    const name = document.getElementById(`edit-goal-name-${id}`).value.trim();
    const amountType = document.getElementById(`edit-goal-type-${id}`).value;
    const dateVal = document.getElementById(`edit-goal-date-${id}`).value;

    if (!name) {
        alert('Please give this goal a name.');
        return;
    }

    goal.name = name;
    goal.amountType = amountType;
    goal.targetDate = dateVal || null;
    goal.achievedDate = null; // re-open: let the next render re-evaluate against the new amount/type

    if (amountType === 'bufferMonths') {
        const months = parseFloat(document.getElementById(`edit-goal-buffer-${id}`).value);
        if (isNaN(months) || months <= 0) {
            alert('Please enter a positive number of months.');
            return;
        }
        goal.bufferMonths = months;
    } else {
        const amount = parseFloat(document.getElementById(`edit-goal-fixed-${id}`).value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a positive dollar amount.');
            return;
        }
        goal.fixedAmount = amount;
    }

    editingGoalId = null;
    renderGoalsTable();
}

function formatGoalAmountCell(goal, proj) {
    if (goal.amountType === 'bufferMonths') {
        return `${goal.bufferMonths} mo buffer <span class="goal-amount-live">(~$${proj.amount.toFixed(2)} now)</span>`;
    }
    return `$${parseFloat(goal.fixedAmount).toFixed(2)}`;
}

function renderGoalDisplayRow(row, goal, index, proj, totalGoals) {
    const priorityCell = row.insertCell();
    priorityCell.innerHTML = `
        <div class="priority-controls">
            <button type="button" class="priority-btn" onclick="moveGoalUp('${goal.id}')" ${index === 0 ? 'disabled' : ''} title="Raise priority">&#9650;</button>
            <span>${index + 1}</span>
            <button type="button" class="priority-btn" onclick="moveGoalDown('${goal.id}')" ${index === totalGoals - 1 ? 'disabled' : ''} title="Lower priority">&#9660;</button>
        </div>`;

    row.insertCell().textContent = goal.name;
    row.insertCell().innerHTML = formatGoalAmountCell(goal, proj);
    row.insertCell().textContent = `$${proj.cumulativeTarget.toFixed(2)}`;
    row.insertCell().textContent = goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—';

    const progressCell = row.insertCell();
    progressCell.innerHTML = `
        <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${proj.progressPct.toFixed(1)}%;"></div>
        </div>
        <span class="progress-label">${proj.progressPct.toFixed(0)}%</span>`;

    const projectedCell = row.insertCell();
    const statusCell = row.insertCell();

    switch (proj.status) {
        case 'achieved':
            projectedCell.textContent = goal.amountType === 'bufferMonths'
                ? 'Covered right now'
                : new Date(goal.achievedDate).toLocaleDateString();
            statusCell.innerHTML = '<span class="positive">&#9989; Achieved</span>';
            break;
        case 'no-surplus':
            projectedCell.textContent = '—';
            statusCell.innerHTML = '<span class="negative">&#9888; No surplus to allocate</span>';
            break;
        case 'overdue':
            projectedCell.textContent = '—';
            statusCell.innerHTML = '<span class="negative">&#9888; Target date already passed</span>';
            break;
        case 'behind-pace':
            projectedCell.textContent = proj.projectedDate.toLocaleDateString();
            statusCell.innerHTML = `<span class="negative">&#9888; Behind pace &mdash; need $${proj.requiredMonthlySurplus.toFixed(2)}/mo from here</span>`;
            break;
        case 'on-track':
            projectedCell.textContent = proj.projectedDate.toLocaleDateString();
            statusCell.innerHTML = '<span class="positive">&#9989; On track</span>';
            break;
        default: // 'projected' — no target date set
            projectedCell.textContent = proj.projectedDate.toLocaleDateString();
            statusCell.innerHTML = '<span>Projected</span>';
    }

    const actionsCell = row.insertCell();
    actionsCell.classList.add('action-buttons');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-button');
    editBtn.disabled = editingGoalId !== null;
    editBtn.onclick = () => { editingGoalId = goal.id; renderGoalsTable(); };
    actionsCell.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-button');
    deleteBtn.onclick = () => deleteGoal(goal.id);
    actionsCell.appendChild(deleteBtn);
}

function renderGoalEditRow(row, goal, index) {
    const id = goal.id;
    row.insertCell().textContent = index + 1; // reordering is disabled mid-edit to keep this simple

    row.insertCell().innerHTML = `<input type="text" id="edit-goal-name-${id}" value="${escapeGoalsHTML(goal.name)}">`;

    const amountCell = row.insertCell();
    const fixedDisplay = goal.amountType === 'fixed' ? 'block' : 'none';
    const bufferDisplay = goal.amountType === 'bufferMonths' ? 'block' : 'none';
    amountCell.innerHTML = `
        <select id="edit-goal-type-${id}" onchange="toggleEditGoalAmountFields('${id}')">
            <option value="fixed" ${goal.amountType === 'fixed' ? 'selected' : ''}>Fixed $</option>
            <option value="bufferMonths" ${goal.amountType === 'bufferMonths' ? 'selected' : ''}>Months buffer</option>
        </select>
        <div id="edit-goal-fixed-wrap-${id}" style="display:${fixedDisplay}; margin-top:4px;">
            <input type="number" step="0.01" id="edit-goal-fixed-${id}" value="${goal.fixedAmount || ''}" placeholder="Amount $">
        </div>
        <div id="edit-goal-buffer-wrap-${id}" style="display:${bufferDisplay}; margin-top:4px;">
            <input type="number" step="0.1" id="edit-goal-buffer-${id}" value="${goal.bufferMonths || ''}" placeholder="Months">
        </div>`;

    row.insertCell().textContent = '—'; // cumulative target recalculated after save
    row.insertCell().innerHTML = `<input type="date" id="edit-goal-date-${id}" value="${goal.targetDate || ''}">`;
    row.insertCell().textContent = '—';
    row.insertCell().textContent = '—';
    row.insertCell().textContent = '—';

    const actionsCell = row.insertCell();
    actionsCell.classList.add('action-buttons');

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.classList.add('save-button');
    saveBtn.onclick = () => saveEditedGoalRow(id);
    actionsCell.appendChild(saveBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.classList.add('cancel-button');
    cancelBtn.onclick = () => { editingGoalId = null; renderGoalsTable(); };
    actionsCell.appendChild(cancelBtn);
}

function renderGoalsTable() {
    const tbody = document.getElementById('goals-table-body');
    if (!tbody) return;

    const currentNetPosition = (typeof calculateOverallPosition === 'function') ? calculateOverallPosition() : 0;
    const monthlyBudgetedExpenses = computeMonthlyBudgetedExpenses();
    const monthlySurplus = computeMonthlyIncomeTotal() - monthlyBudgetedExpenses;

    const netPosEl = document.getElementById('goals-current-net-position');
    const surplusEl = document.getElementById('goals-monthly-surplus');
    if (netPosEl) netPosEl.textContent = `$${currentNetPosition.toFixed(2)}`;
    if (surplusEl) {
        surplusEl.textContent = `$${monthlySurplus.toFixed(2)}`;
        surplusEl.className = monthlySurplus >= 0 ? 'positive' : 'negative';
    }

    tbody.innerHTML = '';

    if (goals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No goals yet — add one above.</td></tr>';
        return;
    }

    const projections = computeGoalProjections(goals, currentNetPosition, monthlySurplus, monthlyBudgetedExpenses);

    goals.forEach((goal, index) => {
        const row = tbody.insertRow();
        row.setAttribute('data-goal-id', goal.id);

        if (editingGoalId === goal.id) {
            renderGoalEditRow(row, goal, index);
        } else {
            renderGoalDisplayRow(row, goal, index, projections[index], goals.length);
        }
    });
}

// Initial render (mirrors accounts.js / income.js / expenses.js pattern)
renderGoalsTable();
