// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard JS loaded');
    
    // Fetch expense analysis data
    fetchExpenseAnalysis('month');
    
    // Fetch recent expenses
    fetchRecentExpenses();
    
    // Income update functionality
    initIncomeUpdate();
    
    // Time period filter for expense analysis
    initTimeFilter();
    
    // Initialize savings goals functionality
    initSavingsGoals();
});

// Fetch and display expense analysis
function fetchExpenseAnalysis(period = 'month') {
    console.log('Fetching expense analysis for period:', period);
    const analysisContainer = document.getElementById('expense-analysis');
    
    if (!analysisContainer) return;
    
    // Show loading indicator
    analysisContainer.innerHTML = `
        <div class="expense-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading expense data...</p>
        </div>
    `;
    
    // Fetch expense data from the server
    fetch(`/get_expense_data?period=${period}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error fetching expense data:', data.message);
                displayNoDataMessage(analysisContainer);
                return;
            }
            
            // Check if there's data to display
            if (!data.data.categories || data.data.categories.length === 0) {
                console.log('No expense data available');
                displayNoDataMessage(analysisContainer);
                return;
            }
            
            // Calculate total
            const total = data.data.amounts.reduce((sum, amount) => sum + amount, 0);
            
            // Prepare analysis HTML
            let analysisHTML = '<div class="category-cards">';
            
            // Create cards for each category
            for (let i = 0; i < data.data.categories.length; i++) {
                const category = data.data.categories[i];
                const amount = data.data.amounts[i];
                const percentage = ((amount / total) * 100).toFixed(1);
                const color = getCategoryColor(category);
                
                analysisHTML += `
                    <div class="category-card" style="border-top: 3px solid ${color}">
                        <div class="category-icon" style="background-color: ${color}20; color: ${color}">
                            <i class="${getCategoryIcon(category)}"></i>
                        </div>
                        <div class="category-info">
                            <h4>${category}</h4>
                            <div class="category-details">
                                <span class="category-amount">${formatCurrency(amount)}</span>
                                <span class="category-percentage">${percentage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${percentage}%; background-color: ${color}"></div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            analysisHTML += '</div>';
            
            // Update the container
            analysisContainer.innerHTML = analysisHTML;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            displayNoDataMessage(analysisContainer);
        });
}

// Display no data message
function displayNoDataMessage(container) {
    container.innerHTML = `
        <div class="no-data-message">
            <i class="fas fa-chart-pie"></i>
            <p>No expense data available for this period.</p>
            <a href="${window.location.origin}/add_expense" class="btn btn-primary btn-sm">Add an expense</a>
        </div>
    `;
}

// Fetch recent expenses
function fetchRecentExpenses() {
    const recentExpensesContainer = document.getElementById('recentExpenses');
    if (!recentExpensesContainer) return;
    
    // Show loading state
    recentExpensesContainer.innerHTML = `
        <div class="expense-placeholder">
            <div class="placeholder-content">
                <div class="placeholder-circle"></div>
                <div class="placeholder-lines">
                    <div class="placeholder-line"></div>
                    <div class="placeholder-line"></div>
                </div>
                <div class="placeholder-amount"></div>
            </div>
        </div>
        <div class="expense-placeholder">
            <div class="placeholder-content">
                <div class="placeholder-circle"></div>
                <div class="placeholder-lines">
                    <div class="placeholder-line"></div>
                    <div class="placeholder-line"></div>
                </div>
                <div class="placeholder-amount"></div>
            </div>
        </div>
    `;
    
    // Fetch recent expenses data from server
    fetch('/get_recent_expenses')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error fetching recent expenses:', data.message);
                return;
            }
            
            // Clear container
            recentExpensesContainer.innerHTML = '';
            
            // Check if there are any expenses
            if (data.data.length === 0) {
                recentExpensesContainer.innerHTML = `
                    <div class="no-expenses-message" style="text-align:center; padding: 2rem 0;">
                        <i class="fas fa-receipt" style="font-size: 2rem; color: #999; margin-bottom: 0.5rem;"></i>
                        <p style="color: #999;">No recent expenses found.</p>
                    </div>
                `;
                return;
            }
            
            // Add expenses to container
            data.data.forEach(expense => {
                const expenseElement = document.createElement('div');
                expenseElement.className = 'expense-item';
                
                expenseElement.innerHTML = `
                    <div class="expense-info">
                        <div class="expense-category-icon">
                            <i class="${getCategoryIcon(expense.category)}"></i>
                        </div>
                        <div class="expense-details">
                            <div class="expense-category">${expense.category}</div>
                            <div class="expense-date">${formatDate(expense.date)}</div>
                        </div>
                    </div>
                    <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                `;
                
                recentExpensesContainer.appendChild(expenseElement);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            recentExpensesContainer.innerHTML = `
                <div class="error-message" style="text-align:center; padding: 2rem 0;">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #f44336; margin-bottom: 0.5rem;"></i>
                    <p>Failed to load recent expenses. Please try again.</p>
                </div>
            `;
        });
}

