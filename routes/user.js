const express = require('express');

const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// POST /user/1/follow
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    // 내가 누구인지 찾는다.
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      // id가 2번 사용자면, 2번 사용자를 팔로윙
      // set : 수정(기존데이터 지우고, 추가), add : 추가, get : 가져오기, remove: 제거
      // 단수 : addFollowing, 복수 : addFollowings(아래처럼 배열로 닫아준다.)
      await user.addFollowing([parseInt(req.params.id, 10)]);
      res.send('success');
    } else {
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;