const got = require('@/utils/got');

async function getDidCookie(roomId) {
    const res = await got.get(`https://live.acfun.cn/live/${roomId}`, {
        responseType: 'text',
    });

    const didCookie = res.headers['set-cookie'][0]
        .split(/;\s*/)[0] // _did=
        .split(/=/)[1]; // did的值

    return didCookie;
}

async function getVisitor(cookie) {
    const res = await got('https://id.app.acfun.cn/rest/app/visitor/login', {
        method: 'POST',
        responseType: 'text',
        headers: {
            Referer: 'https://live.acfun.cn/',
            Cookie: `_did=${cookie}`,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: 'sid=acfun.api.visitor',
    });

    return res.data;
}

module.exports = async (ctx) => {
    const uid = ctx.params.uid;

    const didCookie = await getDidCookie(uid);
    const visitor = await getVisitor(didCookie);
    const userId = visitor.userId;
    const token = visitor['acfun.api.visitor_st'];
    const urlQuery = `subBiz=mainApp&kpn=ACFUN_APP.LIVE_MATE&kpf=WINDOWS_PC&userId=${userId}&did=${didCookie}&acfun.api.visitor_st=${token}`;

    const res = await got(`https://api.kuaishouzt.com/rest/zt/live/web/startPlay?${urlQuery}`, {
        method: 'POST',
        responseType: 'text',
        headers: {
            Referer: 'https://live.acfun.cn/',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: new URLSearchParams({
            authorId: uid,
            pullStreamType: 'FLV',
        }).toString(),
    });

    const data = res.data;

    if (data.result === 1) {
        ctx.state.data = {
            title: data.data.caption,
            link: `https://live.acfun.cn/live/${uid}`,
            description: `AcFun 直播`,
            item: [
                {
                    title: data.data.caption,
                },
            ],
        };
    } else {
        ctx.state.data = {
            title: `未开播`,
            link: `https://live.acfun.cn/live/${uid}`,
            description: `AcFun 直播`,
            allowEmpty: true,
        };
    }
};
