import * as express from "express";
import { updateIFSConsignment } from "./components/App.Pack";

const server = express();

server.use(express.json());

server.post('/api/UpdateIFS', updateIFSConsignment);

server.listen(3000, () => console.log('Server listening on port 3000...'))