import React, { useState } from 'react';
import '../styles/IssueForm.css';

const IssueForm = ({ onSubmit }) => {
  const [issue, setIssue] = useState('');
  const [category, setCategory] = useState('');
  const [assignee, setAssignee] = useState('');
  const [complainant, setComplainant] = useState({ phoneNumber: '', email: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', { issue, category, assignee, complainant });
    onSubmit({ issue, category, assignee, complainant });
    setIssue('');
    setCategory('');
    setAssignee('');
    setComplainant({ phoneNumber: '', email: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="issue-form">
      <div className="form-group">
        <label>Issue:</label>
        <input
          type="text"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Category:</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Assignee:</label>
        <input
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Complainant Phone Number:</label>
        <input
          type="text"
          value={complainant.phoneNumber}
          onChange={(e) => setComplainant({ ...complainant, phoneNumber: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>Complainant Email:</label>
        <input
          type="email"
          value={complainant.email}
          onChange={(e) => setComplainant({ ...complainant, email: e.target.value })}
          required
        />
      </div>
      <button type="submit" className="submit-btn">Submit</button>
    </form>
  );
};

export default IssueForm;
