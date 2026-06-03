const express = require('express');
const router = express.Router();
const db = require('../db');

const { protect, isTeacher } = require('../middleware/authMiddleware');

// 1. POST /api/quizzes - Tambah Kuis beserta Soal-soalnya (Hanya Teacher & Super Admin)
router.post('/', protect, isTeacher, async (req, res) => {
    const { module_id, title, passing_score, questions } = req.body;

    if (!module_id || !title || !questions || questions.length === 0) {
        return res.status(400).json({ error: 'Data kuis tidak lengkap' });
    }

    try {
        const [quizResult] = await db.query(
            'INSERT INTO quizzes (module_id, title, passing_score) VALUES (?, ?, ?)',
            [module_id, title, passing_score || 80]
        );
        const quizId = quizResult.insertId;

        const questionValues = questions.map(q => [
            quizId,
            q.question_text,
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d,
            q.correct_answer
        ]);

        await db.query(
            'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES ?',
            [questionValues]
        );

        res.status(201).json({ message: 'Kuis dan soal berhasil ditambahkan', quizId });
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ error: 'Gagal menambahkan kuis ke database' });
    }
});

// 2. GET /api/quizzes/module/:moduleId - Ambil Kuis berdasarkan ID Modul (Untuk Halaman Pengerjaan)
router.get('/module/:moduleId', protect, async (req, res) => {
    const { moduleId } = req.params;
    
    try {
        const [quizzes] = await db.query('SELECT * FROM quizzes WHERE module_id = ?', [moduleId]);
        
        if (quizzes.length === 0) {
            return res.status(404).json({ message: 'Kuis tidak ditemukan untuk modul ini' });
        }

        const quiz = quizzes[0];
        const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [quiz.id]);

        res.json({ ...quiz, questions });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ error: 'Gagal mengambil data kuis' });
    }
});

// 3. POST /api/quizzes/:quizId/submit - Simpan Hasil Nilai Siswa
router.post('/:quizId/submit', protect, async (req, res) => {
    const { quizId } = req.params;
    const { score, is_passed, answers } = req.body; // Menerima payload answers tambahan
    const userId = req.user.id;

    try {
        // Insert hasil skor utama
        const [result] = await db.query(
            'INSERT INTO quiz_results (user_id, quiz_id, score, is_passed) VALUES (?, ?, ?, ?)',
            [userId, quizId, score, is_passed]
        );
        const resultId = result.insertId;

        // Jika ada jawaban, lakukan bulk insert ke tabel user_quiz_answers
        if (answers && answers.length > 0) {
            const answerValues = answers.map(a => [
                resultId,
                a.question_id,
                a.selected_option
            ]);
            await db.query(
                'INSERT INTO user_quiz_answers (result_id, question_id, selected_option) VALUES ?',
                [answerValues]
            );
        }

        res.status(201).json({ message: 'Hasil kuis berhasil disimpan' });
    } catch (error) {
        console.error('Error saving quiz result:', error);
        res.status(500).json({ error: 'Gagal menyimpan hasil kuis' });
    }
});

// 4. GET /api/quizzes/:quizId/result - Ambil Nilai & Riwayat Jawaban
router.get('/:quizId/result', protect, async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user.id;

    try {
        const [results] = await db.query(
            'SELECT * FROM quiz_results WHERE user_id = ? AND quiz_id = ? ORDER BY completed_at DESC LIMIT 1',
            [userId, quizId]
        );
        
        if (results.length > 0) {
            const quizResult = results[0];
            // Ambil detail jawaban yang dipilih user
            const [answers] = await db.query(
                'SELECT question_id, selected_option FROM user_quiz_answers WHERE result_id = ?',
                [quizResult.id]
            );
            quizResult.answers = answers; // Sisipkan jawaban ke dalam object hasil
            res.json(quizResult);
        } else {
            res.json(null);
        }
    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ error: 'Gagal mengambil histori hasil kuis' });
    }
});

module.exports = router;