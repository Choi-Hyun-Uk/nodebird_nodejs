const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

// uploads 폴더가 있는지, 없는지 없다면 만들어주기.
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

// multer는 함수이고, 그 안에있는 네가지의 미들웨어가 있다.
// 이미지 업로드 시 Network에서 Headers 하단에 Form-data를 보면, img로 업로드 되고,
// view source를 보면 body-parser는 해석할 수 없는 코드가 있다. 이것을 multer가 해석해준다.
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      // uploads 폴더에 이미지 업로드
      cb(null, 'uploads/'); 
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 업로드 한 후에 아래 미들웨어가 실행된다.
// 이미지 먼저 업로드하는 방향 - 서비스를 어떻게 만들지에 따라 정해진다.
// 이미지는 서버에서 먼저 받아서, 최적화 작업을 진행하는 동시에 작성자는 게시글을 작성하는 서비스 방향
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => { // /post/img
  console.log(req.file);
  // 실제 파일은 uploads 폴더에 있지만, 아래는 img로 표기하고, express.static에서 설정을 해주자.
  res.json({ url: `/img/${req.file.filename}` });
});

// 게시글 업로드 라우터
// 이미지를 업로드 안하므로 none();
router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            UserId: req.user.id,
        });
        const hashtags = req.body.content.match(/#[^\s#]*/g);
        if (hashtags) {
          const result = await Promise.all(
            hashtags.map(tag => {
              // findOrCreate - DB에 저장 되어있으면, 생성 X / 저장 안되어있으면 생성 O
              // true면 생성, false면 이미 저장되어있다.
              // Hashtag - DB 데이터
              return Hashtag.findOrCreate({
                // tag - 각 해시태그
                // slice(1) - 단어 앞의 #을 빼준다.
                // toLowerCase : 문자열을 소문자로 변경.
                where: { title: tag.slice(1).toLowerCase() },
              })
            }),
          );
          console.log(result);
          // 배열이 2중이어서, 배열 하나를 벗기고 담기.
          // Hashtag의 복수형으로 Hashtags
          await post.addHashtags(result.map(r => r[0])); 
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// const upload2 = multer();
// router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
//   try {
//     console.log(req.user);
//     const post = await Post.create({
//       content: req.body.content,
//       img: req.body.url,
//       UserId: req.user.id,
//     });
//     const hashtags = req.body.content.match(/#[^\s#]*/g);
//     if (hashtags) {
//       const result = await Promise.all(
//         hashtags.map(tag => {
//           return Hashtag.findOrCreate({
//             where: { title: tag.slice(1).toLowerCase() },
//           })
//         }),
//       );
//       await post.addHashtags(result.map(r => r[0]));
//     }
//     res.redirect('/');
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

module.exports = router;