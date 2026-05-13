const axios = require('axios');

exports.getPrayerTimes = async (req, res) => {
  try {
    const { lat, lng, city, country, method = 2 } = req.query; // Method 2: ISNA
    let url;

    if (lat && lng) {
      url = `http://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}`;
    } else if (city && country) {
      url = `http://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
    } else {
      return res.status(400).json({ error: 'Please provide either lat/lng or city/country' });
    }

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    res.status(500).json({ error: 'Failed to fetch prayer times' });
  }
};

exports.getQibla = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Please provide lat and lng' });
    }

    const url = `http://api.aladhan.com/v1/qibla/${lat}/${lng}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching qibla direction:', error);
    res.status(500).json({ error: 'Failed to fetch qibla direction' });
  }
};
