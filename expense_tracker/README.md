# Smart Expense Tracker

A modern AI-driven personal finance management web application that helps users track expenses, categorize spending, and receive intelligent savings recommendations.

## Features

- **User Authentication:** Secure sign-up and login system
- **Expense Tracking:** Add, view, and manage your expenses
- **Smart Categorization:** Categorize expenses for better tracking
- **Financial Analytics:** Visual breakdowns of your spending habits
- **AI-Powered Recommendations:** Get personalized saving tips based on your spending patterns
- **Investment Suggestions:** Receive advice on SIP and stock investments based on your savings ratio
- **Modern UI:** Beautiful, responsive interface with animations and interactive elements

## Technologies Used

- **Backend:** Python with Flask
- **Database:** SQLite (local database)
- **Frontend:** HTML, CSS, JavaScript
- **Data Visualization:** Chart.js
- **Graphics:** SVG animations

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/smart-expense-tracker.git
cd smart-expense-tracker
```

2. Create a virtual environment:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Run the application:
```
python app.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Application Structure

- `app.py`: Main application file with Flask routes and logic
- `database/`: Contains the SQLite database
- `static/`: Static assets (CSS, JavaScript, images, SVG)
- `templates/`: HTML templates for all pages
- `requirements.txt`: Required Python packages

## Usage

1. Register an account with your username, password, and monthly income
2. Log in to access your personal dashboard
3. Add new expenses with amount, category, date, and description
4. View your spending analysis on the dashboard
5. Get personalized financial tips based on your spending habits
6. View and filter your expenses on the expenses page

## Screenshots

![Dashboard](static/images/dashboard-screenshot.png)
![Expenses](static/images/expenses-screenshot.png)
![Add Expense](static/images/add-expense-screenshot.png)

## License

MIT

## Author

Your Name

## Acknowledgments

- Icons by Font Awesome
- Chart visualization by Chart.js