const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isTeacher } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadToCloudinary } = require('../config/cloudinary');
const jwt = require('jsonwebtoken');

const decodeToken = (req) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.user;
        } catch (error) {
            return null;
        }
    }
    return null;
};


router.get('/', async (req, res) => {
    const user = decodeToken(req);

    try {
        let query;
        let queryParams = [];

        if (user && user.role === 'user') {
            query = `
                SELECT 
                    m.id, m.title, m.short_description, m.image_url, m.created_at, m.updated_at, 
                    u.username as author,
                    (SELECT COUNT(*) FROM materials WHERE module_id = m.id) as total_materials,
                    (SELECT COUNT(*) FROM user_material_completions umc
                     JOIN materials mat ON umc.material_id = mat.id
                     WHERE mat.module_id = m.id AND umc.user_id = ?) as completed_materials
                FROM modules m
                JOIN users u ON m.author_id = u.id
                ORDER BY m.created_at DESC
            `;
            queryParams.push(user.id);
        } else {
            query = `
                SELECT m.id, m.title, m.short_description, m.image_url, m.created_at, m.updated_at, u.username as author
                FROM modules m
                JOIN users u ON m.author_id = u.id
                ORDER BY m.created_at DESC
            `;
        }

        const [modules] = await db.query(query, queryParams);
        res.json(modules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [modules] = await db.query(`
            SELECT m.id, m.title, m.short_description, m.image_url, m.created_at, m.updated_at, m.author_id, u.username as author
            FROM modules m
            JOIN users u ON m.author_id = u.id
            WHERE m.id = ?
        `, [req.params.id]);

        if (modules.length === 0) {
            return res.status(404).json({ message: 'Module not found' });
        }
        const moduleData = modules[0];

        const [materials] = await db.query('SELECT * FROM materials WHERE module_id = ? ORDER BY created_at ASC', [req.params.id]);

        const response = {
            ...moduleData,
            materials: materials
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', protect, isTeacher, upload.single('image'), async (req, res) => {
    const { title, short_description } = req.body;
    const author_id = req.user.id;
    let image_url = null;

    if (!title || !short_description) {
        return res.status(400).json({ message: 'Please provide title and short description.' });
    }
    
    if (!req.file) {
        return res.status(400).json({ message: 'A module image is required.' });
    }

    try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        image_url = uploadResult.secure_url;

        const [result] = await db.query(
            'INSERT INTO modules (title, short_description, image_url, author_id) VALUES (?, ?, ?, ?)',
            [title, short_description, image_url, author_id]
        );
        res.status(201).json({ message: 'Module created successfully', moduleId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during module creation or image upload.' });
    }
});

router.put('/:id', protect, isTeacher, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { title, short_description } = req.body;
    const author_id = req.user.id;

    if (!title || !short_description) {
        return res.status(400).json({ message: 'Please provide title and short description.' });
    }

    try {
        const [modules] = await db.query('SELECT * FROM modules WHERE id = ?', [id]);
        if (modules.length === 0) {
            return res.status(404).json({ message: 'Module not found' });
        }

        if (modules[0].author_id !== author_id) {
            return res.status(403).json({ message: 'User not authorized to update this module' });
        }

        let image_url = modules[0].image_url; 

        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            image_url = uploadResult.secure_url;
        }

        const queryParams = [title, short_description, image_url, id];
        await db.query(
            'UPDATE modules SET title = ?, short_description = ?, image_url = ? WHERE id = ?',
            queryParams
        );
        
        res.json({ message: 'Module updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during module update.' });
    }
});

router.delete('/:id', protect, isTeacher, async (req, res) => {
    const moduleId = req.params.id;
    const author_id = req.user.id;

    try {
        const [modules] = await db.query('SELECT * FROM modules WHERE id = ?', [moduleId]);
        if (modules.length === 0) {
            return res.status(404).json({ message: 'Module not found' });
        }

        if (modules[0].author_id !== author_id) {
            return res.status(403).json({ message: 'User not authorized to delete this module' });
        }

        await db.query('DELETE FROM modules WHERE id = ?', [moduleId]);
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;