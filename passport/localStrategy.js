const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

// 흐름 순서
// router.post('/login') -> passport.authenticate(local) -> passport 내부의 local() -> 아래 로직 실행
module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email', // req.body.email
    passwordField: 'password', // req.body.password
  }, async (email, password, done) => {
    try {
      // 기존 이메일과 위에서 전달된 이메일이 있는지 검사
      const exUser = await User.findOne({ where: { email } });
      if (exUser) {
        // 전달받은 패스워드와 현재 존재하는 이메일의 패스워드가 같은지 비교 - bcrypt.compare()
        const result = await bcrypt.compare(password, exUser.password);
        if (result) { // 같다면
          // done은 3개의 인자를 받는다. 첫번째:에러 / 두번째:성공시 유저객체 / 세번째:에러에 대한 처리
          // 어떠한 경우든 done 함수가 호출되면, 다시 router.post('/login')로 이동된다.
          done(null, exUser);
        } else { // 틀리면
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
      } else { // 이메일 검사에서 이메일이 없다면
        done(null, false, { message: '가입되지 않은 회원입니다.' });
      }
    } catch (error) {
      console.error(error);
      console.log('localStrategy error!!');
      done(error);
    }
  }));
};