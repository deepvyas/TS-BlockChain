import * as ws from 'ws';
import {Server} from 'ws';

import {Block, BlockChain} from './block';
const sockets: ws[] = [];

let _blockChain:BlockChain;

enum MessageCodes {
  QUERY_LATEST_BLOCK = 0,
  QUERY_ALL_BLOCKS = 1,
  RESPONSE_BLOCK_CHAIN = 2
}

class Message {
  public code: MessageCodes;
  public data: any;
}

const initWSServer = (wsPort:number, bc:BlockChain) => {
  _blockChain = bc;
  const server: Server = new ws.Server({port:wsPort});
  server.on('connection', (ws: ws) => {
    handleConnection(ws);
  });
  console.log("Websocket up and listening on: "+ wsPort);
}

const getSockets = () => sockets;

const handleConnection = (ws: ws) => {
  sockets.push(ws);
  initMessageHandler(ws);
  initErrorHandler(ws);
  send(ws,queryLatestBlockMessage());
}

const initMessageHandler = (ws: ws) => {
  ws.on('message', (data: string) => {
    const message: Message = getObject<Message>(data);
    if (message === null) {
      console.log('could not parse received JSON message: ' + data);
      return;
    }
    switch(message.code) {
      case MessageCodes.QUERY_LATEST_BLOCK:
        send(ws, responseLatestBlockMessage());
        break;
      case MessageCodes.QUERY_ALL_BLOCKS:
        send(ws, responseBlockChainMessage());
        break;
      case MessageCodes.RESPONSE_BLOCK_CHAIN:
        const recvChain: Block[] = getObject<Block[]>(message.data);
        if (recvChain === null) {
          console.log('invalid blocks received:');
          console.log(message.data)
          break;
        }
        handleBlockchainResponse(recvChain);
        break;
    }
  });
}

const initErrorHandler = (ws: ws) => {
    const closeConnection = (ws: ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

const send = (ws: ws, message:Message): void => ws.send(JSON.stringify(message));
const broadcast = (message: Message): void => sockets.forEach((socket: ws) => send(socket, message));

const queryAllMsg = (): Message => ({'code': MessageCodes.QUERY_ALL_BLOCKS, 'data':null});
const queryLatestBlockMessage = (): Message => ({'code': MessageCodes.QUERY_LATEST_BLOCK,'data':null});
const responseLatestBlockMessage = (): Message => ({
  'code': MessageCodes.RESPONSE_BLOCK_CHAIN,'data':JSON.stringify([_blockChain.getLatestBlock()])
});

const responseBlockChainMessage = (): Message => ({
  'code':MessageCodes.RESPONSE_BLOCK_CHAIN,'data':JSON.stringify(_blockChain.getChain())
});

const handleBlockchainResponse = (newChain: Block[]) => {
  if(newChain.length == 0 ){
    console.log('received block chain size of 0');
    return;
  }
  const latestBlockrecv: Block = newChain[newChain.length - 1];
  const latestBlockCurr: Block = _blockChain.getLatestBlock();
  if(!BlockChain.isBlockStructureValid(latestBlockrecv)){
    console.log('block structuture not valid');
    return;
  }
  if(latestBlockCurr.index < latestBlockrecv.index) {
    console.log('blockchain possibly behind. We got: '
            + latestBlockCurr.index + ' Peer got: ' + latestBlockrecv.index);

    if(latestBlockCurr.hash === latestBlockrecv.prevHash) {
      if(_blockChain.addBlock(latestBlockrecv)) {
        broadcast(responseLatestBlockMessage());
      }
      else if(newChain.length == 1){
        console.log('We have to query the chain from our peer');
        broadcast(queryAllMsg());
      }
      else {
        console.log('Received blockchain is longer than current blockchain');
        _blockChain.replaceChain(newChain);
      }
    }
  }
  else {
    console.log('received blockchain is not longer than received blockchain. Do nothing');
  }

};

const broadcastLatest = (): void => {
  broadcast(responseLatestBlockMessage());
};

const connectToPeer = (peerAdd: string): void => {
  const socket: ws = new ws(peerAdd);
  socket.on('open', () => {
    handleConnection(socket);
  });

  socket.on('error', () => {
    console.log('connection to peer: '+ peerAdd + " failed.");
  });
};

const getObject = <T>(data: string): T => {
  try{
    return JSON.parse(data);
  } catch(e) {
    console.log(e);
    return null;
  }
};

export {connectToPeer,initWSServer,broadcastLatest,getSockets};
