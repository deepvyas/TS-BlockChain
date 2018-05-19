import * as bodyParser from 'body-parser';
import * as express from 'express';

import {Block, BlockChain, getGenesisBlock,isChainValid} from './block';
const httpPort: number = parseInt(process.env.HTTP_PORT) || 8080;
const wsPort: number = parseInt(process.env.P2P_PORT) || 8002;

const initHTTPServer = (httpPort:number) => {
  const app = express();
  app.use(bodyParser.json());

  const genesisBlock = getGenesisBlock();
  const _blockChain = new BlockChain(genesisBlock);
  app.get('/blocks', (req,res) => {
    res.send(_blockChain.getChain());
  });

  app.post('/mineBlock', (req,res) => {
    const block:Block = _blockChain.generateNewBlock(req.body.data);
    res.send(block);
  });

  app.listen(httpPort, () => {
    console.log("HTTP Server up and Listening on : "+ httpPort);
  });
};



initHTTPServer(httpPort);
//initWSServer(wsPort);
