## Conclusion

This is the end of the workshop. We hope you enjoyed it, learned something new and more importantly, that you'll be able to take this knowledge back to your projects.

If you missed any of the steps or would like to check your final code, you can run this command in the terminal at the root of the project to get the completed solution (be sure to commit your code first!):

```bash
curl -fsSL https://github.com/Azure-Samples/azure-openai-rag-workshop/releases/download/latest/solution.tar.gz | tar -xvz
```

<div class="warning" data-title="had issues?">

> If you experienced any issues during the workshop, please let us know by [creating an issue](https://github.com/Azure-Samples/azure-openai-rag-workshop/issues) on the GitHub repository.

</div>

### Cleaning up Azure resources

<div class="important" data-title="important">

> Don't forget to delete the Azure resources once you are done running the workshop, to avoid incurring unnecessary costs!

</div>

To delete the Azure resources, you can run this command:

```bash
azd down --purge
```

### Going further

This workshop is based on the enterprise-ready sample **ChatGPT + Enterprise data with Azure OpenAI and AI Search**:

- [JavaScript version](https://github.com/Azure-Samples/azure-search-openai-javascript)
- [Python version](https://github.com/Azure-Samples/azure-search-openai-demo/)
- [Java version](https://github.com/Azure-Samples/azure-search-openai-demo-java)
- [C# version](https://github.com/Azure-Samples/azure-search-openai-demo-csharp)
- [Serverless JavaScript version](https://github.com/Azure-Samples/serverless-chat-langchainjs)

If you want to go further with more advanced use-cases, authentication, history and more, you should check it out!

### References

- This workshop URL: [aka.ms/ws/openai-rag](https://aka.ms/ws/openai-rag)
- The source repository for this workshop: [GitHub link](https://github.com/Azure-Samples/azure-openai-rag-workshop/tree/base)
- The base template for this workshop: [GitHub link](https://github.com/Azure-Samples/azure-openai-rag-workshop)
- If something does not work: [Report an issue](https://github.com/Azure-Samples/azure-openai-rag-workshop/issues)
- Introduction presentation for this workshop: [Slides](https://azure-samples.github.io/azure-openai-rag-workshop/)
- Outperforming vector search performance with hybrid retrieval and semantic ranking: [Blog post](https://techcommunity.microsoft.com/t5/ai-azure-ai-services-blog/azure-ai-search-outperforming-vector-search-with-hybrid/ba-p/3929167)
