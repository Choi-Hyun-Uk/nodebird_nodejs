const express = require('express');
const path = require('path');
const morgan = require('morgan');
const nunjucks = require('nunjucks');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const helmet = require('helmet');
const session = require('express-session');
const dotenv = require('dotenv'); // .env 보다 위로 위치
const passport = require('passport');

// 추후 배포 시 콘솔보다 더 좋은 방법으로 로그한다.
// 아래처럼 만든 로거를 불러와서 콘솔대신 로거를 사용하면된다.
const logger = require('./logger');

dotenv.config();

// router 불러오기
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models/index');
const passportConfig = require('./passport');

// express 객체 넣기
const app = express();

// 패스포트 설정
passportConfig();

// 포트 설정 - 배포 시 process.env.PORT를 변경
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
// 템플릿엔진 nunjucks 설정
nunjucks.configure('views', {
    express: app,
    watch: true,
});
// sequlize를 통해서 node와 mysql이 연결
// sync되는 순간 알아서 모델을 읽어서 테이블을 생성해준다.
// force : true면 model 수정 시 테이블이 지워지고, 다시 테이블 생성 (데이터 지워짐) (사용 X)
// force : false면 model 수정 시 테이블에 변경 없다. (개발용)
// alter : true면 안전하지만, 기존 데이터와 안맞는 경우가 있어서 문제가 생길 수 있다. (사용 X)
sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    })

// 배포 및 개발환경 설정
if (process.env.NODE_ENV === 'production') {
    // 프록시 서버 사용할 경우
    app.enable('trust proxy');
    app.use(morgan('combined'));
    // 아래 2개는 보안용
    // contentSecurityPolicy : true 일 경우 -> html, css 로딩할때 에러날 경우가 있다.
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(hpp());
} else {
    app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json()); // json Request Body를 받기 위함
app.use(express.urlencoded({ extended: false })); // false : node의 기본으로 내장된 queryString
app.use(cookieParser(process.env.COOKIE_SECRET));
// session 설정
app.use(session({
    resave: false, // 요청이 올 경우 세션에 수정사항이 생기지 않아도 다시 저장할지 여부
    saveUninitialized: false, // 세선에 저장할 내역이 없더라도 세션을 저장할지 여부
    secret: process.env.COOKIE_SECRET,
    cookie: { // sessionCookie
        httpOnly: true, // javascript 공격 방어
    },
}));

// Router에 가기전에 passport 미들웨어 2개 연결
// 또한 express-session 아래에 위치해야한다. (express-session을 받아서 처리하기 때문)
app.use(passport.initialize());
// 로그인 후 passport.session이 실행되면, passport.deserializeUser가 실행된다.
app.use(passport.session());

// 기본 페이지 Router
app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);

// Router 에러 시
app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    logger.info('hello');
    logger.error(error.message);
    next(error); // Error 미들웨어로 전달된다.
});

// Error 미들웨어
app.use((err, req, res, next) => {
    // 템플릿엔진에서 제공되는 변수
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};

    res.status(err.status || 500).render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});