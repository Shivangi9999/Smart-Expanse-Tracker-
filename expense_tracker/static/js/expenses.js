// Expenses JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize expense filtering and sorting
    initExpenseFilters();
    
    // Initialize expense action buttons
    initExpenseActions();
});

// Initialize expense filtering and sorting
function initExpenseFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    const sortByFilter = document.getElementById('sortByFilter');
    const searchFilter = document.getElementById('searchFilter');
    const expensesTableBody = document.getElementById('expensesTableBody');
    
    if (!categoryFilter || !dateRangeFilter || !sortByFilter || !searchFilter || !expensesTableBody) return;
    
    // Store all expense rows for filtering
    const allExpenseRows = Array.from(expensesTableBody.querySelectorAll('tr:not(.no-expenses-row)'));
    
    // Function to apply all filters
    function applyFilters() {
        const categoryValue = categoryFilter.value;
        const dateRangeValue = dateRangeFilter.value;
        const sortByValue = sortByFilter.value;
        const searchValue = searchFilter.value.toLowerCase();
        
        // Filter expenses
        let filteredRows = allExpenseRows;
        
        // Apply category filter
        if (categoryValue !== 'all') {
            filteredRows = filteredRows.filter(row => {
                return row.getAttribute('data-category') === categoryValue;
            });
        }
        
        // Apply date range filter (in a real application, this would filter by actual dates)
        if (dateRangeValue !== 'all') {
            // For demo, we'll just filter randomly
            if (dateRangeValue === 'week') {
                filteredRows = filteredRows.filter(() => Math.random() > 0.3);
            } else if (dateRangeValue === 'month') {
                filteredRows = filteredRows.filter(() => Math.random() > 0.2);
            } else if (dateRangeValue === 'quarter') {
                filteredRows = filteredRows.filter(() => Math.random() > 0.1);
            }
        }
        
        // Apply search filter
        if (searchValue) {
            filteredRows = filteredRows.filter(row => {
                const text = row.textContent.toLowerCase();
                return text.includes(searchValue);
            });
        }
        
        // Apply sorting
        filteredRows.sort((a, b) => {
            if (sortByValue === 'date-desc') {
                return new Date(b.cells[0].textContent) - new Date(a.cells[0].textContent);
            } else if (sortByValue === 'date-asc') {
                return new Date(a.cells[0].textContent) - new Date(b.cells[0].textContent);
            } else if (sortByValue === 'amount-desc') {
                const amountA = parseFloat(a.cells[3].textContent.replace('$', ''));
                const amountB = parseFloat(b.cells[3].textContent.replace('$', ''));
                return amountB - amountA;
            } else if (sortByValue === 'amount-asc') {
                const amountA = parseFloat(a.cells[3].textContent.replace('$', ''));
                const amountB = parseFloat(b.cells[3].textContent.replace('$', ''));
                return amountA - amountB;
            }
            return 0;
        });
        
        // Clear table
        expensesTableBody.innerHTML = '';
        
        // Check if no expenses after filtering
        if (filteredRows.length === 0) {
            const noExpensesRow = document.createElement('tr');
            noExpensesRow.className = 'no-expenses-row';
            noExpensesRow.innerHTML = `
                <td colspan="5">
                    <div class="no-expenses-message">
                        <i class="fas fa-filter no-expenses-icon"></i>
                        <p>No expenses match your filters. Try adjusting your search criteria.</p>
                        <button class="btn btn-secondary" id="resetFiltersBtn">Reset Filters</button>
                    </div>
                </td>
            `;
            expensesTableBody.appendChild(noExpensesRow);
            
            // Add event listener to reset filters button
            document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
        } else {
            // Add filtered rows back to table
            filteredRows.forEach(row => {
                expensesTableBody.appendChild(row);
            });
        }
        
        // Update summary
        updateExpenseSummary(filteredRows);
    }
    
    // Function to reset all filters
    function resetFilters() {
        categoryFilter.value = 'all';
        dateRangeFilter.value = 'month';
        sortByFilter.value = 'date-desc';
        searchFilter.value = '';
        
        applyFilters();
    }
    
    // Add event listeners to filters
    categoryFilter.addEventListener('change', applyFilters);
    dateRangeFilter.addEventListener('change', applyFilters);
    sortByFilter.addEventListener('change', applyFilters);
    
    // Add debounced event listener for search input
    let searchTimeout;
    searchFilter.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });
}

