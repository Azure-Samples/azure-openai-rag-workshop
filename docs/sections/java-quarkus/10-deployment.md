## Deploying to Azure

Our application is now ready to be deployed to Azure!

We'll use [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview) to deploy the frontend, and [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/overview) to deploy the backend and indexer services.

Run this command from the root of the project to build and deploy the application:

```bash
azd deploy
```

Once everything is deployed, run the ingestion process against your deployed indexer service, using `./scripts/index-data.sh` script on Linux or macOS, or `./scripts/index-data.ps1` on Windows:

```bash
./scripts/index-data.sh
```

This process should take a few minutes. Once it's done, you should see the URL of the deployed frontend application in the output of the command.

![Output of the azd command](./assets/azd-deploy-output.png)

You can now open this URL in a browser and test the deployed application.

![Screenshot of the deployed application](./assets/deployed-app.png)

<div class="tip" data-title="Tip">

> You can also build and deploy the services separately by running `azd deploy <service_name>`. This allows you to deploy independently the backend, frontend and indexer services if needed.
>
> Even better! If you're starting from scratch and have a completed code, you can use the `azd up` command. This command combines both `azd provision` and `azd deploy` to provision the Azure resources and deploy the application in one command.

</div>
