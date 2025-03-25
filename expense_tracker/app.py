import os
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Add min function to Jinja environment
app.jinja_env.globals.update(min=min)

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'expense_tracker.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        income REAL NOT NULL
    )
    ''')
    
    # Create expenses table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create savings goals table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS savings_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        target_amount REAL NOT NULL,
        monthly_saving REAL NOT NULL,
        category TEXT NOT NULL,
        created_date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    conn.close()

# Ensure database exists
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
init_db()

# Helper functions
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_expense_categories():
    return [
        'Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment',
        'Healthcare', 'Shopping', 'Education', 'Travel', 'Others'
    ]

def get_user_expenses(user_id):
    conn = get_db_connection()
    expenses = conn.execute('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', (user_id,)).fetchall()
    conn.close()
    return expenses

def calculate_expense_stats(user_id):
    conn = get_db_connection()
    
    # Get user income
    user = conn.execute('SELECT income FROM users WHERE id = ?', (user_id,)).fetchone()
    income = user['income'] if user else 0
    
    # Get total expenses
    total_expenses = conn.execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', 
                              (user_id,)).fetchone()['total'] or 0
    
    # Get expenses by category
    categories = get_expense_categories()
    category_expenses = {}
    
    for category in categories:
        amount = conn.execute('SELECT SUM(amount) as amount FROM expenses WHERE user_id = ? AND category = ?', 
                          (user_id, category)).fetchone()['amount'] or 0
        category_expenses[category] = amount
    
    conn.close()
    
    # Calculate percentages
    expense_ratio = (total_expenses / income * 100) if income > 0 else 0
    saving_amount = income - total_expenses if income > total_expenses else 0
    saving_ratio = (saving_amount / income * 100) if income > 0 else 0
    
    return {
        'income': income,
        'total_expenses': total_expenses,
        'expense_ratio': expense_ratio,
        'saving_amount': saving_amount,
        'saving_ratio': saving_ratio,
        'category_expenses': category_expenses
    }

def get_financial_tips(stats):
    tips = []
    
    # Basic Expense Ratio Warnings
    if stats['expense_ratio'] > 90:
        tips.append("WARNING: Your expenses are extremely high (>90% of income). Immediate action needed to avoid debt!")
    elif stats['expense_ratio'] > 80:
        tips.append("WARNING: Your expenses are very high (>80% of income). Reduce non-essential spending immediately.")
    elif stats['expense_ratio'] > 70:
        tips.append("WARNING: Your expenses are moderately high. Consider creating a budget to manage your spending better.")
    else:
        tips.append("You're doing well at keeping expenses under control!")
    
    # Category-specific warnings and tips
    categories = stats['category_expenses']
    income = stats['income']
    
    if categories.get('Food', 0) > (income * 0.3):
        tips.append("WARNING: Your food expenses exceed 30% of income. Try meal planning and batch cooking to reduce costs.")
    
    if categories.get('Entertainment', 0) > (income * 0.15):
        tips.append("WARNING: Entertainment spending exceeds 15% of income. Look for free or low-cost entertainment options.")
    
    if categories.get('Housing', 0) > (income * 0.4):
        tips.append("WARNING: Housing costs exceed 40% of income. Consider downsizing or finding a roommate.")
    
    if categories.get('Shopping', 0) > (income * 0.2):
        tips.append("WARNING: Shopping expenses are high. Try implementing a 24-hour rule before non-essential purchases.")
    
    if categories.get('Transportation', 0) > (income * 0.2):
        tips.append("WARNING: High transportation costs. Consider carpooling, public transit, or optimizing your routes.")
    
    # General savings tips (4-5)
    tips.append("Set up automatic transfers to a separate savings account on payday to pay yourself first.")
    tips.append("Follow the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.")
    tips.append("Challenge yourself to a no-spend weekend once a month to boost your savings.")
    tips.append("Review and cancel unused subscriptions - these small recurring expenses add up significantly.")
    tips.append("Consider using cash envelopes for discretionary spending to make your budget more tangible.")
    
    # Investment recommendations based on savings ratio (4-5)
    if stats['saving_ratio'] > 20:
        tips.append("With your good saving habits, consider investing in index funds for long-term wealth building.")
        tips.append("Gold ETFs or Sovereign Gold Bonds can be a good hedge against inflation in your investment portfolio.")
        tips.append("Start a SIP in a diversified equity mutual fund to benefit from rupee cost averaging.")
        tips.append("Consider a balanced portfolio: 60% in equity SIPs, 20% in debt funds, and 20% in gold for stability.")
        tips.append("With consistent savings, explore dividend-yielding stocks for passive income generation.")
    elif stats['saving_ratio'] > 10:
        tips.append("Start small with a monthly SIP of just ₹1000 in a large-cap mutual fund to build the investing habit.")
        tips.append("Consider gold savings schemes offered by banks as a disciplined way to accumulate gold assets.")
        tips.append("Try micro-investing apps that round up your purchases and invest the spare change.")
        tips.append("Look into low-risk debt mutual funds as you build your emergency fund.")
        tips.append("Begin with a small monthly SIP and gradually increase it as your income grows.")
    else:
        tips.append("Focus on building an emergency fund covering 3-6 months of expenses before serious investing.")
        tips.append("Consider a recurring deposit as a safe way to start your saving journey.")
        tips.append("Even small amounts matter - start with a minimum SIP of ₹500 in a conservative hybrid fund.")
        tips.append("Try the 1% rule: save just 1% of your income, then increase by 1% each month.")
        tips.append("Gold accumulation plans let you invest small amounts regularly toward gold ownership.")
    
    return tips

def get_savings_goal_categories():
    return [
        'Electronics', 'Travel', 'Home Essentials', 
        'Vehicle Purchase', 'Education', 'Emergency'
    ]

def get_user_savings_goals(user_id):
    conn = get_db_connection()
    goals = conn.execute('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_date DESC', (user_id,)).fetchall()
    conn.close()
    return goals

def analyze_savings_goal(goal, expense_ratio):
    """Analyze if a savings goal is achievable based on current expense habits"""
    target_amount = goal['target_amount']
    monthly_saving = goal['monthly_saving']
    
    # Calculate months needed to reach goal
    months_needed = target_amount / monthly_saving if monthly_saving > 0 else float('inf')
    
    # Determine if goal is realistic based on expense ratio
    is_achievable = True
    tips = []
    
    if expense_ratio > 90:
        is_achievable = False
        tips.append(f"Your current expense ratio ({expense_ratio:.1f}%) is extremely high. To achieve this goal, you need to reduce expenses significantly.")
    elif expense_ratio > 80:
        is_achievable = False
        tips.append(f"With your expense ratio at {expense_ratio:.1f}%, this goal may be difficult to achieve. Try cutting non-essential spending.")
    elif expense_ratio > 70:
        is_achievable = True
        tips.append(f"Your expense ratio ({expense_ratio:.1f}%) is moderately high. Budget carefully to meet this goal.")
    else:
        is_achievable = True
        tips.append(f"With your current expense ratio ({expense_ratio:.1f}%), this goal appears achievable.")
    
    # Add time-based tips
    if months_needed < 6:
        tips.append(f"At your current savings rate, you'll reach this goal in about {months_needed:.1f} months - that's a great short-term goal!")
    elif months_needed < 12:
        tips.append(f"You'll reach this goal in about {months_needed:.1f} months at your current savings rate.")
    elif months_needed < 24:
        tips.append(f"This is a medium-term goal - it will take about {months_needed:.1f} months (or {months_needed/12:.1f} years) to achieve.")
    else:
        tips.append(f"This is a long-term goal that will take approximately {months_needed:.1f} months (or {months_needed/12:.1f} years) to achieve.")
        
    # Strategy tips based on category
    category = goal['category']
    if category == 'Electronics':
        tips.append("Consider waiting for seasonal sales like Diwali or Amazon/Flipkart sales to get better deals on electronics.")
    elif category == 'Travel':
        tips.append("Book flights and accommodations 2-3 months in advance for the best rates. Consider off-season travel for better deals.")
    elif category == 'Home Essentials':
        tips.append("Prioritize essential items first and spread out purchases of non-essential home items.")
    elif category == 'Vehicle Purchase':
        tips.append("Factor in additional costs like insurance, maintenance, and fuel when planning for a vehicle purchase.")
    elif category == 'Education':
        tips.append("Research scholarship opportunities and education loans with favorable terms to supplement your savings.")
    elif category == 'Emergency':
        tips.append("A good emergency fund should cover 3-6 months of expenses. Keep this money in a liquid account like a high-interest savings account.")
    
    # Calculate effective monthly saving percentage
    if is_achievable:
        if expense_ratio < 50:
            tips.append("You're in an excellent position to accelerate this goal by increasing your monthly savings amount.")
    
    return {
        'is_achievable': is_achievable,
        'months_needed': months_needed,
        'tips': tips
    }

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        income = float(request.form['income'])
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        
        if user:
            flash('Username already exists. Please choose a different one.')
            conn.close()
            return redirect(url_for('register'))
        
        hashed_password = generate_password_hash(password)
        conn.execute('INSERT INTO users (username, password, income) VALUES (?, ?, ?)',
                    (username, hashed_password, income))
        conn.commit()
        
        user_id = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()['id']
        conn.close()
        
        session['user_id'] = user_id
        session['username'] = username
        
        flash('Registration successful!')
        return redirect(url_for('dashboard'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            flash('Login successful!')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    flash('You have been logged out.')
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    stats = calculate_expense_stats(user_id)
    tips = get_financial_tips(stats)
    categories = get_expense_categories()
    
    # Get user's savings goals
    savings_goals = get_user_savings_goals(user_id)
    
    # Analyze each goal
    analyzed_goals = []
    for goal in savings_goals:
        analysis = analyze_savings_goal(goal, stats['expense_ratio'])
        analyzed_goals.append({
            'goal': goal,
            'analysis': analysis
        })
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    return render_template('dashboard.html', 
                          username=session['username'],
                          income=user['income'],
                          stats=stats,
                          tips=tips,
                          categories=categories,
                          savings_goals=analyzed_goals,
                          goal_categories=get_savings_goal_categories())

@app.route('/add_expense', methods=['GET', 'POST'])
def add_expense():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        user_id = session['user_id']
        amount = float(request.form['amount'])
        category = request.form['category']
        description = request.form['description']
        date = request.form['date']
        
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)',
            (user_id, amount, category, description, date)
        )
        conn.commit()
        conn.close()
        
        flash('Expense added successfully!')
        return redirect(url_for('expenses'))
    
    categories = get_expense_categories()
    return render_template('add_expense.html', categories=categories, today=datetime.now().strftime('%Y-%m-%d'))

@app.route('/expenses')
def expenses():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    expenses = get_user_expenses(user_id)
    
    return render_template('expenses.html', expenses=expenses)

@app.route('/update_income', methods=['POST'])
def update_income():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    user_id = session['user_id']
    new_income = float(request.form['income'])
    
    conn = get_db_connection()
    conn.execute('UPDATE users SET income = ? WHERE id = ?', (new_income, user_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/get_expense_data')
def get_expense_data():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    user_id = session['user_id']
    period = request.args.get('period', 'month')
    
    conn = get_db_connection()
    
    # Define date filters based on period
    current_date = datetime.now()
    if period == 'month':
        # Current month
        date_filter = f"{current_date.year}-{current_date.month:02d}-%"
        sql_filter = "AND date LIKE ?"
        params = (user_id, date_filter)
    elif period == 'quarter':
        # Current quarter
        quarter_start_month = ((current_date.month - 1) // 3) * 3 + 1
        from_date = f"{current_date.year}-{quarter_start_month:02d}-01"
        sql_filter = "AND date >= ?"
        params = (user_id, from_date)
    elif period == 'year':
        # Current year
        date_filter = f"{current_date.year}-%"
        sql_filter = "AND date LIKE ?"
        params = (user_id, date_filter)
    else:
        # All time
        sql_filter = ""
        params = (user_id,)
    
    # Get category expenses for the period
    categories = get_expense_categories()
    category_expenses = {}
    
    for category in categories:
        query = f'SELECT SUM(amount) as amount FROM expenses WHERE user_id = ? AND category = ? {sql_filter}'
        category_params = (user_id, category) + params[1:] if len(params) > 1 else (user_id, category)
        amount = conn.execute(query, category_params).fetchone()['amount'] or 0
        
        # Only include categories with non-zero expenses
        if amount > 0:
            category_expenses[category] = amount
    
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'categories': list(category_expenses.keys()),
            'amounts': list(category_expenses.values())
        }
    })

@app.route('/get_recent_expenses')
def get_recent_expenses():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    user_id = session['user_id']
    
    conn = get_db_connection()
    # Get 5 most recent expenses
    expenses = conn.execute(
        'SELECT id, amount, category, description, date FROM expenses WHERE user_id = ? ORDER BY date DESC LIMIT 5', 
        (user_id,)
    ).fetchall()
    
    recent_expenses = []
    for expense in expenses:
        recent_expenses.append({
            'id': expense['id'],
            'amount': expense['amount'],
            'category': expense['category'],
            'description': expense['description'] or 'No description',
            'date': expense['date']
        })
    
    conn.close()
    
    return jsonify({
        'success': True,
        'data': recent_expenses
    })

@app.route('/delete_expense/<int:expense_id>', methods=['POST'])
def delete_expense(expense_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    user_id = session['user_id']
    
    # Make sure the expense belongs to the logged-in user
    conn = get_db_connection()
    expense = conn.execute(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?', 
        (expense_id, user_id)
    ).fetchone()
    
    if not expense:
        conn.close()
        return jsonify({'success': False, 'message': 'Expense not found or unauthorized'})
    
    # Delete the expense
    conn.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/add_savings_goal', methods=['GET', 'POST'])
def add_savings_goal():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        user_id = session['user_id']
        name = request.form['goal_name']
        target_amount = float(request.form['target_amount'])
        monthly_saving = float(request.form['monthly_saving'])
        category = request.form['goal_category']
        created_date = datetime.now().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO savings_goals (user_id, name, target_amount, monthly_saving, category, created_date) VALUES (?, ?, ?, ?, ?, ?)',
            (user_id, name, target_amount, monthly_saving, category, created_date)
        )
        conn.commit()
        conn.close()
        
        flash('Savings goal added successfully!')
        return redirect(url_for('dashboard'))
    
    goal_categories = get_savings_goal_categories()
    return render_template('add_savings_goal.html', categories=goal_categories)

@app.route('/delete_savings_goal/<int:goal_id>', methods=['POST'])
def delete_savings_goal(goal_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    user_id = session['user_id']
    
    # Make sure the goal belongs to the logged-in user
    conn = get_db_connection()
    goal = conn.execute(
        'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?', 
        (goal_id, user_id)
    ).fetchone()
    
    if not goal:
        conn.close()
        return jsonify({'success': False, 'message': 'Goal not found or unauthorized'})
    
    # Delete the goal
    conn.execute('DELETE FROM savings_goals WHERE id = ?', (goal_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/saving_goal', methods=['POST'])
def saving_goal():
    try:
        # Get form data
        goal_id = request.form.get('goal_id')
        goal_name = request.form.get('goal_name')
        goal_amount = request.form.get('goal_amount')
        
        # If updating existing goal
        if goal_id and goal_id.isdigit():
            goal = SavingGoal.query.get(int(goal_id))
            if goal:
                goal.name = goal_name
                goal.amount = float(goal_amount)
                db.session.commit()  # Ensure this commit happens
        # If creating new goal
        else:
            new_goal = SavingGoal(
                name=goal_name,
                amount=float(goal_amount),
                user_id=current_user.id  # Assuming you have user authentication
            )
            db.session.add(new_goal)
            db.session.commit()  # Ensure this commit happens
            
        # Add flash message for feedback
        flash('Saving goal updated successfully!', 'success')
        
    except Exception as e:
        # Log the error
        print(f"Error updating saving goal: {str(e)}")
        db.session.rollback()  # Roll back on error
        flash('Error updating saving goal: ' + str(e), 'danger')
    
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(debug=True)