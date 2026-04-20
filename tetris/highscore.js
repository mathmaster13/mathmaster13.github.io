const CHARACTERS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,/()❤️.!?-";

function isStringClean(input) {
    for (char of CHARACTERS)
        if (!CHARACTERS.includes(char)) 
            return false;
    return true;
}

function stringToBytes(input) {
    const buffer = new ArrayBuffer(input.length);
    const output = new Uint8Array(buffer);
    for (let i = 0; i < input.length; i++) {
        output[i] = CHARACTERS.indexOf(input[i]);
    }
    return output;
}

String.prototype.chunked = function(size) {
    return this.match(new RegExp(`.{1,${size}}`, 'g'));
};

class HighScore {
    constructor(name1 = "",
                     score = 0,
                     lines = 0,
                     startLevel = 0,
                     endLevel = 0) {
        this.name = name1.padEnd(8, ' ');
        this.score = score; this.lines = lines;
        this.startLevel = startLevel; this.endLevel = endLevel;
    };
    
    toUByteArray() {
        let output = stringToBytes(this.name);
        // score, in BCD
        output += Uint8Array.fromHex(this.score.toString().padStart(8, '0'));
        // lines, in BCD
        output += Uint8Array.fromHex(this.lines.toString().padStart(4, '0'));

        // start/end level, in hex
        output += new Uint8Array([this.startLevel, this.endLevel]);
        return output;
    }
}

const CHARACTERS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,/()❤️.!?-";

function isStringClean(input) {
    for (char of CHARACTERS)
        if (!CHARACTERS.includes(char)) 
            return false;
    return true;
}

function stringToBytes(input) {
    const buffer = new ArrayBuffer(input.length);
    const output = new Uint8Array(buffer);
    for (let i = 0; i < input.length; i++) {
        output[i] = CHARACTERS.indexOf(input[i]);
    }
    return output;
}

String.prototype.chunked = function(size) {
    return this.match(new RegExp(`.{1,${size}}`, 'g'));
};

function concatenate(uint8arrays) {
  const totalLength = uint8arrays.reduce(
    (total, uint8array) => total + uint8array.byteLength,
    0,
  );

  const result = new Uint8Array(totalLength);

  let offset = 0;
  uint8arrays.forEach((uint8array) => {
    result.set(uint8array, offset);
    offset += uint8array.byteLength;
  });

  return result;
}

class HighScore {
    constructor(name1 = "",
                     score = 0,
                     lines = 0,
                     startLevel = 0,
                     endLevel = 0) {
        this.name = name1.padEnd(8, ' ');
        this.score = score; this.lines = lines;
        this.startLevel = startLevel; this.endLevel = endLevel;
    };
    
    toUByteArray() {
        const output = 
            stringToBytes(this.name);
        // score, in BCD
        const score = Uint8Array.fromHex(this.score.toString().padStart(8, '0'));
        // lines, in BCD
        const lines = Uint8Array.fromHex(this.lines.toString().padStart(4, '0'));

        // start/end level, in hex
        const levels = new Uint8Array([this.startLevel, this.endLevel]);
        return concatenate([output, score, lines, levels]);
    }
}
