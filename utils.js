const crypto = require('crypto')

const generateState = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      randomString += characters[randomIndex];
    }
    return randomString;
}

module.exports = {
  generateState,
}