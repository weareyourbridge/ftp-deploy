const core = require("@actions/core");
const SftpClient = require("ssh2-sftp-client");

async function run() {
  try {
    core.info("Deploying...");

    const client = new SftpClient();

    const config = {
      host: core.getInput("host", { required: true }),
      username: core.getInput("username", { required: true }),
      password: core.getInput("password", { required: true }),
      port: core.getInput("port") || 22,
    };

    const src = core.getInput("local_folder") || "./dist";
    const dst = core.getInput("remote_folder") || "./website";

    await client.connect(config);

    client.on("upload", (info) => {
      core.info(`Listener: Uploaded ${info.source}`);
    });

    const baseFolderExists = await client.exists(dst);
    const uploadFolderExists = await client.exists(dst + "upload");
    core.info("Base folder exists: ", baseFolderExists);
    core.info("Upload folder exists: ", uploadFolderExists);

    if (!uploadFolderExists) {
      await client.mkdir(dst + "upload");
    }

    core.info("Upload folder is: ", dst + "upload");
    await client.uploadDir(src, dst + "upload");
    const oldVersion = await client.exists(dst + "/live");
    if (oldVersion) {
      await client.rmdir(dst + "/live", true);
    }
    await client.posixRename(dst + "upload", dst + "/live");
    client.end();

    core.info("Deploy finished");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
