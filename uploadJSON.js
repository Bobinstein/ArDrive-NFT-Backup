import fs from "fs";
import path from "path";
import { EID, wrapFileOrFolder } from "ardrive-core-js";
import "dotenv/config";

function countdownTimer() {
  return new Promise((resolve) => {
    let remainingTime = 30; // countdown starting from 30 seconds

    const interval = setInterval(() => {
      remainingTime -= 5;
      console.log(`${remainingTime} seconds remaining`);
    }, 5000); // decrease time every 5 seconds

    setTimeout(() => {
      clearInterval(interval); // stop the interval when countdown ends
      console.log("Continuing");
      resolve(); // Resolve the promise to continue execution
    }, 30000); // wait for 30 seconds before continuing
  });
}

export default async function uploadJSON(chosenDrive, arDrive) {
  const rootFolderID = chosenDrive.rootFolderId.entityId;
  console.log(rootFolderID);

  const folderList = await arDrive.listPublicFolder({
    folderId: rootFolderID,
    maxDepth: 1,
    includeRoot: true,
  });

//   console.log(folderList);

  let metadataFolderID = null; // Initialize the variable to store the folder ID

  for (const item of folderList) {
    if (
      item.entityType === "folder" &&
      item.name === process.env.METADATA_FOLDER_NAME
    ) {
      metadataFolderID = item.folderId.entityId;
      break; // Exit the loop as we've found the target folder
    }
  }

  // You can check if the metadataFolderID was set
  if (metadataFolderID) {
    console.log(`Found metadata folder with ID: ${metadataFolderID}`);
  } else {
    const metadataFolder = await arDrive.createPublicFolder({
      folderName: process.env.METADATA_FOLDER_NAME,
      parentFolderId: rootFolderID,
    });
    console.log(
      "New folder for Metadata was created, please wait a few seconds for it to propagate in the network"
    );
    await countdownTimer();
    metadataFolderID = metadataFolder.created[0].entityId.entityId;
  }

  console.log(metadataFolderID);

  const files = fs
    .readdirSync(path.join("./metadata"))
    .filter((file) => file.endsWith(".json"));

  const uploadResults = [];
  for (const file of files) {
    if (file === ".gitkeep") {
      continue;
    }
    const filePath = path.join("metadata", file);
    const wrappedFile = wrapFileOrFolder(filePath);

    const uploadResult = await arDrive.uploadAllEntities({
      entitiesToUpload: [
        {
          wrappedEntity: wrappedFile,
          destFolderId: EID(metadataFolderID),
        },
      ],
    });
    uploadResults.push(uploadResult.created.find((e) => e.type === "file"));
  }

//   console.log(uploadResults)
  const manifest = {
    manifest: "arweave/paths",
    version: "0.1.0",
    index: {
      path: "1",
    },
    paths: uploadResults.reduce((acc, file) => {
      const number = path.basename(file.entityName, ".json");
      acc[number] = { id: file.dataTxId };
      return acc;
    }, {}),
  };

  fs.writeFileSync("./manifest.json", JSON.stringify(manifest, null, 2));
  console.log("Arweave manifest created successfully.");

  const wrappedManifest = wrapFileOrFolder(
    "./manifest.json",
    "application/x.arweave-manifest+json"
  );
  const uploadedManifest = await arDrive.uploadAllEntities({
    entitiesToUpload: [
      {
        wrappedEntity: wrappedManifest,
        destFolderId: EID(metadataFolderID),
      },
    ],
  });
  console.log(
    `The new baseURI should be set to https://arweave.net/${uploadedManifest.created[0].dataTxId}/`
  );
}
