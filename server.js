const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// 在 Nginx 反向代理架構下，CORS 其實不是必須的，但保留無妨
app.use(cors());
app.use(express.json());

// 設定 PostgreSQL 連線
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'edlp_db',
  password: 'your_password_here',
  port: 5432,
});

// API路由前綴統一加上 /api，方便 Nginx 識別轉發
const router = express.Router();

// 測試連線
pool.connect((err) => {
  if (err) console.error('資料庫連線失敗:', err.stack);
  else console.log('已連線到 PostgreSQL');
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
    console.error(err);
    res.status(500).json({ error: 'DB Error' });
  }
});

// 2. 新增資料
router.post('/submit', async (req, res) => {
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
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Write Error' });
  }
});

// 3. 清空資料
router.delete('/clear', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE edlp_responses');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Clear Error' });
  }
});

// 掛載路由到 /api
app.use('/api', router);

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
