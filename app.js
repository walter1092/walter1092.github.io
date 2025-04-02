import React, { useState, useEffect } from 'react';

const TripExpenseTracker = () => {
  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState(() => {
    try {
      const saved = localStorage.getItem('trip-tracker-password');
      return saved || '';
    } catch (error) {
      return '';
    }
  });
  
  // State for new person name input
  const [newPersonName, setNewPersonName] = useState('');
  
  // State for people
  const [people, setPeople] = useState(['Person 1', 'Person 2']);
  
  // State for expenses
  const [expenses, setExpenses] = useState([
    { id: 1, description: 'Hotel', amount: 200, paidBy: 'Person 1', splits: { 'Person 1': 50, 'Person 2': 50 } }
  ]);
  
  // State for new expense form
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: 'Person 1',
    splitMethod: 'equal'
  });
  
  // For custom split percentages in the form
  const [customSplits, setCustomSplits] = useState({});
  
  // Save password to local storage
  useEffect(() => {
    try {
      if (storedPassword) {
        localStorage.setItem('trip-tracker-password', storedPassword);
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [storedPassword]);
  
  // Check if already authenticated through local storage
  useEffect(() => {
    try {
      const lastAuth = localStorage.getItem('trip-tracker-auth-time');
      if (lastAuth && storedPassword) {
        // Auto-login if authenticated in the last 24 hours
        const authTime = parseInt(lastAuth, 10);
        const now = new Date().getTime();
        if (now - authTime < 24 * 60 * 60 * 1000) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, [storedPassword]);
  
  // Handle login
  const handleLogin = () => {
    try {
      if (!storedPassword) {
        // First time setup - store the password
        setStoredPassword(password);
        setIsAuthenticated(true);
        localStorage.setItem('trip-tracker-auth-time', new Date().getTime().toString());
      } else if (password === storedPassword) {
        // Password matches
        setIsAuthenticated(true);
        localStorage.setItem('trip-tracker-auth-time', new Date().getTime().toString());
      } else {
        // Wrong password
        alert('Incorrect password');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('There was an error processing your login. If using private browsing, some features may not work.');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('trip-tracker-auth-time');
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };
  
  // Reset password
  const resetPassword = () => {
    if (window.confirm('Are you sure you want to reset the password? This will remove all saved data.')) {
      try {
        localStorage.clear();
        setStoredPassword('');
        setIsAuthenticated(false);
        setPassword('');
        setPeople(['Person 1', 'Person 2']);
        setExpenses([]);
        setCustomSplits({});
      } catch (error) {
        console.error('Error clearing localStorage:', error);
        alert('There was an error resetting your data. Some data may still remain.');
      }
    }
  };
  
  // Generate a unique ID for new expenses
  const generateId = () => {
    return expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
  };
  
  // Add a new person
  const addPerson = () => {
    if (newPersonName.trim() === '') return;
    if (people.includes(newPersonName.trim())) return;
    
    setPeople([...people, newPersonName.trim()]);
    setNewPersonName('');
    
    // Initialize custom splits for the new person
    const updatedSplits = { ...customSplits };
    for (const person of people) {
      if (!updatedSplits[person]) updatedSplits[person] = {};
      updatedSplits[person][newPersonName.trim()] = 0;
      updatedSplits[newPersonName.trim()] = { ...updatedSplits[newPersonName.trim()] || {}, [person]: 0 };
    }
    setCustomSplits(updatedSplits);
  };
  
  // Remove a person
  const removePerson = (personToRemove) => {
    // Don't allow removing all people
    if (people.length <= 1) return;
    
    // Update people list
    setPeople(people.filter(person => person !== personToRemove));
    
    // Update expenses to remove the person from splits
    const updatedExpenses = expenses.map(expense => {
      const newSplits = { ...expense.splits };
      delete newSplits[personToRemove];
      
      // If the person who paid is being removed, reassign to first remaining person
      const newPaidBy = expense.paidBy === personToRemove ? people.find(p => p !== personToRemove) : expense.paidBy;
      
      return {
        ...expense,
        paidBy: newPaidBy,
        splits: newSplits
      };
    });
    
    setExpenses(updatedExpenses);
    
    // Update custom splits
    const updatedSplits = { ...customSplits };
    delete updatedSplits[personToRemove];
    Object.keys(updatedSplits).forEach(person => {
      delete updatedSplits[person][personToRemove];
    });
    setCustomSplits(updatedSplits);
  };
  
  // Handle changes to the new expense form
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: name === 'amount' ? parseFloat(value) || '' : value });
  };
  
  // Handle custom split percentage changes
  const handleSplitChange = (person, value) => {
    const newSplits = { ...customSplits };
    if (!newSplits[newExpense.paidBy]) newSplits[newExpense.paidBy] = {};
    newSplits[newExpense.paidBy][person] = parseFloat(value) || 0;
    setCustomSplits(newSplits);
  };
  
  // Add a new expense
  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount || newExpense.amount <= 0) return;
    
    let splits = {};
    
    if (newExpense.splitMethod === 'equal') {
      // Equal split among all people
      const splitPercentage = 100 / people.length;
      people.forEach(person => {
        splits[person] = splitPercentage;
      });
    } else {
      // Custom split - use the percentages from customSplits
      const personSplits = customSplits[newExpense.paidBy] || {};
      splits = { ...personSplits };
      
      // Make sure all people are included
      people.forEach(person => {
        if (splits[person] === undefined) splits[person] = 0;
      });
    }
    
    const newExpenseItem = {
      id: generateId(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      paidBy: newExpense.paidBy,
      splits: splits
    };
    
    setExpenses([...expenses, newExpenseItem]);
    
    // Reset form
    setNewExpense({
      description: '',
      amount: '',
      paidBy: newExpense.paidBy,
      splitMethod: 'equal'
    });
  };
  
  // Remove an expense
  const removeExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };
  
  // Calculate who owes what
  const calculateBalances = () => {
    const balances = people.reduce((acc, person) => {
      acc[person] = 0;
      return acc;
    }, {});
    
    // Calculate what each person has paid and what they owe
    expenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const amount = expense.amount;
      
      // Add the full amount to the person who paid
      balances[paidBy] += amount;
      
      // Subtract each person's share based on the split
      Object.entries(expense.splits).forEach(([person, percentage]) => {
        balances[person] -= (amount * percentage) / 100;
      });
    });
    
    return balances;
  };
  
  // Calculate who needs to pay whom
  const calculateSettlements = () => {
    const balances = calculateBalances();
    
    // Separate into creditors (positive balance) and debtors (negative balance)
    const creditors = Object.entries(balances)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]); // Sort descending by amount
      
    const debtors = Object.entries(balances)
      .filter(([_, amount]) => amount < 0)
      .sort((a, b) => a[1] - b[1]); // Sort ascending by amount (more negative first)
    
    const settlements = [];
    
    // For each debtor, find creditors to pay
    for (const [debtor, debtAmount] of debtors) {
      let remainingDebt = -debtAmount; // Convert to positive
      
      for (let i = 0; i < creditors.length && remainingDebt > 0.01; i++) {
        const [creditor, creditAmount] = creditors[i];
        
        if (creditAmount <= 0.01) continue; // Skip creditors who have been fully paid
        
        // Calculate payment amount (minimum of debt and credit)
        const paymentAmount = Math.min(remainingDebt, creditAmount);
        
        if (paymentAmount > 0.01) {
          settlements.push({
            from: debtor,
            to: creditor,
            amount: Math.round(paymentAmount * 100) / 100 // Round to 2 decimal places
          });
          
          // Update remaining amounts
          remainingDebt -= paymentAmount;
          creditors[i] = [creditor, creditAmount - paymentAmount];
        }
      }
    }
    
    return settlements;
  };
  
  // Balance custom splits to ensure they add up to 100%
  const balanceCustomSplits = () => {
    const paidBy = newExpense.paidBy;
    const newSplits = { ...customSplits };
    
    if (!newSplits[paidBy]) newSplits[paidBy] = {};
    
    // Calculate total of all splits except the last person
    const otherPeople = people.filter(p => p !== people[people.length - 1]);
    const totalOthers = otherPeople.reduce((sum, person) => {
      return sum + (newSplits[paidBy][person] || 0);
    }, 0);
    
    // Set the last person's split to make it add up to 100%
    const lastPerson = people[people.length - 1];
    newSplits[paidBy][lastPerson] = Math.max(0, 100 - totalOthers);
    
    setCustomSplits(newSplits);
  };
  
  // Get total of custom splits for validation
  const getCustomSplitsTotal = () => {
    if (!newExpense.paidBy || !customSplits[newExpense.paidBy]) return 0;
    
    return people.reduce((sum, person) => {
      return sum + (customSplits[newExpense.paidBy][person] || 0);
    }, 0);
  };
  
  const customSplitsTotal = getCustomSplitsTotal();
  const isCustomSplitsValid = Math.abs(customSplitsTotal - 100) < 0.01;
  
  // Get total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Get expenses by person
  const expensesByPerson = people.reduce((acc, person) => {
    acc[person] = expenses
      .filter(expense => expense.paidBy === person)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return acc;
  }, {});
  
  // Calculate the final settlements
  const settlements = calculateSettlements();
  
  // Export data as JSON
  const exportData = () => {
    try {
      const data = {
        people,
        expenses,
        customSplits,
        date: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `trip-expenses-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('There was an error exporting your data. Please try again.');
    }
  };
  
  // Import data from JSON file
  const importData = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Validate data structure
          if (!importedData.people || !importedData.expenses) {
            alert('Invalid data format');
            return;
          }
          
          setPeople(importedData.people);
          setExpenses(importedData.expenses);
          setCustomSplits(importedData.customSplits || {});
        } catch (error) {
          alert('Error importing data: ' + error.message);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing data:', error);
      alert('There was an error importing your data. Please try again.');
    }
  };
  
  // Export data as CSV
  const exportCSV = () => {
    try {
      // Create header row
      let csv = 'Description,Amount,Paid By,';
      people.forEach(person => {
        csv += `${person} (%),${person} ($),`;
      });
      csv += '\n';
      
      // Add expense rows
      expenses.forEach(expense => {
        csv += `"${expense.description}",${expense.amount},${expense.paidBy},`;
        
        people.forEach(person => {
          const percentage = expense.splits[person] || 0;
          const amount = (expense.amount * percentage) / 100;
          csv += `${percentage.toFixed(1)},${amount.toFixed(2)},`;
        });
        
        csv += '\n';
      });
      
      // Add summary row
      csv += `TOTAL,${totalExpenses.toFixed(2)},,`;
      people.forEach(person => {
        csv += `,,`;
      });
      csv += '\n\n';
      
      // Add settlements
      csv += 'Settlements:\n';
      settlements.forEach(settlement => {
        csv += `${settlement.from} pays ${settlement.to},${settlement.amount.toFixed(2)}\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `trip-expenses-${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('There was an error exporting your data. Please try again.');
    }
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      {!isAuthenticated ? (
        // Login Screen
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-3xl font-bold mb-6 text-blue-700 text-center">Trip Expense Tracker</h1>
            <p className="mb-6 text-gray-600 text-center">
              {!storedPassword 
                ? "Create a password to protect your trip expenses." 
                : "Enter your password to access your trip expenses."}
            </p>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
            >
              {!storedPassword ? "Set Password" : "Login"}
            </button>
            
            {storedPassword && (
              <button
                onClick={resetPassword}
                className="w-full py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Reset Password & Data
              </button>
            )}
          </div>
        </div>
      ) : (
        // Main App
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-700">Trip Expense Tracker</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
          
          {/* People Management Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-blue-600">People</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {people.map(person => (
                <div key={person} className="flex items-center bg-white px-3 py-2 rounded-full border">
                  <span>{person}</span>
                  <button
                    onClick={() => removePerson(person)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    title="Remove person"
                  >
                    ×
                  </button>
              </div>
          )}
        </>
      )}
    </div>
  );
};

export default TripExpenseTracker;
              ))}
            </div>
            
            <div className="flex">
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Add new person"
                className="flex-grow px-3 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addPerson}
                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
              >
                Add Person
              </button>
            </div>
          </div>
          
          {/* Add New Expense Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Add New Expense</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Description:</label>
                <input
                  type="text"
                  name="description"
                  value={newExpense.description}
                  onChange={handleExpenseChange}
                  placeholder="e.g., Hotel, Flight tickets, Dinner"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Amount:</label>
                <input
                  type="number"
                  name="amount"
                  value={newExpense.amount}
                  onChange={handleExpenseChange}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Paid By:</label>
                <select
                  name="paidBy"
                  value={newExpense.paidBy}
                  onChange={handleExpenseChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {people.map(person => (
                    <option key={person} value={person}>{person}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Split Method:</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="splitMethod"
                      value="equal"
                      checked={newExpense.splitMethod === 'equal'}
                      onChange={handleExpenseChange}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Equal Split</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="splitMethod"
                      value="custom"
                      checked={newExpense.splitMethod === 'custom'}
                      onChange={handleExpenseChange}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Custom Split</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Custom Split Percentages */}
            {newExpense.splitMethod === 'custom' && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 font-medium">Custom Percentages:</label>
                  <button
                    onClick={balanceCustomSplits}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Balance to 100%
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                  {people.map((person) => (
                    <div key={person} className="flex items-center">
                      <span className="w-24 truncate">{person}:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customSplits[newExpense.paidBy]?.[person] || 0}
                        onChange={(e) => handleSplitChange(person, e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  ))}
                </div>
                
                <div className={`text-right ${isCustomSplitsValid ? 'text-green-600' : 'text-red-600'} font-medium`}>
                  Total: {customSplitsTotal.toFixed(1)}% {isCustomSplitsValid ? '✓' : '(should be 100%)'}
                </div>
              </div>
            )}
            
            <button
              onClick={addExpense}
              disabled={newExpense.splitMethod === 'custom' && !isCustomSplitsValid}
              className={`w-full py-2 rounded font-medium ${
                newExpense.splitMethod === 'custom' && !isCustomSplitsValid
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Add Expense
            </button>
          </div>
          
          {/* Export/Import Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Save & Share</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
                <label 
                  htmlFor="import-file" 
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                >
                  Import Data
                </label>
              </div>
              <button 
                onClick={exportData} 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export as JSON
              </button>
              <button 
                onClick={exportCSV} 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export as CSV
              </button>
            </div>
          </div>
          
          {/* Expenses List Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Expenses</h2>
            
            {expenses.length === 0 ? (
              <p className="text-gray-500 italic">No expenses added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-left">Paid By</th>
                      <th className="px-4 py-2 text-left">Split</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense.id} className="border-b hover:bg-blue-50">
                        <td className="px-4 py-2">{expense.description}</td>
                        <td className="px-4 py-2 text-right">${expense.amount.toFixed(2)}</td>
                        <td className="px-4 py-2">{expense.paidBy}</td>
                        <td className="px-4 py-2">
                          {Object.entries(expense.splits).map(([person, percentage], idx, arr) => (
                            <span key={person}>
                              {person}: {percentage.toFixed(1)}%
                              {idx < arr.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => removeExpense(expense.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove expense"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-blue-100">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right">${totalExpenses.toFixed(2)}</td>
                      <td colSpan="3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Summary and Settlement Section */}
          {expenses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Who Paid What */}
              <div className="p-4 bg-gray-50 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-blue-600">Who Paid What</h2>
                <div className="space-y-2">
                  {Object.entries(expensesByPerson).map(([person, amount]) => (
                    <div key={person} className="flex justify-between">
                      <span>{person}:</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Settlements - Who Owes Whom */}
              <div className="p-4 bg-gray-50 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-blue-600">Settlements</h2>
                {settlements.length === 0 ? (
                  <p className="text-gray-500 italic">All settled! No payments needed.</p>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((settlement, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div>
                          <span className="font-medium text-red-600">{settlement.from}</span>
                          <span className="mx-2">pays</span>
                          <span className="font-medium text-green-600">{settlement.to}</span>
                        </div>
                        <span className="font-bold">${settlement.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
