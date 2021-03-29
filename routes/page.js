const express = require('express');
const { Post, User, Hashtag } = require('../models');

const router = express.Router();

// 같은 변수를 모든 라우터에 넣을 시 - 중복으로 인해 하나도 빼두는 작업
router.use((req, res, next) => {
  // user 정보 - 사용 시 req.user
  res.locals.user = req.user;
  // console.log(req.user);
  // res.locals.user = null;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followingIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  next();
});

router.get('/profile', (req, res) => {  // page/profile
  res.render('profile', { title: '내 정보 - NodeBird' });
});

router.get('/join', (req, res) => { // page/join
  res.render('join', { title: '회원가입 - NodeBird' });
});

// 메인페이지
router.get('/', async (req, res, next) => { //
  try {
    const posts = await Post.findAll({
      include: {
        model: User, // 게시글 작성자
        attributes: ['id', 'nick'], // 그 중 아이디, 닉네임
      },
      order: [['createdAt', 'DESC']], // 오름차순
    });
    res.render('main', {
      title: 'NodeBird',
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 해시태그 검색하기.
// GET /hashtag?hashtag=노드
// form 태그에서 넘어오는 한글은 자동으로 encodeURIComponent()가 되지만,
// axios에 보내는 주소 일 경우 - `/hashtag?hashtag=${encodeURIComponent(data)}`
router.get('/hashtag', async (req, res, next) => {
  // encodeURIComponent로 전달했으면, decodeURIComponent로 받는다.
  const query = decodeURIComponent(req.query.hashtag);
  if (!query) { // 해시태그가 없으면
    return res.redirect('/'); // 메인페이지 이동
  }
  try { 
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) { // 있다면
      // 해당하는 해시태그가 있는 포스트를 get 해라
      // 복수형으로 Post -> Posts
      // model: User만 있을 경우 프론트로 모든 정보를 가져오기 때문에, 필요한 정보만 빼온다. attributes
      // include는 관계있는 모델을 적는다.
      posts = await hashtag.getPosts({ include: [{ model: User, attributes: ['id', 'nick'] }] });
    }

    return res.render('main', {
      title: `#${query} 검색 결과 | NodeBird`,
      twits: posts, // 해시태그에 해당되는 포스트를 넣는다.
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});


module.exports = router;
