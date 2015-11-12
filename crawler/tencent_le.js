// 腾讯乐捐

var request = require("request"),
    async = require("async"),
    common = require("./common");

function _parseData(data) {
    var params = data.match(/(\{=?)([\s\S]*)(\})/);
    //var params = data.substr(10, data.length - 12);
    return JSON.parse(params[0]);
}

function _extractInfo(pj) {
    var status = '';
    switch (pj.status) {
        case '1':
            status = '募款中';
            break;
        case '2':
            status = '执行中';
            break;
        case '3':
            status = '已结束';
            break;
        default:
            status = 'unknown';
            break;
    }

    var donate = pj.donate,
        result = [
            pj.title,
            status,
            donate.needMoney + '元', donate.obtainMoney + '元',
            pj.startTime + '至' + pj.endTime,
            pj.fundName,
            pj.fundPCnt
        ];

    return result;
}

function crawler() {
    var pageURLTpl = 'http://npoapp.gongyi.qq.com/succorv2/unproject/getlist?g_tk=false&jsoncallback=_Callback&s_status=0&s_tid=&s_puin=&s_fid=&s_sort=&s_key=&p=',
        pjUrlTpl = 'http://gongyi.qq.com/js/succor_data/pcdetail/pc.detail.{$id}.js',
        headers = ['项目名称', '状态', '目标筹款额', '已筹', '时间', '发起公益机构', '公益机构乐捐项目数'],
        pageUrlArr = [],
        pjUrlArr = [],
        pjIdx = 1,
        startTime = Date.now(),
        fileName = '腾讯乐捐';

    request(pageURLTpl, function(err, res, body) {
        var data = _parseData(body),
            pageCount = data.info.pages.total_page;

        console.log('页面总数: ' + pageCount);

        for (var i = pageCount; i > 0; i--) {
            pageUrlArr.push(pageURLTpl + i);
        }

        console.log('Reading page...');
        async.mapLimit(pageUrlArr, 30, function(pageURL, callback) {
            request(pageURL, function(err, res, body) {

                var data = _parseData(body),
                    list = data.info.list,
                    i, il, id;

                for (i = 0, il = list.length; i < il; i++) {
                    pjUrlArr.push(pjUrlTpl.replace('{$id}', list[i].id));
                }

                callback(null);
            });
        }, function(err) {
            console.log('generate page urls err: ' + err);

            async.mapLimit(pjUrlArr, 30, function(pjURL, callback) {
                request(pjURL, function(err, res, body) {
                    console.log('\n项目' + (pjIdx++));
                    var data = _parseData(body),
                        pjInfo = _extractInfo(data.info.base);

                    console.log(pjInfo);
                    callback(null, pjInfo);
                });
            }, function(err, pjInfoArr) {
                console.log('saving err: ' + err);

                pjInfoArr.splice(0, 0, headers);
                common.writeToExcel(fileName, pjInfoArr);

                console.log('Finished successfully!');
                console.log('项目总数：' + pjInfoArr.length);
                console.log('总耗时：' + ((Date.now() - startTime) / 1000) + 's');
            });
        });
    });
}

exports.crawler = crawler;
