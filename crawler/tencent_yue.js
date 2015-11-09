// 腾讯月捐

var http = require("http"),
    url = 'http://gongyi.qq.com/loveplan/list.htm';

// function _parseData(data) {
// 	var params = data.substr(10, data.length - 12);

//     return JSON.parse(params);
// }

function rwData() {
    http.get(url, function(res) {
        var data = '';

        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
        	// var params = _parseData(data);
        	// var pageCount = params.info.pages.total_page;
            console.log(data);
        });
    }).on('error', function() {
        console.log('获取 腾讯月捐 数据出错');
    });
}

exports.rwData = rwData;