const fs = require('fs');
const path = require('path');

class ConcatenatePlugin {
  constructor(options) {
    this.source = options.source;
    this.destination = path.resolve(options.destination);
    this.name = options.name;
    this.ignore = options.ignore || [];
    this.remoteFile = options.remoteFile;
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('ConcatenatePlugin', (compilation, callback) => {
      const files = fs.readdirSync(this.source).filter((file) => {
        const fileName = path.basename(file);
        const fileExtension = path.extname(file);
        return (
          fileExtension === '.js' &&
          !this.ignore.includes(fileName) &&
          file !== this.remoteFile
        );
      });

      files.forEach((file) => {
        const filePath = path.join(this.source, file);
        fs.unlinkSync(filePath);
      });

      callback();
    });

    compiler.hooks.afterEmit.tapAsync('ConcatenatePlugin', (compilation, callback) => {
      const files = fs.readdirSync(this.source).filter((file) => {
        const fileName = path.basename(file);
        const fileExtension = path.extname(file);
        return (
          fileExtension === '.js' &&
          !this.ignore.includes(fileName) &&
          file !== this.remoteFile
        );
      }).sort();

      const contents = files
        .map((file) => {
          const filePath = path.join(this.source, file);
          return fs.readFileSync(filePath, 'utf8');
        })
        .join('');

      const outputPath = path.join(this.destination, this.name);
      fs.writeFileSync(outputPath, contents);

      const remoteFilePath = path.join(this.source, this.remoteFile);
      const remoteFileDestination = path.join(this.destination, this.remoteFile);
      fs.copyFileSync(remoteFilePath, remoteFileDestination);

      callback();
    });
  }
}

module.exports = ConcatenatePlugin;
