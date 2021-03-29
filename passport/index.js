const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');

// passport 기본 설정(전략) : 로그인을 어떻게 할지에 대한 로직
// 흐름 순서
// router.post('/login') -> passport.authenticate(local) -> passport 내부의 local() 찾음
module.exports = () => {
    // router.post('/login')의 내부에서 에러가 없이 return req.login(user, ())이 실행될 경우
    // login(user)를 받아옴
    passport.serializeUser((user, done) => {
        // session에 user의 id만 저장
        // 서버의 메모리를 줄이기 위해 user의 많은 데이터가 아닌 id만 메모리에 저장한다. (서버가 과부화되면 out of memori)
        // done이 되는 순간 router.post('/login')으로 다시 이동
        done(null, user.id);
    });

    // express-session에서 받은 session을 passport.session에서 처리하여,
    // user.id 값을 알아내고, 아래 deserializeUser의 인자로 넘겨준다.

    // req.user가 생성되는 영역
    passport.deserializeUser((id, done) => {
        // findOne은 Promise임으로 then, catch 사용
        // 전달받은 id값으로 user의 정보를 복구 시킨다.
        // req.user가 user의 정보를 담고있다.
        // 또한 req.isAuthencated 하면 true가 나와야, 제대로 넘겨진 것이다.
        User.findOne({ 
            where: {id},
            include: [{
                model: User, // 가져올 곳의 모델은 User
                attributes: ['id', 'nick'],
                as: 'Followers' // 위 아래 같은 User이므로, as로 나눠준다.
            },{
                model: User,
                attributes: ['id', 'nick'],
                as: 'Followings'
            }],
        })
            .then(user => done(null, user))
            .catch(err => done(err))
    });

    local();
    kakao();
};