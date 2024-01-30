<div class="info" data-title="Skip notice">

> If you want to skip the Dockerfile implementation and jump directly to the next section, run this command in the terminal **at the root of the project** to get the completed code directly:
> ```bash
> curl -fsSL https://github.com/Azure-Samples/azure-openai-rag-workshop/releases/download/latest/backend-dockerfile-aisearch.tar.gz | tar -xvz
> ```

<div>

## Create the Dockerfile

We're almost done, it's time to containerize our API! Containers are a great way to package and deploy applications, as they allow us to isolate the application from the host environment, and to run it in any environment, from a developer's laptop to a cloud provider.

Since our Chat API have a **build** step to compile the TypeScript code to JavaScript, we'll use the [multi-stage](https://docs.docker.com/build/building/multi-stage/) feature of Docker to build our API and create a smaller container image, while keeping our Dockerfile readable and maintainable.

### Defining the build stage

Let's create a file `Dockerfile` under the `src/backend` folder to build a Docker image for our API:

```dockerfile
# syntax=docker/dockerfile:1

# Build Node.js app
# ------------------------------------
FROM node:20-alpine as build
WORKDIR /app
COPY ./package*.json ./
COPY ./src/backend ./src/backend
RUN npm ci --cache /tmp/empty-cache
RUN npm run build --workspace=backend
```

The first statement `FROM node:20-alpine` means that we use the [node image](https://hub.docker.com/_/node) as a base, with Node.js 20 installed. The `alpine` variant is a lightweight version of the image, that results in a smaller container size, which is great for production environments. With the `as build` statement, we're naming this stage `build`, so we can reference it later.

After that, we are specifying our work directory with `WORKDIR /app`. We then need to copy our project files to the container. Because we are using NPM workspaces, it's not enough to copy the `./src/backend` folder, we also need to copy the root `package.json` file and more importantly the `package-lock.json` file, to make sure that the dependencies are installed in the same version as in our local environment.

Then we run the `npm ci` command. The `--cache /tmp/empty-cache` tells NPM to use an empty cache folder, to avoid saving the download cache in the container. This is not strictly necessary, but it's a good practice to avoid making our container bigger than necessary.

Finally we run the `npm run build` command to build the api. Since we're in an NPM workspace, we need to specify the workspace we want to build with the `--workspace=backend` option.

### Creating the final image

Now we can create the second stage of our Dockerfile, that will be used to create the final Docker image. Add the following code after the first stage:

```dockerfile
# Run Node.js app
# ------------------------------------
FROM node:20-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY ./package*.json ./
COPY ./src/backend/package.json ./src/backend/
RUN npm ci --omit=dev --workspace=backend --cache /tmp/empty-cache
COPY --from=build app/src/backend/dist src/backend/dist
EXPOSE 3000
CMD [ "npm", "start", "--workspace=backend" ]
```

This stage is very similar to the first one, with few differences:

- The second statement `ENV NODE_ENV=production` sets the `NODE_ENV` environment variable to `production`. This is a convention in the Node.js ecosystem to indicate that the app is running in production mode. It enables production optimizations in most frameworks.
- We're not copying the whole `src/backend` folder this time, but only the `package.json file`. We need this file to install the dependencies, but we don't need to copy the source code.
- We're using the `--omit=dev` option of the `npm ci` command to only install the production dependencies, as we don't need the development dependencies in our final Docker image.
- We're copying the compiled code from the first stage using the `--from=build` option of the `COPY` instruction. This will copy the compiled code from the `build` stage to our final Docker image.

Finally we tell Docker to expose port `3000`, and run the `npm start --workspace=backend` command when the container starts.

With this setup, Docker will first create a container to build our app, and then create a second container where we copy the compiled app code from the first container to create the final Docker image.

### Build our Docker image

You can now test if the Docker image builds correctly. First, let's have a look at the commands to build and run the Docker image in our `src/backend/package.json` file:

```json
{
  "scripts": {
    "docker:build": "docker build --tag backend --file ./Dockerfile ../..",
    "docker:run": "docker run --rm --publish 3000:3000 --env-file ../../.env backend",
  },
}
```

Then we can build the image by running this command from the `backend` folder:

```bash
npm run docker:build
```

If the build is successful, you can continue to the next section. If you have an error, make sure that you did not miss a section in your Dockerfile, and that your backend code compiles correctly.

After that, commit the changes to the repository to keep track of your progress.

<div class="info" data-title="note">

> If you try to run the image with `npm run docker:run`, you will get an error as the `@azure/identity` SDK cannot automatically authenticate in a local container.
> There are several ways to fix this, the easiest one would be to create a [Service Principal](https://learn.microsoft.com/entra/identity-platform/howto-create-service-principal-portal), assign it the needed permissions, and pass the environment variables to the container. However, this goes beyond the scope of this workshop, so we'll skip this step for now.

</div>
