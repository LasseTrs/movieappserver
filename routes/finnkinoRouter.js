import express from 'express';
import axios from 'axios';
import xml2js from 'xml2js';
import cors from 'cors';

const app = express();

app.use(cors());

app.get('/theaters', async (req, res) => {
  try {
    const response = await axios.get('https://www.finnkino.fi/xml/TheatreAreas/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/xml',
      },
    });

    xml2js.parseString(response.data, (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        return res.status(500).json({ error: 'Error parsing XML' });
      }
      const theatreAreas = result.TheatreAreas.TheatreArea;
      let theatres = [];

      if (Array.isArray(theatreAreas)) {
        theatres = theatreAreas.map(area => ({
          id: area.ID[0],
          name: area.Name[0],
        }));
      } else if (theatreAreas) {
        theatres = [{
          id: theatreAreas.ID[0],
          name: theatreAreas.Name[0],
        }];
      } else {
        theatres = [];
      }

      res.json(theatres);
    });
  } catch (error) {
    console.error('Error fetching theater areas:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching theater areas' });
  }
});

app.get('/schedule', async (req, res) => {
  const { area, date } = req.query;

  if (!area || !date) {
    return res.status(400).json({ error: 'Area and date are required' });
  }

  try {
    const response = await axios.get(
      `https://www.finnkino.fi/xml/Schedule/?area=${encodeURIComponent(area)}&dt=${encodeURIComponent(date)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/xml',
        },
      }
    );

    xml2js.parseString(response.data, (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        return res.status(500).json({ error: 'Error parsing XML' });
      }

      const showsData = result.Schedule.Shows[0].Show;
      let schedules = [];

      if (Array.isArray(showsData)) {
        schedules = showsData.map(show => ({
          title: show.Title[0],
          eventTime: show.dttmShowStart[0],
        }));
      } else if (showsData) {
        // Handle case when there is only one show
        schedules = [{
          title: showsData.Title[0],
          eventTime: showsData.dttmShowStart[0],
        }];
      } else {
        // No shows available
        schedules = [];
      }

      res.json(schedules);
    });
  } catch (error) {
    console.error('Error fetching schedule:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching schedule' });
  }
});

export default app;