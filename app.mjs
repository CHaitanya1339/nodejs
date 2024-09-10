import fetch from 'node-fetch';
import geotiff from 'geotiff';
import geokeysToProj4 from 'geotiff-geokeys-to-proj4';
import proj4 from 'proj4';
import express from 'express';
import Tiff from 'tiff.js';
const app = express();
const port = 3000;
import fs from 'fs';
// Google Cloud API key (replace with your actual API key)
const apiKey = 'AIzaSyBgBzxUb1STGGRI4gMGooODJYRVG_yUK9o';

/**
 * Downloads the pixel values for a Data Layer URL from the Solar API.
 *
 * @param  {string} url        URL from the Data Layers response.
 * @param  {string} apiKey     Google Cloud API key.
 * @return {Promise<Object>}   Pixel values with shape and lat/lon bounds.
 */
async function downloadGeoTIFF(url, apiKey) {
  console.log(`Downloading data layer: ${url}`);

  // Include your Google Cloud API key in the Data Layers URL if necessary
  const solarUrl = url.includes('solar.googleapis.com') ? `${url}&key=${apiKey}` : url;
  
  // Fetch the GeoTIFF data
  const response = await fetch(solarUrl);

  if (response.status !== 200) {
    const error = await response.json();
    console.error(`downloadGeoTIFF failed: ${url}\n`, error);
    throw new Error('Failed to download GeoTIFF');
  }

  // Get the GeoTIFF as an array buffer
  const arrayBuffer = await response.arrayBuffer();
  console.log("ArrayBuffer received:", arrayBuffer);
  const outputPath = './downloaded.tiff'; // Path where the TIFF file will be saved
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  console.log(`TIFF file saved to ${outputPath}`);
  // Load the TIFF image using tiff.js
  const tiffImage = new Tiff({ buffer: arrayBuffer });
  console.log("TIFF Image loaded:", tiffImage);
  // Get image dimensions
  const width = tiffImage.width();
  const height = tiffImage.height();
  
  console.log(`TIFF Image: width = ${width}, height = ${height}`);

  // Convert TIFF to Canvas (optional, for visualization purposes)
  // const canvas = tiffImage.toCanvas(); // Uncomment if you need to render on canvas
  
  // Retrieve pixel data (assuming single-band TIFF for simplicity)
  const rasters = [];
  for (let i = 0; i < height; i++) {
    const row = [];
    for (let j = 0; j < width; j++) {
      row.push(tiffImage.getPixel(i, j));
    }
    rasters.push(row);
  }

  // Example bounding box logic, this may need adjustment depending on your projection
  const bounds = {
    north: 0, // Adjust according to your logic or data
    south: 0,
    east: 0,
    west: 0
  };

  return {
    width,
    height,
    rasters,
    bounds
  };
}

// Route to fetch GeoTIFF data
app.get('/fetch-geo-tiff', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const geoTiffData = await downloadGeoTIFF(url, apiKey);
    res.json(geoTiffData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GeoTIFF data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});