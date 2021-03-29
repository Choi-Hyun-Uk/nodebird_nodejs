const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

module.exports = () => {
  // 카카오 앱 생성 후 진행 (developer.kakao.com)
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/auth/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => { // OAUTH2를 배워야 Token 사용 가능
    console.log('kakao profile', profile);
    try {
      // 1. 카카오에 가입한 사람이 있는지 검사
      const exUser = await User.findOne({
        where: { snsId: profile.id, provider: 'kakao' },
      });
      if (exUser) { // 았다면, 로그인
        done(null, exUser);
      } else { // 없으면, 가입하기
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account_email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        done(null, newUser); // 가입 후 로그인
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};