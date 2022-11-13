import * as express from "express";
import http from 'http';
import { readFile } from "fs/promises";
import { updateIFSConsignment } from "./components/App.Pack";
import * as config from './webapp-config.json';

const certificate = {
    key:  await readFile('privatekey.pem'),
    cert: await readFile('cert.pem')
};

const app = express();

app.use(express.json());

app.post('/api/UpdateIFS', updateIFSConsignment);

http.createServer(certificate, app)
    .listen(443, config.hostname, () => console.log('Server listening listening...'))