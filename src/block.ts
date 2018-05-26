import * as crypto from 'crypto-js';
import {broadcastLatest} from './sockets';
import {hashMatchesDifficulty, isValidTimeStamp} from './utils';

class Block {
  // public index: number;
  // public hash: string;
  // public prevHash: string;
  // public datetime: number;
  // public data: string;
  // public difficulty: number;
  // public nonce: number;

  constructor(public index:number,
    public hash:string,public prevHash:string,public datetime:number,
    public data:string, public difficulty: number, public nonce: number) {
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
    else if(!isValidTimeStamp(newBlock.datetime, prevBlock.datetime)) {
      console.log("invalid timestamp");
      return false;
    }
    else if(BlockChain.calculateHashforBlock(newBlock) != newBlock.hash ||
            !hashMatchesDifficulty(BlockChain.calculateHashforBlock(newBlock),newBlock.difficulty)) {
      console.log("Hash for the block in incorrect.");
      return false;
    }
    return true;
  }

  public generateNewBlock(blockData: string): Block {
    let latestBlock: Block = this.getLatestBlock();
    let index: number = latestBlock.index + 1;
    let prevHash: string = latestBlock.hash;
    let datetime: number = getTimeStamp();
    let data: string = blockData;
    let hash: string = crypto.SHA256(index + prevHash + datetime + data).toString();
    let difficulty: number = this.getBlockChainDifficulty();
    let newBlock:Block = BlockChain.findBlock(index, prevHash, datetime, data, difficulty);
    this.addBlock(newBlock);
    broadcastLatest();
    return this.chain[this.chain.length -1];
  }

  public replaceChain(newChain:Block[]): boolean {
    if(isChainValid(this.chain[0],newChain)
        && this.getAccumulatedDifficulty(newChain) > this.getAccumulatedDifficulty(this.chain)) {
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
        && typeof block.datetime === 'number'
        && typeof block.difficulty === 'number'
        && typeof block.nonce === 'number';
  }

  private static calculateHashforBlock(block: Block): string {
    return crypto.SHA256(
      block.index + block.prevHash + block.datetime + block.data
      + block.difficulty + block.nonce
    ).toString();
  }

  public static findBlock(index: number,
    prevHash: string, datetime: number, data:string, difficulty: number): Block {
      // There may be sophistiicated algos to find nonce but this is pedagogical.
      let nonce: number = 0;
      let hash: string;
      while(true) {
        hash = crypto.SHA256(
          index + prevHash + datetime + data
          + difficulty + nonce
        ).toString();
        if(hashMatchesDifficulty(hash, difficulty)) {
          return new Block(index, hash, prevHash, datetime, data, difficulty, nonce);
        }
        nonce++;
      }
  }

  public getBlockChainDifficulty(): number {
    const latestBlock: Block = this.getLatestBlock();
    if(latestBlock.index % DIFFICULTY_ADJUSMENT_INTERVAL == 0 &&
    latestBlock.index != 0) {
      return this.getAdjustedDifficulty();
    }
    else {
      return latestBlock.difficulty;
    }
  }

  public getAdjustedDifficulty(): number {
    const prevAdjustBlock: Block = this.chain[this.chain.length - DIFFICULTY_ADJUSMENT_INTERVAL];
    const timeExpected: number = DIFFICULTY_ADJUSMENT_INTERVAL* BLOCK_GENERATION_INTERVAL;
    const timeTaken: number = this.getLatestBlock().datetime - prevAdjustBlock.datetime;
    if(timeTaken < timeExpected/2) {
      return prevAdjustBlock.difficulty + 1;
    }
    else if(timeTaken > 2*timeExpected) {
      return prevAdjustBlock.difficulty - 1;
    }
    else {
      return prevAdjustBlock.difficulty;
    }
  }

  public getAccumulatedDifficulty(blockChain: Block[]): number {
    return blockChain
    .map((block) => Math.pow(2,block.difficulty))
    .reduce((sum, val) => sum + val);
  }
}

// interval in seconds
const BLOCK_GENERATION_INTERVAL: number = 10;

// interval in number of blocks
const DIFFICULTY_ADJUSMENT_INTERVAL: number = 10;

const getTimeStamp = (): number => Date.now();

const getGenesisBlock = (): Block =>{
  let index: number = 0;
  let prevHash: string = '';
  let datetime: number = 1526819567083;
  let data: string = "Genesis block!";
  let hash: string = crypto.SHA256(index + prevHash + datetime + data).toString();
  let difficulty: number = 0;
  let nonce: number = 0;
  return new Block(index,hash,prevHash,datetime,data,difficulty,nonce);
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
