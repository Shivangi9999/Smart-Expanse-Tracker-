// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    // Flash message auto-dismiss
    const flashMessages = document.querySelectorAll('.flash-message');
    if (flashMessages.length > 0) {
        setTimeout(() => {
            flashMessages.forEach(message => {
                message.style.opacity = 0;
                setTimeout(() => {
                    message.remove();
                }, 500);
            });
        }, 3000);
    }

    // Add active class to current navigation link
    const navLinks = document.querySelectorAll('.nav-links a');
    if (navLinks.length > 0) {
        const currentPath = window.location.pathname;
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.parentElement.classList.add('active');
            }
        });
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
});

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Get category icon based on category name
function getCategoryIcon(category) {
    const icons = {
        'Food': 'fas fa-utensils',
        'Transportation': 'fas fa-car',
        'Housing': 'fas fa-home',
        'Utilities': 'fas fa-bolt',
        'Entertainment': 'fas fa-film',
        'Healthcare': 'fas fa-heartbeat',
        'Shopping': 'fas fa-shopping-bag',
        'Education': 'fas fa-graduation-cap',
        'Travel': 'fas fa-plane',
        'Others': 'fas fa-ellipsis-h'
    };
    
    return icons[category] || 'fas fa-receipt';
}

// Get category color for charts
function getCategoryColor(category) {
    const colors = {
        'Food': '#1565C0',
        'Transportation': '#2E7D32',
        'Housing': '#EF6C00',
        'Utilities': '#7B1FA2',
        'Entertainment': '#0277BD',
        'Healthcare': '#C62828',
        'Shopping': '#00695C',
        'Education': '#303F9F',
        'Travel': '#FF8F00',
        'Others': '#455A64'
    };
    
    return colors[category] || '#9E9E9E';
}

// Show confirmation dialog
function showConfirmDialog(message, confirmCallback) {
    if (confirm(message)) {
        confirmCallback();
    }
}

// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Initialize all modals
function initModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        const closeBtn = modal.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

// Call modal initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initModals);