import fs from "fs";
import path from "path";
import { wrapFileOrFolder, EID } from "ardrive-core-js";

export default async function uploadImages(ardrive, chosenDrive) {
  console.log("uploading images");
  const rootFolderID = chosenDrive.rootFolderId.entityId;

  function removeGitkeepFiles(folderToUpload) {
    folderToUpload.files = folderToUpload.files.filter((file) => {
      return !file.filePath.endsWith(".gitkeep");
    });
  }

  const wrappedImages = wrapFileOrFolder("./images");
  removeGitkeepFiles(wrappedImages);


  try {
    const uploadResults = await ardrive.uploadAllEntities({
      entitiesToUpload: [
        {
          wrappedEntity: wrappedImages,
          destFolderId: EID(rootFolderID),
        },
      ],
    });

    // console.log(uploadResults);
    const newFolderID = uploadResults.created[0].entityId.entityId
    // console.log(newFolderID)

    const manifestResults = await ardrive.uploadPublicManifest({
        // folderId: newFolderID,
        folderId: newFolderID,
        maxDepth: 2,
        destManifestName: "Image Manifest", 
        conflictResolution: "replace"
    })
    const ImageManifestId = manifestResults.created[0].dataTxId.transactionId
    // console.log(ImageManifestId)
    return ImageManifestId
    // console.log(manifestResults.created[0].dataTxId.transactionId)
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}