// Initialize expense action buttons
function initExpenseActions() {
    const expensesTableBody = document.getElementById('expensesTableBody');
    const viewExpenseModal = document.getElementById('viewExpenseModal');
    
    if (!expensesTableBody || !viewExpenseModal) return;
    
    // Add event delegation for expense actions
    expensesTableBody.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        const row = target.closest('tr');
        const expenseId = row ? row.getAttribute('data-expense-id') : null;
        
        if (!expenseId) return;
        
        // Handle view button click
        if (target.classList.contains('view-btn') || target.closest('.view-btn')) {
            openExpenseDetails(row);
        }
        
        // Handle edit button click (in a real app, this would navigate to edit page)
        if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
            console.log('Edit expense:', expenseId);
            // Redirect to edit page
            // window.location.href = `/edit_expense/${expenseId}`;
            alert('Edit functionality would be implemented in a full application');
        }
        
        // Handle delete button click
        if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            showConfirmDialog('Are you sure you want to delete this expense?', function() {
                console.log('Delete expense:', expenseId);
                
                // Send delete request to the server
                fetch(`/delete_expense/${expenseId}`, {
                    method: 'POST',
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Remove the row from the DOM
                        row.remove();
                        
                        // Update summary
                        const allExpenseRows = Array.from(expensesTableBody.querySelectorAll('tr:not(.no-expenses-row)'));
                        updateExpenseSummary(allExpenseRows);
                        
                        // Show success message
                        const flashContainer = document.querySelector('.flash-messages');
                        const flashMessage = document.createElement('div');
                        flashMessage.className = 'flash-message';
                        flashMessage.textContent = 'Expense deleted successfully!';
                        
                        if (flashContainer) {
                            flashContainer.appendChild(flashMessage);
                            
                            // Auto-dismiss after 3 seconds
                            setTimeout(() => {
                                flashMessage.style.opacity = 0;
                                setTimeout(() => {
                                    flashMessage.remove();
                                }, 500);
                            }, 3000);
                        }
                    } else {
                        alert('Failed to delete expense: ' + (data.message || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while deleting the expense');
                });
            });
        }
    });
}

// Open expense details modal
function openExpenseDetails(row) {
    const viewExpenseModal = document.getElementById('viewExpenseModal');
    if (!viewExpenseModal) return;
    
    // Get expense details from the row
    const date = row.cells[0].textContent;
    const category = row.cells[1].querySelector('.category-badge').textContent.trim();
    const description = row.cells[2].textContent;
    const amount = row.cells[3].textContent;
    
    // Set details in the modal
    document.getElementById('detailDate').textContent = date;
    document.getElementById('detailCategory').textContent = category;
    document.getElementById('detailDescription').textContent = description;
    document.getElementById('detailAmount').textContent = amount;
    
    // Show the modal
    viewExpenseModal.classList.add('show');
}

// Update expense summary
function updateExpenseSummary(expenseRows) {
    const totalAmountElement = document.getElementById('totalAmount');
    const expenseCountElement = document.getElementById('expenseCount');
    const averageAmountElement = document.getElementById('averageAmount');
    
    if (!totalAmountElement || !expenseCountElement || !averageAmountElement) return;
    
    // Calculate total and average
    const count = expenseRows.length;
    let total = 0;
    
    expenseRows.forEach(row => {
        const amountText = row.cells[3].textContent;
        const amount = parseFloat(amountText.replace('$', '').replace(',', ''));
        total += amount;
    });
    
    const average = count > 0 ? total / count : 0;
    
    // Update summary elements
    totalAmountElement.textContent = formatCurrency(total);
    expenseCountElement.textContent = count;
    averageAmountElement.textContent = formatCurrency(average);
}