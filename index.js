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
    const dst = ".";

    await client.connect(config);

    client.on("upload", (info) => {
      core.info(`Listener: Uploaded ${info.source}`);
    });

    const res = await client.uploadDir(src, dst);
    client.end();

    core.info("Deploy finished:", res);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
