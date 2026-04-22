// 필수 모듈 가져오기
const express = require('express');
const http = require('http');
// Socket.IO 서버 클래스 임포트
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./db'); // DB 커넥션 풀 가져오기

// 1. Express 애플리케이션 및 HTTP 서버 설정
const app = express();
const server = http.createServer(app);
const port = 3000;


// 2. Socket.IO 서버 초기화 및 CORS 설정 (클라이언트 HTML이 로컬 파일이므로 필수)
const io = new Server(server, {
    path: "/api/chat", 
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 기본 웹페이지 응답 (선택 사항: 서버가 잘 실행되는지 확인용)
app.get('/', (req, res) => {
    res.send('<h1>Node.js Chat Server is Running</h1>');
});

// JSON 파싱 미들웨어 추가
app.use(express.json());

// 최근 100개 채팅 조회 API
app.get('/api/messages/:roomId', async (req, res) => {
    // 헤더에서 Gateway가 검증한 사용자 정보 추출
    const userId = req.headers['x-user-id'];
    const encodedNickname = req.headers['x-user-nickname'];
    // 한글 nickname URL 디코딩
    const nickname = encodedNickname ? decodeURIComponent(encodedNickname) : encodedNickname;
    const { roomId } = req.params;

    try {
        // 채팅방 존재 여부 확인
        const [rooms] = await pool.query('SELECT id FROM chat_room WHERE id = ?', [roomId]);
        if (rooms.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // 최근 100개 메시지 조회 (닉네임 포함)
        const messageSql = `
            SELECT
                cm.id,
                cm.room_id,
                cm.sender_id,
                u.nickname,
                cm.content,
                cm.created_at
            FROM chat_message cm
            JOIN users u ON cm.sender_id = u.id
            WHERE cm.room_id = ?
            ORDER BY cm.created_at DESC
            LIMIT 100
        `;
        const [messages] = await pool.query(messageSql, [roomId]);

        // 메시지를 시간 순으로 정렬 (오래된 것부터)
        const sortedMessages = messages.reverse();

        res.json({
            roomId: roomId,
            count: sortedMessages.length,
            messages: sortedMessages
        });

    } catch (error) {
        console.error('[ERROR] 채팅 메시지 조회 중 오류 발생:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Socket.IO 미들웨어를 사용한 연결 인증
io.use(async (socket, next) => {
    // 3a. 쿼리 파라미터에서 사용자 정보 및 채팅방 정보 추출
    const { userId, nickname: encodedNickname, roomId } = socket.handshake.query;
    // 한글 nickname URL 디코딩
    const nickname = encodedNickname ? decodeURIComponent(encodedNickname) : encodedNickname;

    // 3b. 필수 파라미터 확인
    if (!userId || !nickname) {
        console.log(`[WARN] 필수 파라미터(userId, nickname) 누락 - 연결 거부.`);
        return next(new Error("AuthenticationError: userId and nickname are required."));
    }

    if (!roomId) {
        console.log(`[WARN] 필수 파라미터(roomId) 누락 - 연결 거부.`);
        return next(new Error("AuthenticationError: roomId is required."));
    }

    try {
        // 3c. 채팅방 존재 여부 확인
        const [rooms] = await pool.query('SELECT id FROM chat_room WHERE id = ?', [roomId]);
        if (rooms.length === 0) {
            console.log(`[WARN] 존재하지 않는 채팅방(ID: ${roomId}) - 연결 거부.`);
            return next(new Error("AuthenticationError: Room not found."));
        }

        // 3d. 모든 검증 통과. 소켓에 정보 저장 후 연결 진행
        socket.userId = userId;
        socket.roomId = roomId;
        socket.nickname = nickname;
        next();

    } catch (error) {
        console.error('[ERROR] 연결 인증 중 DB 오류 발생:', error);
        next(new Error("InternalServerError: Could not verify connection."));
    }
});

// 4. Socket.IO 연결 이벤트 리스너 설정
io.on('connection', async (socket) => {
    try {
        // 1. 사용자 접속 로그
        console.log(`[LOG] 클라이언트 접속: ${socket.id} (유저 ID: ${socket.userId}, 닉네임: ${socket.nickname}, 채팅방 ID: ${socket.roomId})`);

        // 2. 채팅방 입장 및 멤버 정보 DB에 기록 (Upsert)
        socket.join(socket.roomId);
        const joinTime = new Date();
        const memberSql = `
            INSERT INTO chat_room_member (room_id, user_id, joined_at, is_active)
            VALUES (?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE
            is_active = TRUE,
            joined_at = ?;
        `;
        await pool.query(memberSql, [socket.roomId, socket.userId, joinTime, joinTime]);
        console.log(`[LOG] 클라이언트(${socket.userId})가 채팅방(${socket.roomId})에 입장하여 멤버 정보를 갱신했습니다.`);
        console.log(`[LOG] 현재 총 접속자 수: ${io.engine.clientsCount}`);

        // 3. 클라이언트로부터 'chat message' 이벤트 수신
        socket.on('chat message', async (msg) => {
            console.log(`[LOG] 메시지 수신 (채팅방: ${socket.roomId}, 유저: ${socket.userId}, 닉네임: ${socket.nickname}):`, msg);

            try {
                // 3a. DB에 메시지 저장 (socket에 저장된 userId와 roomId 사용)
                const messageSql = `INSERT INTO chat_message (room_id, sender_id, content, created_at) VALUES (?, ?, ?, ?)`;
                const values = [socket.roomId, socket.userId, msg.message || msg, new Date()];

                await pool.query(messageSql, values);
                console.log(`[LOG] 메시지가 데이터베이스에 저장되었습니다.`);

                // 3b. 같은 채팅방에만 메시지 전파(broadcast)
                io.to(socket.roomId).emit('chat message', {
                    userId: socket.userId,
                    nickname: socket.nickname,
                    message: msg.message || msg
                });
                console.log(`[LOG] 메시지 전파 완료 (채팅방: ${socket.roomId})`);

            } catch (error) {
                console.error('[ERROR] 메시지 DB 저장 또는 전파 중 오류 발생:', error);
            }
        });

        // 4. 클라이언트 연결 해제 이벤트
        socket.on('disconnect', () => {
            // 4a. 연결 해제 로그
            console.log(`[LOG] 클라이언트 연결 해제: ${socket.id} (유저 ID: ${socket.userId}, 닉네임: ${socket.nickname}, 채팅방 ID: ${socket.roomId})`);
            console.log(`[LOG] 현재 총 접속자 수: ${io.engine.clientsCount}`);
        });

        // 5. 연결 에러 처리
        socket.on('error', (error) => {
            console.error(`[ERROR] 소켓 오류 발생 (${socket.id} / 유저 ID: ${socket.userId}, 닉네임: ${socket.nickname}, 채팅방 ID: ${socket.roomId}):`, error);
        });

    } catch (error) {
        console.error(`[ERROR] 클라이언트 연결 처리 중 DB 오류 발생:`, error);
        socket.disconnect(); // DB오류 시 연결 강제 종료
    }
});

// 5. 서버 시작
server.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다 // .`);
});