// Initialize income update functionality
function initIncomeUpdate() {
    const editIncomeBtn = document.getElementById('editIncomeBtn');
    const updateIncomeForm = document.getElementById('updateIncomeForm');
    const editIncomeModal = document.getElementById('editIncomeModal');
    
    if (editIncomeBtn && updateIncomeForm && editIncomeModal) {
        // Open the income update modal
        editIncomeBtn.addEventListener('click', function() {
            editIncomeModal.classList.add('show');
        });
        
        // Handle income update form submission
        updateIncomeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(updateIncomeForm);
            
            fetch('/update_income', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update income display without reloading the page
                    const newIncome = formData.get('income');
                    document.querySelector('.income-value').textContent = formatCurrency(newIncome);
                    
                    // Close the modal
                    editIncomeModal.classList.remove('show');
                    
                    // Show success message
                    const flashContainer = document.querySelector('.flash-messages');
                    const flashMessage = document.createElement('div');
                    flashMessage.className = 'flash-message';
                    flashMessage.textContent = 'Income updated successfully!';
                    
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
                    
                    // Reload page to update dashboard stats
                    window.location.reload();
                } else {
                    alert('Failed to update income. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        });
    }
}

// Initialize time period filter for expense analysis
function initTimeFilter() {
    const timeFilterButtons = document.querySelectorAll('.btn-filter');
    
    if (timeFilterButtons.length > 0) {
        timeFilterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                timeFilterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get selected period
                const period = this.getAttribute('data-period');
                
                // Fetch data for the selected period
                fetchExpenseAnalysis(period);
            });
        });
    }
}

// Initialize savings goals functionality
function initSavingsGoals() {
    // Handle add goal button
    const addGoalBtn = document.getElementById('addGoalBtn');
    const noGoalsAddBtn = document.getElementById('noGoalsAddBtn');
    const addGoalModal = document.getElementById('addGoalModal');
    
    if (addGoalBtn && addGoalModal) {
        addGoalBtn.addEventListener('click', function() {
            addGoalModal.classList.add('show');
        });
    }
    
    if (noGoalsAddBtn && addGoalModal) {
        noGoalsAddBtn.addEventListener('click', function() {
            addGoalModal.classList.add('show');
        });
    }
    
    // Initialize tips toggles
    const tipsToggles = document.querySelectorAll('.tips-toggle');
    if (tipsToggles.length > 0) {
        tipsToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                this.classList.toggle('active');
                const tipsContent = this.nextElementSibling;
                tipsContent.classList.toggle('active');
            });
        });
    }
    
    // Initialize goal deletion
    const deleteButtons = document.querySelectorAll('.goal-delete-btn');
    if (deleteButtons.length > 0) {
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const goalId = this.getAttribute('data-goal-id');
                const goalCard = this.closest('.goal-card');
                
                if (confirm('Are you sure you want to delete this savings goal?')) {
                    fetch(`/delete_savings_goal/${goalId}`, {
                        method: 'POST'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Remove the goal card with animation
                            goalCard.style.opacity = '0';
                            goalCard.style.transform = 'scale(0.8)';
                            
                            setTimeout(() => {
                                goalCard.remove();
                                
                                // Check if there are no more goals
                                const remainingGoals = document.querySelectorAll('.goal-card').length;
                                if (remainingGoals === 0) {
                                    const goalsContainer = document.querySelector('.goals-container');
                                    goalsContainer.innerHTML = `
                                        <div class="no-goals-message">
                                            <i class="fas fa-piggy-bank"></i>
                                            <p>You don't have any savings goals yet. Start planning for your future!</p>
                                            <button class="btn btn-primary" id="noGoalsAddBtn">Create Your First Goal</button>
                                        </div>
                                    `;
                                    
                                    // Reinitialize the add button
                                    const newNoGoalsAddBtn = document.getElementById('noGoalsAddBtn');
                                    if (newNoGoalsAddBtn && addGoalModal) {
                                        newNoGoalsAddBtn.addEventListener('click', function() {
                                            addGoalModal.classList.add('show');
                                        });
                                    }
                                }
                            }, 300);
                            
                            // Show success message
                            const flashContainer = document.querySelector('.flash-messages');
                            if (flashContainer) {
                                const flashMessage = document.createElement('div');
                                flashMessage.className = 'flash-message';
                                flashMessage.textContent = 'Savings goal deleted successfully!';
                                flashContainer.appendChild(flashMessage);
                                
                                // Auto-dismiss
                                setTimeout(() => {
                                    flashMessage.style.opacity = '0';
                                    setTimeout(() => {
                                        flashMessage.remove();
                                    }, 500);
                                }, 3000);
                            }
                        } else {
                            alert('Failed to delete savings goal. Please try again.');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while deleting the savings goal.');
                    });
                }
            });
        });
    }
    
    // Form validation
    const savingsGoalForm = document.getElementById('savingsGoalForm');
    if (savingsGoalForm) {
        savingsGoalForm.addEventListener('submit', function(e) {
            const targetAmount = parseFloat(document.getElementById('target_amount').value);
            const monthlySaving = parseFloat(document.getElementById('monthly_saving').value);
            
            // Basic validation
            if (monthlySaving <= 0) {
                e.preventDefault();
                alert('Monthly saving amount must be greater than zero.');
                return;
            }
            
            if (targetAmount <= 0) {
                e.preventDefault();
                alert('Target amount must be greater than zero.');
                return;
            }
            
            if (monthlySaving > targetAmount) {
                if (!confirm('Your monthly saving amount is greater than your target. This goal will be achieved in less than a month. Do you want to continue?')) {
                    e.preventDefault();
                }
            }
        });
    }
}

// Format currency utility function
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Format date utility function
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}