import React, { useEffect, useState } from 'react';
import '../styles/IssueList.css';

const IssueList = ({ refreshTrigger, setRefreshTrigger }) => {
  const [issues, setIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [editingIssue, setEditingIssue] = useState(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/issues', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        console.log('Fetched Issues:', data);
        setIssues(data);
      } catch (error) {
        console.error('Error fetching issues:', error);
      }
    };

    fetchIssues();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/issues/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setIssues(issues.filter((issue) => issue._id !== id));
      setRefreshTrigger(!refreshTrigger);  // Trigger a refresh
    } catch (error) {
      console.error('Error deleting issue:', error);
    }
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
  };

  const handleUpdate = async (updatedIssue) => {
    try {
      await fetch(`http://localhost:5000/api/issues/${updatedIssue._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedIssue),
      });
      setIssues(issues.map((issue) => (issue._id === updatedIssue._id ? updatedIssue : issue)));
      setEditingIssue(null);
      setRefreshTrigger(!refreshTrigger);  // Trigger a refresh
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const filteredIssues = Array.isArray(issues) ? issues.filter((issue) => {
    return (
      issue.issue?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory ? issue.category?.toLowerCase() === filterCategory.toLowerCase() : true) &&
      (filterAssignee ? issue.assignee?.toLowerCase() === filterAssignee.toLowerCase() : true)
    );
  }) : [];

  return (
    <div>
      <h2>Logged Issues</h2>
      <div className="filter-inputs">
        <input
          type="text"
          placeholder="Search issues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by category..."
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by assignee..."
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
        />
      </div>
      <ul>
        {filteredIssues.map((issue) => (
          <li key={issue._id}>
            <strong>Issue:</strong> {issue.issue} <br />
            <strong>Category:</strong> {issue.category} <br />
            <strong>Assignee:</strong> {issue.assignee} <br />
            <strong>Tracking Number:</strong> {issue._id} <br />
            <div className="issue-actions">
              <button onClick={() => handleEdit(issue)}>Edit</button>
              <button onClick={() => handleDelete(issue._id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {editingIssue && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate(editingIssue);
          }}
        >
          <div>
            <label>Issue:</label>
            <input
              type="text"
              value={editingIssue.issue}
              onChange={(e) => setEditingIssue({ ...editingIssue, issue: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Category:</label>
            <input
              type="text"
              value={editingIssue.category}
              onChange={(e) => setEditingIssue({ ...editingIssue, category: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Assignee:</label>
            <input
              type="text"
              value={editingIssue.assignee}
              onChange={(e) => setEditingIssue({ ...editingIssue, assignee: e.target.value })}
              required
            />
          </div>
          <button type="submit">Update</button>
        </form>
      )}
    </div>
  );
};

export default IssueList;
