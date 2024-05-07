## Chat website

Now that we have our Chat API, it's time to build the website that will use.
Notice that you don't have to develop the frontend part, it's already done for you. But you need to build it and, of course, if you want to understand how it works, you can follow the instructions below.

### Introducing Vite and Lit

We use [Vite](https://vitejs.dev/) as a frontend build tool, and [Lit](https://lit.dev/) as a Web components library.

This frontend is built as a Single Page Application (SPA), which is similar to the well-known ChatGPT website. The main difference is that it will get its data from the Chat API that we described in the previous section.
To get the frontend, run this command in the terminal **at the root of the project** to get the completed code directly, so you don't have to code it yourself:

```bash
curl -fsSL https://github.com/Azure-Samples/azure-openai-rag-workshop/releases/download/latest/frontend.tar.gz | tar -xvz
```

As you can see, the project is available in the `src/frontend` folder. From the project directory, you can run this command to start the development server:

```bash
cd src/frontend
npm run dev
```

This will start the application in development mode. Open [http://localhost:8000](http://localhost:8000) to view it in the browser.

<div class="tip" data-title="tip">

> In Codespaces, once the servce is running, you can click on the **Open in browser** button when prompted.
> You can also select the **Ports** tab in the bottom panel, right click on the URL in the **Forwarded Address** column next to the `8000` port, and select **Open in browser**.

</div>

<div class="tip" data-title="Tip">

> In development mode, the Web page will automatically reload when you make any change to the code. We recommend you to keep this command running in the background, and then have two windows side-by-side: one with your IDE where you will edit the code, and one with your Web browser where you can see the final result.

</div>

### Testing the completed website

Now that you've downloaded the code and built the frontend, let's test the entire application. For that, you need to make sure that your Qdrant database and chat backend are running, as well as the chat website:

Run these commands from the project root if you need to restart the backend services:

```bash
docker compose up qdrant

cd src/backend
./mvnw quarkus:dev

cd src/frontend
npm run dev
```

Now go back to your browser at http://localhost:8000, and send a question to the chatbot. You should see the answer appear in the chat window.

![Screenshot of the chatbot answer](./assets/chatbot-answer.png)
