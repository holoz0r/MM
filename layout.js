document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function showTab(tabId) {
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        const targetContent = document.getElementById(tabId);
        const targetButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);

        if (targetContent) {
            targetContent.classList.add('active');
        }
        if (targetButton) {
            targetButton.classList.add('active');
        }

        // Refresh data and tables when navigating to certain tabs
        if (tabId === 'view') {
            if (typeof renderAccountsTables === 'function') renderAccountsTables();
            if (typeof renderIncomeTable === 'function') renderIncomeTable();
            if (typeof renderExpenseTable === 'function') renderExpenseTable();
        } else if (tabId === 'insights') {
            if (typeof renderFrequencySummary === 'function') renderFrequencySummary();
            if (typeof renderExpenseSummary === 'function') renderExpenseSummary();
            if (typeof renderNetPositionSummary === 'function') renderNetPositionSummary();
            if (typeof renderExpenseAnalysisTable === 'function') renderExpenseAnalysisTable();
            if (typeof renderCategoryAnalysisTable === 'function') renderCategoryAnalysisTable();
            if (typeof renderHeaderCalculations === 'function') renderHeaderCalculations();
        } else if (tabId === 'countdown') {
            if (typeof renderCountdownData === 'function') renderCountdownData();
        }

        // If loading data, switch to the 'view' tab
        if (tabId === 'view' && localStorage.getItem('justLoadedData')) {
            localStorage.removeItem('justLoadedData'); // Clear the flag
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    // Function to switch to the 'view' tab
    window.switchToViewTab = () => {
        showTab('view');
    };

    // On initial load, show the 'input' tab
    showTab('input');
});
