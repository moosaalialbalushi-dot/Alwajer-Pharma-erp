Local Ollama setup (brief)

1. Install Ollama (https://ollama.com/docs/installation) for your OS.
2. Start Ollama daemon locally:

```bash
ollama daemon
```

3. Pull or add the models you want locally, for example:

```bash
ollama pull ggml/llama2:7b
ollama pull some/vision-model
```

4. To test the proxy in this repo, run the dev server and call `/api/ollama-proxy` with JSON:

```json
{ "model": "gpt4o-mini", "prompt": "Summarize this document" }
```

Notes and troubleshooting:
- The repo provides a minimal proxy at `/api/ollama-proxy` which assumes Ollama is accessible at `http://127.0.0.1:11434`.
- If you hit connection errors, ensure `ollama daemon` is running and that your environment allows localhost connections.
- For production, secure the proxy (auth, rate limits) and consider running Ollama on a dedicated host or private network.
