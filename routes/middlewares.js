exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) { // true면
        next();
    } else {
        // next()가 없음으로 여기서 끝.
        res.status(403).send('로그인 필요');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        // next()가 없음으로 여기서 끝.
        const message = encodeURIComponent('로그인한 상태입니다.');
        res.redirect(`/?error=${message}`);
    }
}