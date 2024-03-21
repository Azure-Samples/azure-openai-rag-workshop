// This config is here because there is already an index in META-INF/resources/index.html
// If you want this as the index, remove META-INF/resources/
// Then you can remove this config file and rename quinoa.html to index.html
import { resolve } from 'path'
import { defineConfig } from 'vite'
import express from 'express'

const app = express()
app.get('/', (req, res) => {
    res.send('Allow detection by Quinoa').end();
})

function expressPlugin() {
    return {
        name: 'express-plugin',
        configureServer(server) {
            server.middlewares.use(app);
        }
    }
}

export default defineConfig({
    plugins: [expressPlugin()],
    build: {
        rollupOptions: {
            input: {
                quinoa: resolve(__dirname, 'quinoa.html'),
            },
        },
    },
})