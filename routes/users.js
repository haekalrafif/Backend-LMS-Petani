const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isSuperAdmin } = require('../middleware/authMiddleware');

router.use(protect, isSuperAdmin);

router.get('/', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, role FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/role', async (req, res) => {
    const { role } = req.body;
    const { id } = req.params;

    if (role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid role. Can only change to "teacher".' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.user.id === parseInt(id, 10)) {
            return res.status(400).json({ message: 'Cannot delete your own account.' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
