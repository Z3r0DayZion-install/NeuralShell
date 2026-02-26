import Docker from 'dockerode';

function inspectImage(docker, image) {
  return new Promise((resolve, reject) => {
    docker.getImage(image).inspect((err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function ping(docker) {
  return new Promise((resolve, reject) => {
    docker.ping((err, data) => (err ? reject(err) : resolve(data)));
  });
}

function pullImage(docker, image) {
  return new Promise((resolve, reject) => {
    docker.pull(image, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(
        stream,
        (err2, output) => (err2 ? reject(err2) : resolve(output)),
        (event) => {
          if (event.status) {
            const suffix = event.progress ? ` ${event.progress}` : '';
            console.log(`[pull] ${event.status}${suffix}`);
          }
        }
      );
    });
  });
}

async function main() {
  const docker = new Docker();
  const image = process.env.NS_SANDBOX_IMAGE || 'node:20-alpine';
  const allowPull =
    process.env.NS_SANDBOX_PREPARE_PULL !== '0' &&
    process.env.NS_SANDBOX_PREPARE_PULL !== 'false' &&
    process.env.NS_SANDBOX_PREPARE_PULL !== 'no';

  try {
    await ping(docker);
  } catch (err) {
    console.error('Docker is not reachable. Start Docker Desktop and retry.');
    console.error(String(err && err.message ? err.message : err));
    process.exit(1);
  }

  try {
    await inspectImage(docker, image);
    console.log(`[sandbox] image present: ${image}`);
    return;
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    const missing = msg.includes('No such image') || msg.includes('(HTTP code 404)');
    if (!missing) {
      console.error(`[sandbox] failed to inspect image: ${image}`);
      console.error(msg);
      process.exit(1);
    }

    if (!allowPull) {
      console.error(`[sandbox] image missing: ${image}`);
      console.error('Set NS_SANDBOX_PREPARE_PULL=1 or run `docker pull <image>` manually.');
      process.exit(1);
    }

    console.log(`[sandbox] pulling image: ${image}`);
    await pullImage(docker, image);
    console.log(`[sandbox] pulled: ${image}`);
  }
}

main().catch((err) => {
  console.error(String(err && err.stack ? err.stack : err));
  process.exit(1);
});
