import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

export async function downloadFile(url, filePath) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await pipeline(response.body, fs.createWriteStream(filePath));
    // console.log(`File downloaded successfully to ${filePath}`);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
}
