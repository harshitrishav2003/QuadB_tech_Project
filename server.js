const express = require('express');
const axios = require('axios');
const cors = require('cors');
const pool = require('./db'); 

const app = express();
const port = 3000;

app.use(express.static('public'));
 

app.use(cors());


app.get('/fetch-and-store', async (req, res) => {
  try {
   
    const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
    const tickers = response.data;
    const top10 = Object.values(tickers).slice(0, 10); 

    const client = await pool.connect(); 
    await client.query('BEGIN'); 
    
    await client.query('DELETE FROM tickers');

    
    for (let ticker of top10) {
      await client.query(
        'INSERT INTO tickers (name, last, buy, sell, volume, base_unit) VALUES ($1, $2, $3, $4, $5, $6)',
        [ticker.name, ticker.last, ticker.buy, ticker.sell, ticker.volume, ticker.base_unit]
      );
    }

    await client.query('COMMIT'); 
    client.release(); 

    res.send('Data fetched and stored successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching and storing data');
  }
});

// Route to get data from the database
app.get('/tickers', async (req, res) => {
  try {
    const client = await pool.connect(); 
    const result = await client.query('SELECT * FROM tickers'); 
    client.release(); 

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
