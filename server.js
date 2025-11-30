const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// 在 Nginx 反向代理架構下，CORS 其實不是必須的，但保留無妨
app.use(cors());
app.use(express.json());

// 設定 PostgreSQL 連線
// ⚠️ 請務必修改為您實際的資料庫密碼
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'edlp_db',
  password: 'your_password_here', // <--- 🔴 務必確認這裡的密碼已修改為正確密碼
  port: 5432,
});

// API路由前綴統一加上 /api，方便 Nginx 識別轉發
const router = express.Router();

// 測試連線
pool.connect((err) => {
  if (err) console.error('資料庫連線失敗 (啟動時檢查):', err.stack);
  else console.log('已成功連線到 PostgreSQL 資料庫');
});

// 1. 獲取資料
router.get('/records', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM edlp_responses ORDER BY created_at DESC');
    const formattedData = result.rows.map(row => ({
      id: row.id,
      submitterName: row.submitter_name,
      submitterRole: row.submitter_role,
      office: row.office,
      blacklist: row.blacklist,
      whitelist: row.whitelist,
      sender: row.sender,
      keywords: row.keywords,
      attachment: row.attachment,
      sourcecode: row.sourcecode,
      dedup: row.dedup,
      approval: row.approval,
      cc: row.cc,
      bcc: row.bcc,
      timestamp: new Date(row.created_at).toLocaleString()
    }));
    res.json(formattedData);
  } catch (err) {
    console.error('讀取錯誤:', err);
    // 回傳詳細錯誤給前端以便除錯
    res.status(500).json({ error: err.message });
  }
});

// 2. 新增資料
router.post('/submit', async (req, res) => {
  console.log('收到寫入請求:', req.body); // 🖨️ 印出收到的資料，確認前端有送出內容

  const data = req.body;
  const query = `
    INSERT INTO edlp_responses 
    (submitter_name, submitter_role, office, blacklist, whitelist, sender, keywords, attachment, sourcecode, dedup, approval, cc, bcc)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id
  `;
  const values = [
    data.submitterName, data.submitterRole, data.office, data.blacklist, 
    data.whitelist, data.sender, data.keywords, data.attachment, 
    data.sourcecode, data.dedup, data.approval, data.cc, data.bcc
  ];

  try {
    const result = await pool.query(query, values);
    console.log('寫入成功，ID:', result.rows[0].id);
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('寫入錯誤:', err); // ❌ 這裡會在 PM2 logs 顯示詳細錯誤
    // 回傳詳細錯誤給前端以便除錯
    res.status(500).json({ error: `資料庫錯誤: ${err.message}` });
  }
});

// 3. 清空資料
router.delete('/clear', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE edlp_responses');
    res.json({ success: true });
  } catch (err) {
    console.error('清空錯誤:', err);
    res.status(500).json({ error: err.message });
  }
});

// 掛載路由到 /api
app.use('/api', router);

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
