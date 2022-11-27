import express from "express";
import http from 'http';
import helmet from "helmet";
import { updateIFSConsignment } from "./components/App.Pack.mjs";
import { buildValidateClient, buildValidateFunctionKey, removeHeaders } from "./components/Api.Middleware.mjs";
import * as config from './webapp-config.json' assert { type: 'json' };

const validateClient = buildValidateClient();
const validateFunctionKey = buildValidateFunctionKey(config.functionKey);

const app = express();

app.use(helmet());
app.use(express.json());
app.use(removeHeaders);

app.get('/', (req, res) => res.send({ message: 'ok' }));

app.post('/api/UpdateConsignment', validateClient, validateFunctionKey, updateIFSConsignment);

http.createServer({}, app).listen(80, config.hostname, () => console.log('Server listening...'))