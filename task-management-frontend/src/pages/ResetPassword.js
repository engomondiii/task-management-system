import React, { useState } from 'react';
import axios from 'axios';

const ResetPassword = () => {
  const [email, setEmail] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/reset-password', { email });
      alert('Password reset email sent. Please check your email.');
    } catch (error) {
      alert('Error sending password reset email. Please try again.');
    }
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    width: '300px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
  };

  const formGroupStyle = {
    marginBottom: '15px',
    width: '100%',
  };

  const labelStyle = {
    marginBottom: '5px',
    display: 'block',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#dc3545',
    color: '#fff',
    cursor: 'pointer',
  };

  return (
    <form onSubmit={handleResetPassword} style={formStyle}>
      <div style={formGroupStyle}>
        <label style={labelStyle}>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </div>
      <button type="submit" style={buttonStyle}>Reset Password</button>
    </form>
  );
};

export default ResetPassword;
