const hashMatchesDifficulty = (hash: string, difficulty: number): boolean => {
  const hashBinary: string = hexToBinary(hash);
  const difficultyPrefix: string = '0'.repeat(difficulty);
  return hashBinary.startsWith(difficultyPrefix);
};

const hexToBinary = (hash: string): string => {
  let binaryString: string = '';
  const lookup = {
    '0': '0000', '1': '0001', '2': '0010', '3': '0011',
    '4': '0100', '5': '0101', '6': '0110', '7': '0111',
    '8': '1000', '9': '1001', 'a': '1010', 'b': '1011',
    'c': '1100', 'd': '1101', 'e': '1110', 'f': '1111'
  }
  for(let i:number =0; i< hash.length; i++) {
    if(lookup[hash[i]]){
      binaryString += lookup[hash[i]];
    }
    else {
      return null;
    }
  }
  return binaryString;
};

const isValidTimeStamp = (newTime: number, oldTime: number): boolean => {
  return (oldTime - 60 < newTime) && (newTime - 60 < Date.now());
};

export {hashMatchesDifficulty, isValidTimeStamp};
