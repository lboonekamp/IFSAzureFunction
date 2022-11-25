import express from "express";
import http from 'http';
import { updateIFSConsignment } from "./components/App.Pack.mjs";
import * as config from './webapp-config.json' assert { type: 'json' };

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    next()
})

app.get('/', (req, res) => res.send({ message: 'ok' }));

app.post('/api/UpdateConsignment', updateIFSConsignment);

http.createServer({}, app).listen(80, config.hostname, () => console.log('Server listening listening...'))