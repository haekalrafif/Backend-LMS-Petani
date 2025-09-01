const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, isTeacher } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadToCloudinary } = require('../config/cloudinary');

router.post('/:moduleId/materials', protect, isTeacher, upload.single('image'), async (req, res) => {
    const { moduleId } = req.params;
    const { title, content } = req.body;
    const author_id = req.user.id;
    let image_url = null;

    if (!title || !content) {
        return res.status(400).json({ message: 'Please provide a title and content for the material.' });
    }

    try {
        const [modules] = await db.query('SELECT author_id FROM modules WHERE id = ?', [moduleId]);
        if (modules.length === 0) {
            return res.status(404).json({ message: 'Module not found.' });
        }
        if (modules[0].author_id !== author_id) {
            return res.status(403).json({ message: 'User not authorized to add material to this module.' });
        }

        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            image_url = uploadResult.secure_url;
        }

        const [result] = await db.query(
            'INSERT INTO materials (module_id, title, content, image_url) VALUES (?, ?, ?, ?)',
            [moduleId, title, content, image_url]
        );

        res.status(201).json({ message: 'Material added successfully', materialId: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while adding material.' });
    }
});

router.get('/:moduleId/materials/:materialId', protect, isTeacher, async (req, res) => {
    const { moduleId, materialId } = req.params;
    const author_id = req.user.id;

    try {
        const [materials] = await db.query('SELECT * FROM materials WHERE id = ? AND module_id = ?', [materialId, moduleId]);
        if (materials.length === 0) {
            return res.status(404).json({ message: 'Material not found in this module.' });
        }
        const material = materials[0];

        const [modules] = await db.query('SELECT author_id FROM modules WHERE id = ?', [moduleId]);
        if (modules.length === 0 || modules[0].author_id !== author_id) {
            return res.status(403).json({ message: 'User not authorized to view this material for editing.' });
        }

        res.json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching material.' });
    }
});

router.put('/:moduleId/materials/:materialId', protect, isTeacher, upload.single('image'), async (req, res) => {
    const { moduleId, materialId } = req.params;
    const { title, content } = req.body;
    const author_id = req.user.id;
    let image_url = null; 

    if (!title || !content) {
        return res.status(400).json({ message: 'Please provide title and content for the material.' });
    }

    try {
        const [materials] = await db.query('SELECT * FROM materials WHERE id = ? AND module_id = ?', [materialId, moduleId]);
        if (materials.length === 0) {
            return res.status(404).json({ message: 'Material not found in this module.' });
        }
        const existingMaterial = materials[0];

        const [modules] = await db.query('SELECT author_id FROM modules WHERE id = ?', [moduleId]);
        if (modules.length === 0 || modules[0].author_id !== author_id) {
            return res.status(403).json({ message: 'User not authorized to update this material.' });
        }

        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            image_url = uploadResult.secure_url;
        } else {
            image_url = existingMaterial.image_url;
        }

        const [result] = await db.query(
            'UPDATE materials SET title = ?, content = ?, image_url = ? WHERE id = ? AND module_id = ?',
            [title, content, image_url, materialId, moduleId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Material not found or no changes made.' });
        }

        res.json({ message: 'Material updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating material.' });
    }
});

module.exports = router;