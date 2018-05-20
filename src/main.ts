import * as bodyParser from 'body-parser';
import * as express from 'express';

import {Block, BlockChain, getGenesisBlock,isChainValid} from './block';
import {connectToPeer,initWSServer,broadcastLatest,getSockets} from './sockets'

const httpPort: number = parseInt(process.env.HTTP_PORT) || 8000;
const wsPort: number = parseInt(process.env.P2P_PORT) || 9000;

const genesisBlock = getGenesisBlock();
const _blockChain = new BlockChain(genesisBlock);

const initHTTPServer = (httpPort:number) => {
  const app = express();
  app.use(bodyParser.json());

  app.get('/blocks', (req,res) => {
    res.send(_blockChain.getChain());
  });

  app.post('/mineBlock', (req,res) => {
    const block:Block = _blockChain.generateNewBlock(req.body.data);
    res.send(block);
  });

  app.get('/peers', (req, res) => {
     res.send(getSockets().map((socket: any) => socket._socket.remoteAddress+ ":"+ socket._socket.remotePort));
  });

  app.post('/addPeer', (req, res) => {
    connectToPeer(req.body.peer);
    res.send();
  });

  app.listen(httpPort, () => {
    console.log("HTTP Server up and Listening on : "+ httpPort);
  });
};



initHTTPServer(httpPort);
initWSServer(wsPort, _blockChain);
