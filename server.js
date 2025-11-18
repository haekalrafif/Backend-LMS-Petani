require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads')); 

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const materialRoutes = require('./routes/materials');
const userRoutes = require('./routes/users');
const progressRoutes = require('./routes/progress');

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/modules', materialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', progressRoutes);

app.get('/api', (req, res) => {
  const documentationHtml = `
  <!DOCTYPE html>
  <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Dokumentasi - LMS Petani</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 25px; max-width: 900px; margin: 0 auto; color: #333; }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #16a085; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 40px; }
        h3 { color: #2980b9; margin-top: 25px; }
        code { background-color: #ecf0f1; padding: 3px 6px; border-radius: 4px; font-family: "Courier New", Courier, monospace; }
        pre { background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 5px; padding: 15px; white-space: pre-wrap; word-wrap: break-word; font-family: "Courier New", Courier, monospace; }
        .endpoint { font-family: "Courier New", Courier, monospace; font-weight: bold; font-size: 1.1em; background-color: #f0f4f8; padding: 2px 5px; border-radius: 3px;}
        .method-post { color: #27ae60; font-weight: bold; }
        .method-get { color: #2980b9; font-weight: bold; }
        .method-put { color: #f39c12; font-weight: bold; }
        .method-delete { color: #c0392b; font-weight: bold; }
        ul { padding-left: 20px; margin-top: 10px; }
        li { margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>API Dokumentasi: LMS Petani Backend</h1>
      <p><strong>Base URL</strong>: <code>https://backend-lms-petani.vercel.app/api</code></p>
      
      <h2>&#128274; Autentikasi</h2>
      <p>Beberapa endpoint memerlukan token autentikasi (JWT) yang dikirimkan di header <code>Authorization</code>:</p>
      <pre><code>Authorization: Bearer &lt;TOKEN&gt;</code></pre>
      <p>Berdasarkan hak akses, endpoint ditandai sebagai:</p>
      <ul>
        <li><strong>Public</strong>: Tidak perlu autentikasi.</li>
        <li><strong>User</strong>: Memerlukan token login (semua role: <code>user</code>, <code>teacher</code>, <code>super admin</code>).</li>
        <li><strong>Teacher</strong>: Memerlukan token dengan role <code>teacher</code> atau <code>super admin</code>.</li>
        <li><strong>Super Admin</strong>: Hanya memerlukan token dengan role <code>super admin</code>.</li>
      </ul>

      <h2>&#128100; 1. Auth (Autentikasi)</h2>
      <p>Mengelola registrasi dan login pengguna.</p>
      
      <h3><span class="method-post">POST</span> <span class="endpoint">/api/auth/register</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Public</code></li>
        <li><strong>Deskripsi</strong>: Mendaftarkan pengguna baru dengan role <code>user</code>.</li>
        <li><strong>Request Body</strong> (<code>application/json</code>):
<pre><code>{
  "username": "nama_user_baru",
  "password": "password_baru"
}</code></pre>
        </li>
        <li><strong>Success Response (201)</strong>:
<pre><code>{
  "message": "User berhasil terdaftar!",
  "userId": 123
}</code></pre>
        </li>
        <li><strong>Error Responses</strong>:
          <ul>
            <li><code>400 Bad Request</code>: Jika username atau password kosong.</li>
            <li><code>409 Conflict</code>: Jika username sudah dipakai.</li>
          </ul>
        </li>
      </ul>

      <h3><span class="method-post">POST</span> <span class="endpoint">/api/auth/login</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Public</code></li>
        <li><strong>Deskripsi</strong>: Login pengguna untuk mendapatkan token JWT.</li>
        <li><strong>Request Body</strong> (<code>application/json</code>):
<pre><code>{
  "username": "nama_user",
  "password": "password_user"
}</code></pre>
        </li>
        <li><strong>Success Response (200)</strong>:
<pre><code>{
  "message": "Berhasil login!",
  "token": "eyJh... (JWT Token)"
}</code></pre>
        </li>
        <li><strong>Error Responses</strong>:
          <ul>
            <li><code>400 Bad Request</code>: Jika username atau password kosong.</li>
            <li><code>401 Unauthorized</code>: Jika kredensial (username/password) salah.</li>
          </ul>
        </li>
      </ul>

      <h2>&#128218; 2. Modules (Modul)</h2>
      <p>Mengelola modul pembelajaran dan topiknya.</p>

      <h3><span class="method-get">GET</span> <span class="endpoint">/api/modules</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Public</code> (Data yang dikembalikan berbeda tergantung role)</li>
        <li><strong>Deskripsi</strong>: Mendapatkan semua modul.
          <ul>
            <li>Jika <code>Public</code> atau <code>Teacher</code>/<code>Super Admin</code>: Mengembalikan daftar modul dasar.</li>
            <li>Jika <code>User</code>: Mengembalikan daftar modul beserta progres (jumlah materi selesai).</li>
          </ul>
        </li>
        <li><strong>Success Response (200)</strong>: <pre><code>[ { module... }, { module... } ]</code></pre></li>
      </ul>

      <h3><span class="method-get">GET</span> <span class="endpoint">/api/modules/:id</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Public</code></li>
        <li><strong>Deskripsi</strong>: Mendapatkan detail satu modul, termasuk semua topik dan materinya.</li>
        <li><strong>Success Response (200)</strong>:
<pre><code>{
  "id": 1,
  "title": "Judul Modul",
  "short_description": "Deskripsi singkat.",
  "image_url": "http://...",
  "author": "nama_author",
  "topics": [
    {
      "id": 1,
      "title": "Judul Topik 1",
      "materials": [
        { "id": 101, "title": "Materi 1.1", ... },
        { "id": 102, "title": "Materi 1.2", ... }
      ]
    }
  ]
}</code></pre>
        </li>
        <li><strong>Error Responses</strong>: <code>404 Not Found</code></li>
      </ul>

      <h3><span class="method-post">POST</span> <span class="endpoint">/api/modules</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Teacher</code></li>
        <li><strong>Deskripsi</strong>: Membuat modul baru. Membutuhkan gambar.</li>
        <li><strong>Request Body</strong> (<code>multipart/form-data</code>):
          <ul>
            <li><code>title</code> (text)</li>
            <li><code>short_description</code> (text)</li>
            <li><code>image</code> (file, .jpg/.jpeg)</li>
          </ul>
        </li>
        <li><strong>Success Response (201)</strong>: <pre><code>{ "message": "Modul sukses dibuat!", "moduleId": 123 }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>400 Bad Request</code>, <code>403 Forbidden</code></li>
      </ul>

      <h3><span class="method-put">PUT</span> <span class="endpoint">/api/modules/:id</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Teacher</code> (Hanya author modul atau Super Admin)</li>
        <li><strong>Deskripsi</strong>: Memperbarui detail modul.</li>
        <li><strong>Request Body</strong> (<code>multipart/form-data</code>):
          <ul>
            <li><code>title</code> (text)</li>
            <li><code>short_description</code> (text)</li>
            <li><code>image</code> (file, .jpg/.jpeg, <i>Opsional</i> - jika tidak dikirim, gambar lama tetap dipakai)</li>
          </ul>
        </li>
        <li><strong>Success Response (200)</strong>: <pre><code>{ "message": "Module updated successfully" }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>400 Bad Request</code>, <code>403 Forbidden</code>, <code>404 Not Found</code></li>
      </ul>

      <h3><span class="method-delete">DELETE</span> <span class="endpoint">/api/modules/:id</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Teacher</code> (Hanya author modul atau Super Admin)</li>
        <li><strong>Deskripsi</strong>: Menghapus modul.</li>
        <li><strong>Success Response (200)</strong>: <pre><code>{ "message": "Module berhasil dihapus" }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>403 Forbidden</code>, <code>404 Not Found</code></li>
      </ul>

      <h3><span class="method-post">POST</span> <span class="endpoint">/api/modules/:moduleId/topics</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Teacher</code> (Hanya author modul atau Super Admin)</li>
        <li><strong>Deskripsi</strong>: Menambahkan topik baru ke modul.</li>
        <li><strong>Request Body</strong> (<code>application/json</code>):
<pre><code>{
  "title": "Judul Topik Baru"
}</code></pre>
        </li>
        <li><strong>Success Response (201)</strong>: <pre><code>{ "message": "Topik berhasil ditambahkan", "topicId": 456 }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>400 Bad Request</code>, <code>403 Forbidden</code></li>
      </ul>

      <h2>&#128221; 3. Materials (Materi)</h2>
      <p>Mengelola materi individual di dalam topik.</p>

      <h3><span class="method-post">POST</span> <span class="endpoint">/api/modules/:moduleId/materials</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Teacher</code> (Hanya author modul atau Super Admin)</li>
        <li><strong>Deskripsi</strong>: Menambahkan materi baru ke sebuah topik.</li>
        <li><strong>Request Body</strong> (<code>multipart/form-data</code>):
          <ul>
            <li><code>title</code> (text)</li>
            <li><code>content</code> (text)</li>
            <li><code>topic_id</code> (text/number)</li>
            <li><code>youtube_url</code> (text, <i>Opsional</i>)</li>
            <li><code>image</code> (file, .jpg/.jpeg, <i>Opsional</i>)</li>
          </ul>
        </li>
        <li><strong>Success Response (201)</strong>: <pre><code>{ "message": "Materi berhasil ditambahkan", "materialId": 101 }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>400 Bad Request</code>, <code>403 Forbidden</code></li>
      </ul>

      <h3><span class="method-get">GET</span> <span class="endpoint">/api/modules/:moduleId/materials/:materialId</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Teacher</code> (Hanya author modul atau Super Admin)</li>
        <li><strong>Deskripsi</strong>: Mengambil data materi spesifik (biasanya untuk form edit).</li>
        <li><strong>Success Response (200)</strong>: <pre><code>{ "id": 101, "title": "Judul Materi", "content": "...", "image_url": "...", ... }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>403 Forbidden</code>, <code>404 Not Found</code></li>
      </ul>

      <h3><span class="method-put">PUT</span> <span class="endpoint">/api/modules/:moduleId/materials/:materialId</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Teacher</code> (Hanya author modul atau Super Admin)</li>
        <li><strong>Deskripsi</strong>: Memperbarui materi.</li>
        <li><strong>Request Body</strong> (<code>multipart/form-data</code>):
          <ul>
            <li><code>title</code> (text)</li>
            <li><code>content</code> (text)</li>
            <li><code>youtube_url</code> (text, <i>Opsional</i>)</li>
            <li><code>image</code> (file, .jpg/.jpeg, <i>Opsional</i> - jika tidak dikirim, gambar lama tetap dipakai)</li>
          </ul>
        </li>
        <li><strong>Success Response (200)</strong>: <pre><code>{ "message": "Material updated successfully" }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>400 Bad Request</code>, <code>403 Forbidden</code>, <code>404 Not Found</code></li>
      </ul>

      <h2>&#128202; 4. Progress (Progres Pengguna)</h2>
      <p>Mengelola progres belajar pengguna.</p>

      <h3><span class="method-get">GET</span> <span class="endpoint">/api/modules/:moduleId/progress</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>User</code></li>
        <li><strong>Deskripsi</strong>: Mendapatkan daftar ID materi yang telah diselesaikan oleh pengguna yang sedang login untuk modul tertentu.</li>
        <li><strong>Success Response (200)</strong>:
<pre><code>{
  "completedMaterialIds": [101, 102]
}</code></pre>
        </li>
      </ul>

      <h3><span class="method-post">POST</span> <span class="endpoint">/api/modules/:moduleId/materials/:materialId/complete</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>User</code></li>
        <li><strong>Deskripsi</strong>: Menandai materi sebagai selesai untuk pengguna yang sedang login.</li>
        <li><strong>Request Body</strong>: (Tidak ada)</li>
        <li><strong>Success Response (201)</strong>: <pre><code>{ "message": "Material marked as complete." }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>404 Not Found</code></li>
      </ul>

      <h2>&#128736;&#65039; 5. User Management (Manajemen Pengguna)</h2>
      <p>Rute khusus untuk Super Admin mengelola pengguna.</p>

      <h3><span class="method-get">GET</span> <span class="endpoint">/api/users</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Super Admin</code></li>
        <li><strong>Deskripsi</strong>: Mendapatkan daftar semua pengguna.</li>
        <li><strong>Success Response (200)</strong>: <pre><code>[ { "id": 1, "username": "...", "role": "user" }, ... ]</code></pre></li>
      </ul>

      <h3><span class="method-put">PUT</span> <span class="endpoint">/api/users/:id/role</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Super Admin</code></li>
        <li><strong>Deskripsi</strong>: Mengubah role pengguna menjadi <code>teacher</code>. Saat ini hanya mendukung perubahan ke "teacher".</li>
        <li><strong>Request Body</strong> (<code>application/json</code>):
<pre><code>{
  "role": "teacher"
}</code></pre>
        </li>
        <li><strong>Success Response (200)</strong>: <pre><code>{ "message": "User role updated successfully" }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>400 Bad Request</code> (jika role bukan "teacher"), <code>404 Not Found</code></li>
      </ul>

      <h3><span class="method-delete">DELETE</span> <span class="endpoint">/api/users/:id</span></h3>
      <ul>
        <li><strong>Akses</strong>: <code>Super Admin</code></li>
        <li><strong>Deskripsi</strong>: Menghapus pengguna. Super Admin tidak bisa menghapus akunnya sendiri.</li>
        <li><strong>Success Response (200)</strong>: <pre><code>{ "message": "User deleted successfully" }</code></pre></li>
        <li><strong>Error Responses</strong>: <code>400 Bad Request</code> (jika hapus diri sendiri), <code>404 Not Found</code></li>
      </ul>

    </body>
  </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(documentationHtml);
});

db.getConnection()
  .then(connection => {
    console.log('Database connected successfully!');
    connection.release();
  })
  .catch(error => {
    console.error('Error connecting to database:', error);
  });


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the LMS Petani Backend API. Access documentation or API routes under /api/.' });
});