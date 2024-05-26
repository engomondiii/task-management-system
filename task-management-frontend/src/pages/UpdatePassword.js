import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const UpdatePassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/update-password', { token, newPassword });
      alert('Password updated successfully. Please log in with your new password.');
    } catch (error) {
      alert('Error updating password. Please try again.');
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
    backgroundColor: '#ffc107',
    color: '#fff',
    cursor: 'pointer',
  };

  return (
    <form onSubmit={handleUpdatePassword} style={formStyle}>
      <div style={formGroupStyle}>
        <label style={labelStyle}>New Password:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={inputStyle}
        />
      </div>
      <button type="submit" style={buttonStyle}>Update Password</button>
    </form>
  );
};

export default UpdatePassword;
