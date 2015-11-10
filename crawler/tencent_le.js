// 腾讯乐捐

var http = require("http"),
    request = require("request"),
    async = require("async"),
    common = require("./common");

// global variables
var pjUrlTpl = 'http://gongyi.qq.com/js/succor_data/pcdetail/pc.detail.{$id}.js';

function _parseData(data) {
    var params = data.substr(10, data.length - 12);
    return JSON.parse(params);
}

// 1. request initial data and generate page urls
function _generatePageUrls(pageURLTpl, callback) {
    request(pageURLTpl, function(err, res, body) {
        var data = _parseData(body),
            pageUrlArr = [],
            pageCount = data.info.pages.total_page;

        for (var i = pageCount; i > 0; i--) {
            pageUrlArr.push(pageURLTpl + i);
        }
        callback(null, pageUrlArr);
    });
}

// 2. generate project urls
function _generatePjUrls(pageUrlArr, callback) {
    async.map(pageUrlArr, function(pageURL, calbak) {
        request(pageURL, function(err, res, body) {
            /*var data = _parseData(body),
                list = data.info,
                projectUrlArr = [],
                i, il, id;

            for (i = 0, il = list.length; i < il; i++) {
                id = list[i].id;
                projectUrlArr.push(pjUrlTpl.replace('{$id}', pjIds[i]));
            }*/

            calbak(null, body);
        });
    }, function(err, results) {
        console.log('generatePjUrl err: ' + err);
        console.log('generatePjUrl results: ' + results);
    });
}

// 3. 


function crawler() {
    // collect project info
    var pageURLTpl = 'http://npoapp.gongyi.qq.com/succorv2/unproject/getlist?g_tk=false&jsoncallback=_Callback&s_status=&s_tid=&s_puin=&s_fid=&s_sort=&s_key=&p=',
        rwData = async.compose(
            _generatePageUrls,
            _generatePjUrls
        );

    rwData(pageURLTpl, function(err, result) {
        console.log('err: ', err);
        console.log('result: ', result);
    });
}

exports.crawler = crawler;
