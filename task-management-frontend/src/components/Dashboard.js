import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({ totalIssues: 0, resolvedIssues: 0, pendingIssues: 0 });

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/issues/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const dashboardStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    margin: '20px 0',
  };

  const statBoxStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    width: '30%',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  };

  const headingStyle = {
    marginBottom: '10px',
  };

  return (
    <div style={dashboardStyle}>
      <div style={statBoxStyle}>
        <h3 style={headingStyle}>Total Issues</h3>
        <p>{stats.totalIssues}</p>
      </div>
      <div style={statBoxStyle}>
        <h3 style={headingStyle}>Resolved Issues</h3>
        <p>{stats.resolvedIssues}</p>
      </div>
      <div style={statBoxStyle}>
        <h3 style={headingStyle}>Pending Issues</h3>
        <p>{stats.pendingIssues}</p>
      </div>
    </div>
  );
};

export default Dashboard;
