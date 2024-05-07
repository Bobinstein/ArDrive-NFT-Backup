import fs from "fs";
import path from "path";

export default async function parseJSON(manifestTxId) {
  function loadMetadata() {
    const rawData = fs.readFileSync("originalJSON/metadata_backup.json");
    return JSON.parse(rawData);
  }

  // Function to save each object to a new JSON file
  function saveIndividualFiles(data) {
    data.forEach((item) => {
      const number = parseInt(item.id, 10);
      if (!isNaN(number) && number <= 520) {
        const filename = `./metadata/${number}.json`;
        fs.writeFileSync(filename, JSON.stringify(item, null, 2)); // Pretty print JSON
        console.log(`Saved file: ${filename}`);
      }
    });
  }

  // Function to update the 'image' field for all items dynamically based on the number
  function updateImages(data) {
    data.forEach((item) => {
      const number = parseInt(item.id, 10); // Convert string to integer, base 10
      if (!isNaN(number) && number <= 520) {
        // Check if it's a valid number and within the desired range
        // Update the image URL. Modify this line as necessary to fit your specific URL format or requirements.
        item.image = `ar://${manifestTxId}/${number}.png`;
        console.log(`Updated image for ${item.name} to ${item.image}`);
      }
    });
  }

  const metadata = loadMetadata();

  // Update image links before saving files
  updateImages(metadata);

  // Save updated data to individual files
  saveIndividualFiles(metadata);
}
