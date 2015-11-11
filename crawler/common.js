var fs = require('fs'),
	xlsx = require("node-xlsx");

function writeToExcel(fileName, data) {
    var buffer = xlsx.build([{
        name: fileName,
        data: data
    }]); // returns a buffer

    fs.writeFileSync(fileName + '.xlsx', buffer, 'binary');
}

exports.writeToExcel = writeToExcel;
