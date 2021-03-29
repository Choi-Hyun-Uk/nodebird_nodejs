const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

// 회원가입 Router
const router = express.Router();

// isLoggedIn - 로그인 일 경우
// isNotLoggedIn - 로그인 아닐 경우

router.post('/join', isNotLoggedIn, async (req, res, next) => { // /auth/join
    // axios api 요청에서 전달된 값을 구조분해하여 req.body에서 꺼내온다.
    const { email, nick, password } = req.body;
    try {
        // 기존 존재하는 이메일에 전달 받은 이메일이 있는지 조건문으로(where) 검사
        const exUser = await User.findOne({ where: { email } });
        if (exUser) {
            // 이미 있을 경우 에러 알림(쿼리스트링으로 전달)
            return res.redirect('/join?error=exist');
        }
        // bcrypt로 hash 기능 사용하기. hash는 입력한 문자에 맞는 암호화같은 문자로 만든다. 
        // 12 : hash화를 복잡하게 구조화하기 (보안은 좋지만, 소요하는 시간은 높아진다.)
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            email,
            nick,
            password: hash,
        });
        return res.redirect('/'); // 다시 메인페이지로 리다이렉트
    } catch (error) {
        console.error(error);
        return next(error);
    }
});


// 미들웨어 확장 패턴 사용
router.post('/login', isNotLoggedIn, (req, res, next) => { // /auth/login
    // passport.authenticate(local) 실행되면, passport가 내부에(로그인 로직 쪽) 있는 local()를 찾는다.
    // 찾은 후 localStrategy로 이동 
    passport.authenticate('local', (authError, user, info) => { // 3개 인자는 done에서 받은 내용
        if (authError) {
            console.error(authError);
            console.log('authenticate error!!');
            return next(authError);
        }
        if (!user) {
            return res.redirect(`/?loginError=${info.message}`);
        }
        // req.login(user, ())이 실행되면, 다시 passport로 이동(로그인 로직 쪽)
        return req.login(user, (loginError) => {
            // 로그인 과정에서 에러가 발생할 경우 아래에서 처리됨.
            if (loginError) {
                console.error(loginError);
                console.log('final error!!');
                return next(loginError);
            }
            // 위에서 마지막 에러 확인 시 문제가 없다면, 메인페이지로 리다이렉트
            // 세션 쿠키를 브라우저로 보내준다. 그 이후로는 세션이 저장되어 로그인이 되어있는 상태가 된다.
            console.log('로그인 성공!');
            return res.redirect('/');
        });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {
    // passport.deserializeUser에서 제대로 전달 받게 될 경우 사용자 정보 확인 가능
    // req.user; 
    req.logout(); // 서버에서 세션쿠키가 사라짐
    req.session.destroy(); // 세션 자체를 삭제
    res.redirect('/'); // 메인페이지로 이동
});

// 카카오 로그인 클릭 시 -> kakaoStrategy
// kakaoStrategy 가기전에 카카오 개발에서 설정했던 Redirect URI에 기재한 주소를 카카오에서 전달준다.
// 전달받은 주소 뒤에는 데이터가 있으며, 카카오 로그인을 할 수 있는 로그인창이 뜬다.
router.get('/kakao', passport.authenticate('kakao'));

// 카카오에서 done 실행 됐다면
router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/',
    }), (req, res) => {
        res.redirect('/');
});
  
module.exports = router;