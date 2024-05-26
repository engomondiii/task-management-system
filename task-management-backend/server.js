require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const sql = require('mssql');

// Initialize Express
const app = express();

app.use(bodyParser.json());
app.use(cors());

// SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Use environment variable for SendGrid API key

// Twilio setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// SQL Server setup
const sqlConfig = {
    user: process.env.DB_USER, // DB user from environment variable
    password: process.env.DB_PASSWORD, // DB password from environment variable
    server: process.env.DB_SERVER, // DB server from environment variable
    database: process.env.DB_NAME, // DB name from environment variable
    options: {
        encrypt: true, // Use encryption
        trustServerCertificate: true // Change to true for local dev / self-signed certs
    }
};

// Connect to SQL Server
sql.connect(sqlConfig).then(pool => {
    if (pool.connected) console.log('Connected to SQL Server');
}).catch(err => console.error('SQL Server connection error:', err));

// JWT generation
const generateToken = (user) => {
    return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Middleware for authentication
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
        return res.status(401).send({ error: 'Unauthorized access' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Unauthorized access' });
    }
};

// Send notification via SMS and email
const sendNotification = async (trackingNumber, complainant) => {
    const message = `Your issue has been logged. Your tracking number is ${trackingNumber}.`;

    // Send SMS
    try {
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: complainant.phoneNumber,
        });
        console.log('SMS sent successfully');
    } catch (error) {
        console.error('Error sending SMS:', error);
    }

    // Send Email
    try {
        const emailData = {
            from: 'noreply@yourdomain.com', // Replace with your verified domain
            to: complainant.email,
            subject: 'Issue Logged - Tracking Number',
            text: message,
        };
        await sgMail.send(emailData);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// User registration
app.post('/api/users/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 8);
        const pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('email', sql.NVarChar, email)
            .query('INSERT INTO Users (username, password, email) VALUES (@username, @password, @username)');

        res.status(201).send({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Error registering user', error: err });
    }
});

// User login
app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');
        
        const user = result.recordset[0];
        if (!user) {
            return res.status(400).send({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'Invalid username or password' });
        }

        const token = generateToken(user);
        res.send({ token });
    } catch (err) {
        res.status(500).send({ message: 'Error logging in', error: err });
    }
});

// Reset password request
app.post('/api/users/reset-password', async (req, res) => {
    const { email } = req.body;
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        const user = result.recordset[0];
        if (!user) {
            return res.status(400).send({ error: 'Email not found' });
        }

        const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        await pool.request()
            .input('resetToken', sql.NVarChar, resetToken)
            .input('resetTokenExpiry', sql.DateTime, new Date(Date.now() + 3600000))
            .input('email', sql.NVarChar, email)
            .query('UPDATE Users SET resetToken = @resetToken, resetTokenExpiry = @resetTokenExpiry WHERE email = @email');

        const emailData = {
            from: 'noreply@yourdomain.com', // Replace with your verified domain
            to: user.email,
            subject: 'Password Reset',
            text: `Please use the following link to reset your password: http://localhost:3000/update-password/${resetToken}`,
        };
        await sgMail.send(emailData);

        res.status(200).send({ message: 'Password reset email sent' });
    } catch (err) {
        res.status(500).send({ message: 'Error sending password reset email', error: err });
    }
});

// Update password
app.post('/api/users/update-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, decoded.id)
            .input('resetToken', sql.NVarChar, token)
            .input('resetTokenExpiry', sql.DateTime, new Date(Date.now()))
            .query('SELECT * FROM Users WHERE id = @id AND resetToken = @resetToken AND resetTokenExpiry > @resetTokenExpiry');

        const user = result.recordset[0];
        if (!user) {
            return res.status(400).send({ error: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        await pool.request()
            .input('password', sql.NVarChar, hashedPassword)
            .input('id', sql.Int, user.id)
            .query('UPDATE Users SET password = @password, resetToken = NULL, resetTokenExpiry = NULL WHERE id = @id');

        res.status(200).send({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Error updating password', error: err });
    }
});

// Create issue
app.post('/api/issues', authMiddleware, async (req, res) => {
    const { issue, category, assignee, complainant } = req.body;
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('issue', sql.NVarChar, issue)
            .input('category', sql.NVarChar, category)
            .input('assignee', sql.NVarChar, assignee)
            .input('complainantPhoneNumber', sql.NVarChar, complainant.phoneNumber)
            .input('complainantEmail', sql.NVarChar, complainant.email)
            .query('INSERT INTO Issues (issue, category, assignee, complainantPhoneNumber, complainantEmail, status) OUTPUT INSERTED.ID AS id VALUES (@issue, @category, @assignee, @complainantPhoneNumber, @complainantEmail, \'Pending\')');

        const trackingNumber = result.recordset[0].id;

        await sendNotification(trackingNumber, complainant);

        res.status(200).send({ message: 'Issue logged successfully', trackingNumber });
    } catch (err) {
        res.status(500).send({ message: 'Error logging issue', error: err });
    }
});

// Fetch issues
app.get('/api/issues', authMiddleware, async (req, res) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .query('SELECT * FROM Issues');

        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: 'Error fetching issues', error: err });
    }
});

// Fetch issue stats
app.get('/api/issues/stats', authMiddleware, async (req, res) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const totalIssues = (await pool.request().query('SELECT COUNT(*) AS count FROM Issues')).recordset[0].count;
        const resolvedIssues = (await pool.request().query('SELECT COUNT(*) AS count FROM Issues WHERE status = \'Resolved\'')).recordset[0].count;
        const pendingIssues = totalIssues - resolvedIssues;

        res.status(200).send({ totalIssues, resolvedIssues, pendingIssues });
    } catch (err) {
        res.status(500).send({ message: 'Error fetching stats', error: err });
    }
});

// Update issue
app.put('/api/issues/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { issue, category, assignee, status } = req.body;
    try {
        const pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .input('issue', sql.NVarChar, issue)
            .input('category', sql.NVarChar, category)
            .input('assignee', sql.NVarChar, assignee)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Issues SET issue = @issue, category = @category, assignee = @assignee, status = @status WHERE id = @id');

        res.status(200).send({ message: 'Issue updated successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Error updating issue', error: err });
    }
});

// Delete issue
app.delete('/api/issues/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Issues WHERE id = @id');

        res.status(200).send({ message: 'Issue deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Error deleting issue', error: err });
    }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
