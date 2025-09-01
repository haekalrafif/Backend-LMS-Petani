const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/authMiddleware');

router.get('/:moduleId/progress', protect, async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user.id;

    try {
        const [completions] = await db.query(
            `SELECT material_id FROM user_material_completions
             JOIN materials ON user_material_completions.material_id = materials.id
             WHERE user_material_completions.user_id = ? AND materials.module_id = ?`,
            [userId, moduleId]
        );
        
        const completedMaterialIds = completions.map(c => c.material_id);
        res.json({ completedMaterialIds });

    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({ message: 'Server error while fetching progress.' });
    }
});

router.post('/:moduleId/materials/:materialId/complete', protect, async (req, res) => {
    const { materialId } = req.params;
    const userId = req.user.id;

    try {
        const [materials] = await db.query('SELECT id FROM materials WHERE id = ?', [materialId]);
        if (materials.length === 0) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        await db.query(
            'INSERT IGNORE INTO user_material_completions (user_id, material_id) VALUES (?, ?)',
            [userId, materialId]
        );

        res.status(201).json({ message: 'Material marked as complete.' });

    } catch (error) {
        console.error('Error marking material as complete:', error);
        res.status(500).json({ message: 'Server error while marking material as complete.' });
    }
});

module.exports = router;