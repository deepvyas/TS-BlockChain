import * as crypto from 'crypto-js';
import {broadcastLatest} from './sockets';

class Block {
  // public index: number;
  // public hash: string;
  // public prevHash: string;
  // public datetime: number;
  // public data: string;

  constructor(public index:number,public hash:string,public prevHash:string,public datetime:number,public data:string) {
    // this.index = index;
    // this.hash = this.hash;
    // this.prevHash = prevHash;
    // this.datetime = datetime;
    // this.data = data;
  }

  public calculateHash(): string {
    return crypto.SHA256(this.index + this.prevHash + this.datetime + this.data).toString();
  }
}

class BlockChain {
  public chain: Block[];
  constructor(genesisBlock: Block) {
    this.chain = [genesisBlock];
  }

  public getChain(): Block[] {
    return this.chain;
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  public addBlock(newBlock: Block): boolean {
    if(BlockChain.isValid(newBlock, this.getLatestBlock())) {
      this.chain.push(newBlock);
      return true;
    }
    return false;
  }

  public static isValid(newBlock: Block, prevBlock: Block): boolean {
    if(!BlockChain.isBlockStructureValid(newBlock)) {
      console.log("New Block not valid in structure.");
      return false;
    }
    else if(prevBlock.hash != newBlock.prevHash) {
      console.log("Prev Hash for new block doesn't match.");
      return false;
    }
    else if(BlockChain.calculateHashforBlock(newBlock) != newBlock.hash) {
      console.log("Hash for the block in incorrect.");
      return false;
    }
    return true;
  }

  public generateNewBlock(blockData: string): Block {
    let latestBlock: Block = this.getLatestBlock();
    let index: number = latestBlock.index + 1;
    let prevHash: string = latestBlock.hash;
    let datetime: number = Date.now();
    let data: string = blockData;
    let hash: string = crypto.SHA256(index + prevHash + datetime + data).toString();
    let newBlock:Block = new Block(index,hash,prevHash,datetime,data);
    this.addBlock(newBlock);
    broadcastLatest();
    return this.chain[this.chain.length -1];
  }

  public replaceChain(newChain:Block[]): boolean {
    if(isChainValid(this.chain[0],newChain)
        && newChain.length > this.chain.length) {
      console.log("Received blockchain is valid. Replacing current blockchain with received blockchain");
      this.chain = newChain;
      broadcastLatest();
      return true;
    }
    else {
      console.log("Received blockchain invalid");
      return false;
    }
  }
  public static isBlockStructureValid(block: Block): boolean {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.prevHash === 'string'
        && typeof block.data === 'string'
        && typeof block.datetime === 'number';
  }

  private static calculateHashforBlock(block: Block): string {
    return crypto.SHA256(block.index + block.prevHash + block.datetime + block.data).toString();
  }
}

const getGenesisBlock = (): Block =>{
  let index: number = 0;
  let prevHash: string = '';
  let datetime: number = 1526819567083;
  let data: string = "Genesis block!";
  let hash: string = crypto.SHA256(index + prevHash + datetime + data).toString();
  return new Block(index,hash,prevHash,datetime,data);
}

const isChainValid = (genesisBlock: Block, blockChain: Block[]):boolean  => {
  const isGenesisValid = (genesisBlock: Block, blockChain: Block[]): boolean => {
    return JSON.stringify(genesisBlock) === JSON.stringify(blockChain[0]);
  }

  if(!isGenesisValid(genesisBlock,blockChain)){
    console.log("Genesis Block invalid.");
    return false;
  }

  for(let i=1;i< blockChain.length; i++) {
    if(!BlockChain.isValid(blockChain[i],blockChain[i-1])) {
      return false;
    }
  }
  return true;
}

export {Block, BlockChain, getGenesisBlock,isChainValid};
