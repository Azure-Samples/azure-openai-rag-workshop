## Deploying to Azure

Our application is now ready to be deployed to Azure! But first of all, make sure you don't deploy the application with the llama3 model. For that, make sure to remove or comment the alternative from the `src/backend/src/main/resources/application.properties` file.

```properties
quarkus.http.port=3000
quarkus.log.level=INFO
quarkus.log.category."ai.azure.openai.rag.workshop.backend".level=DEBUG
#quarkus.arc.selected-alternatives=ai.azure.openai.rag.workshop.backend.configuration.ChatLanguageModelOllamaProducer
```

We'll use [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview) to deploy the frontend, and [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/overview) to deploy the backend and ingestion services.

Run this command from the root of the project to build and deploy the application (this command deploys all services listed in the `azure.yaml` file located in the project root):

```bash
azd deploy
```

Once everything is deployed, run the ingestion process against your deployed ingestion service, using `./scripts/ingest-data.sh` script on Linux or macOS, or `./scripts/ingest-data.ps1` on Windows:

```bash
./scripts/ingest-data.sh
```

This process should take a few minutes. Once it's done, you should see the URL of the deployed frontend application in the output of the command.

![Output of the azd command](./assets/azd-deploy-output.png)

You can now open this URL in a browser and test the deployed application.

![Screenshot of the deployed application](./assets/deployed-app.png)

<div class="tip" data-title="Tip">

> You can also build and deploy the services separately by running `azd deploy <service_name>`. This allows you to deploy independently the backend, frontend and ingestion services if needed.
>
> Even better! If you're starting from scratch and have a completed code, you can use the `azd up` command. This command combines both `azd provision` and `azd deploy` to provision the Azure resources and deploy the application in one command.

</div>
