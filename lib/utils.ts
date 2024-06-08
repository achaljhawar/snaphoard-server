export function authcodecreator(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  
    return result;
}
export function generateEightDigitNumber(): number {
    const min = 10000000;
    const max = 99999999; 
    return Math.floor(Math.random() * (max - min + 1)) + min;
}