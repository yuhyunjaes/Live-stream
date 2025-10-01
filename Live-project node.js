1. Node.js 환경 및 프로젝트 초기화

Node.js 설치 확인

node -v, npm -v로 설치 여부 확인

프로젝트 폴더 생성

C:\Users\User\Desktop\live-stream

npm 초기화

npm init -y


자동으로 package.json 생성

"name": "live-stream" 등 기본 정보 포함

2. 필수 패키지 설치

Express 설치

npm install express


서버 라우팅, 정적 파일 제공, 미들웨어 처리

MySQL2 설치

npm install mysql2


MySQL DB 연결 및 쿼리 수행

ws 설치 (웹소켓)

npm install ws


Body-parser 설치

npm install body-parser


POST 요청의 JSON, URL-encoded 데이터를 파싱

bcrypt 설치

npm install bcrypt


비밀번호 해싱

EJS 설치 (뷰 엔진)

npm install ejs


서버에서 HTML 템플릿 렌더링

Express-session 설치

npm install express-session


로그인 세션 관리

참고: Express 5 버전 문제 때문에 4버전으로 다시 설치 (npm uninstall express 후 npm install express@4)

3. 데이터베이스 설정

MySQL 설치

데이터베이스 및 테이블 생성

CREATE DATABASE live_stream;
USE live_stream;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


db.js 연결 설정

const mysql = require("mysql2");
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "yourPassword",
    database: "live_stream"
});

connection.connect(err => {
    if(err) console.error("❌ MySQL 연결 실패:", err);
    else console.log("✅ MySQL 연결 성공");
});

module.exports = connection;

4. 서버 설정 (server.js)

기본 Express 앱 생성

const express = require("express");
const bodyParser = require("body-parser");
const connection = require("./db.js");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = 3000;


뷰 엔진 설정

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


미들웨어 설정

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000*60*60 } // 1시간
}));

5. 라우트 구성

페이지 라우트

app.get("/", (req, res) => res.render("index"));
app.get("/store", (req, res) => res.render("store"));
app.get("/login", (req, res) => res.render("login"));


아이디 중복 확인

app.post("/check-id", (req, res) => {
    const { user_id } = req.body;
    const sql = "SELECT * FROM users WHERE user_id = ?";
    connection.query(sql, [user_id], (err, result) => {
        if(err) return res.status(500).send("서버 에러");
        res.json({ success: result.length > 0 });
    });
});


회원가입

app.post("/store", async (req, res) => {
    const { user_id, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (user_id, password) VALUES (?, ?)";
    connection.query(sql, [user_id, hashPassword], (err, result) => {
        if(err) return res.redirect("/store");
        res.redirect("/login");
    });
});


로그인

app.post("/login", (req, res) => {
    const { user_id, password } = req.body;
    const sql = "SELECT * FROM users WHERE user_id = ?";
    connection.query(sql, [user_id], async (err, result) => {
        if(err) return res.status(500).send("서버 에러");
        if(result.length <= 0) return res.status(400).send("아이디 또는 비밀번호 확인");

        const match = await bcrypt.compare(password, result[0].password);
        if(!match) return res.status(400).send("아이디 또는 비밀번호 확인");

        req.session.user = { id: result[0].id, user_id: result[0].user_id };
        res.redirect("/");
    });
});


로그아웃

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if(err) return res.status(500).send("로그아웃 실패");
        res.redirect("/");
    });
});

6. 프론트엔드

EJS 템플릿

views/index.ejs, views/store.ejs, views/login.ejs

HTML 구조 + Bootstrap, FontAwesome

JS로 fetch 요청 처리

회원가입, 로그인, 아이디 중복 확인

리다이렉트 시 res.redirected 확인 후 window.location.href = res.url

7. 실행
node server.js


서버 실행 후 http://localhost:3000 접속

MySQL 연결 확인, 세션 정상 작동, 회원가입/로그인/로그아웃 테스트 완료

요약하면 지금까지 진행한 과정은:

Node.js 설치 및 프로젝트 초기화

npm 패키지 설치 (express, mysql2, bcrypt, body-parser, express-session, ejs)

MySQL DB, 테이블 생성

서버 구조, 라우트 설정

세션 관리, 비밀번호 해싱, 로그인/회원가입 구현

EJS와 JS로 프론트엔드 구성, fetch를 통한 AJAX 처리


서버 실행 및 테스트
