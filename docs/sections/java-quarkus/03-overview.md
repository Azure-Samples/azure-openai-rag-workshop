## Overview of the project

The project template you've forked is a monorepo, which means it's a single repository that houses multiple projects. Here's how it's organized, focusing on the key files and directories:

```sh
.devcontainer/  # Configuration for the development container
data/           # Sample PDFs to serve as custom data
infra/          # Templates and scripts for Docker and Azure infrastructure
scripts/        # Utility scripts for document ingestion
src/            # Source code for the application's services
├── backend/    # The Chat API developed with Quarkus
├── frontend/   # The Chat website
├── ingestion/  # The service for document ingestion developed with Quarkus
pom.xml         # Main Maven parent POM
.env            # File that you created for environment variables
```

We're using Java and Quarkus for our APIs and Node.js for our website, and have set up a Maven parent POM to manage dependencies across all projects from a single place. Running `mvn install` at the root installs dependencies for all backend projects ( `npm install` for the frontend), simplifying monorepo management.

Otherwise, you can use your regular `mvn` commands in any project folder and it will work as usual.

### About the services

We generated the base code of our differents services with the respective CLI or generator of the frameworks we'll be using, and we've pre-written several service components so you can jump straight into the most interesting parts.

### The Chat API specification

Creating a chat-like experience requires two main components: a user interface and a service API. The [ChatBootAI OpenAPI specification](https://editor.swagger.io/?url=https://raw.githubusercontent.com/ChatBootAI/chatbootai-openapi/main/openapi/openapi-chatbootai.yml) standardizes their interactions. This standardization allows for the development of different client applications (like mobile apps) that can interact seamlessly with chat services written in various programming languages.

#### The Chat request

A chat request is sent in JSON format, and must contain at least the user's message. Other optional parameters include a flag indicating if the response should be streamed, context-specific options that can tailor the chat service's behavior and a session state object that can be used to maintain state between requests.

```json
{
  "messages": [
    {
      "content": "Can I do some Scuba diving?",
      "role": "user"
    }
  ],
  "stream": false,
  "context": { ... },
  "session_state": null
}
```

#### The chat response

The chat service responds with a JSON object representing the generated response. The answer is located under the message's `content` property.

```json
{
  "choices": [
    {
      "index": 0,
      "message": {
        "content": "There is no information available about Scuba diving in the provided sources.",
        "role": "assistant",
        "context": { ... }
      }
    }
  ],
}
```

You can learn more about the [ChatBootAI OpenAPI specification here](https://editor.swagger.io/?url=https://raw.githubusercontent.com/ChatBootAI/chatbootai-openapi/main/openapi/openapi-chatbootai.yml) and on [the GitHub repo](https://github.com/ChatBootAI/chatbootai-openapi).

<div class="info" data-title="note">

> If streaming is enabled, the response will be a stream of JSON objects, each representing a chunk of the response. This format allows for a dynamic and real-time messaging experience, as each chunk can be sent and rendered as soon as it's ready. In that case, the response format follows the [Newline Delimited JSON (NDJSON)](https://github.com/ndjson/ndjson-spec) specification, which is a convenient way of sending structured data that may be processed one record at a time.

</div>
