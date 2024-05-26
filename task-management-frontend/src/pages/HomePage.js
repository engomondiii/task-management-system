import React, { useState } from 'react';
import IssueForm from '../components/IssueForm';
import IssueList from '../components/IssueList';
import Dashboard from '../components/Dashboard';
import '../styles/HomePage.css';

const HomePage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleFormSubmit = async (formData) => {
    try {
      const response = await fetch('http://localhost:5000/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert('Issue logged successfully!');
        setRefreshTrigger(!refreshTrigger);  // Trigger a refresh
      } else {
        alert('Failed to log issue.');
      }
    } catch (error) {
      alert('Error logging issue: ' + error.message);
    }
  };

  return (
    <div className="home-page">
      <h1>Task Management System</h1>
      <Dashboard refreshTrigger={refreshTrigger} />
      <IssueForm onSubmit={handleFormSubmit} />
      <IssueList refreshTrigger={refreshTrigger} setRefreshTrigger={setRefreshTrigger} />
    </div>
  );
};

export default HomePage;
