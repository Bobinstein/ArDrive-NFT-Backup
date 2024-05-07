import { readJWKFile, arDriveFactory, PrivateKeyData} from "ardrive-core-js";
const promptSync = (await import("prompt-sync")).default;
const prompt = promptSync();
import "dotenv/config";
import uploadImages from "./uploadImages.js";
import parseJSON from "./parse.js";
import uploadJSON from "./uploadJSON.js";

async function app() {
  const driveName = process.env.DRIVE_NAME;

  const wallet = readJWKFile("KeyFile.json");
  let arDrive
  if (process.env.USE_TURBO == "1")
{  arDrive = arDriveFactory({
    wallet: wallet,
    turboSettings: {},
    // dryRun: true,
  });}
  else {
    arDrive = arDriveFactory({
        wallet: wallet,
        // dryRun: true
    })
  }
  const address = await wallet.getAddress();

  const drives = await arDrive.getAllDrivesForAddress({
    address,
    privateKeyData: new PrivateKeyData({}),
  });
  let chosenDrive;

  for (let i = 0; i < drives.length; i++) {
    if (drives[i].name == driveName) {
      chosenDrive = drives[i];
      break;
    }
  }

  if (!chosenDrive) {
    const createDrive = prompt(
      `A public drive with the provided name was not found. Would you like to create one here? yes/no    `
    );
    if (createDrive.toLowerCase() == ("y" || "yes")) {
      console.log("creating drive");
      const newDrive = await arDrive.createPublicDrive({
        driveName: driveName,
      });

        const driveInfo = await arDrive.getPublicDrive({driveId: newDrive.created[0].entityId})

      chosenDrive = driveInfo;
      console.log("Drive created.");
    } else {
      console.log("Exiting");
      process.exit(0);
    }
  }

  if (!chosenDrive) {
    console.log("Something went wrong, exiting");
    process.exit(1);
  }


  if (process.env.UPLOAD_IMAGES == "1") {
    const imageManifest = await uploadImages(arDrive, chosenDrive);



    await parseJSON(imageManifest);

  } else if (process.env.IMAGE_MANIFEST != "Replace Me") {
    // console.log("image manifest option");
    await parseJSON(process.env.IMAGE_MANIFEST)
  } else {
    console.log("Exiting: Please specify an Image Manifest TxId or set UPLOAD_IMAGES in the .env file to 1");
    process.exit(0)
  }
  await uploadJSON(chosenDrive, arDrive)

}

app();
