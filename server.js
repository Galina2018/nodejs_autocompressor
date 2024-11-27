const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const zlib = require('zlib');

const dirPath = process.argv[2];
if (!dirPath) {
  console.error('Не указан путь к директории');
  process.exit(1);
}

function compressFile(filePath) {
  return new Promise((resolve, reject) => {
    const gzip = zlib.createGzip();
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(`${filePath}.gz`);
    readStream
      .pipe(gzip)
      .pipe(writeStream)
      .on('finish', () => resolve())
      .on('error', (err) => reject(err));
    readStream.on('data', (chunk) => {
      console.log('сжимаю... (chunk length=', chunk.length, ')');
    });
  });
}
async function compressFilesInDirectory(dirPath) {
  try {
    console.log('Сканирую папку', dirPath, '\n');
    const files = await fsp.readdir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fsp.stat(filePath);
      if (stats.isFile()) {
        if (!file.match(/\.gz$/)) {
          console.log(`Найден файл: ${filePath}`);
          let gzExist = files.findIndex((fl) => fl === `${file}.gz`);
          if (gzExist >= 0) {
            console.log('gz версия уже существует!\n');
          } else {
            console.log('gz версии еще не существует!');
            await compressFile(filePath);
            console.log('Файл сжат.\n');
          }
        }
      } else {
        await compressFilesInDirectory(filePath);
      }
    }
  } catch (error) {
    console.error('Ошибка при сжатии файлов:', error);
  }
}

compressFilesInDirectory(dirPath);