"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import connect_db, disconnect_db
from app.core.rabbitmq import connect_rabbitmq, disconnect_rabbitmq
from app.core.s3 import get_s3_client
from app.api.routes import algorithm, problem

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="코드 컴파일 및 실행 서버",
    version="1.0.0"
)

# 라우터 등록
app.include_router(algorithm.router, prefix="/api/algorithm", tags=["algorithm"])
app.include_router(problem.router, prefix="/api/problem", tags=["problem"])

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 이벤트 핸들러
@app.on_event("startup")
async def startup():
    """애플리케이션 시작 시 실행"""
    await connect_db()
    await connect_rabbitmq()
    await get_s3_client()


@app.on_event("shutdown")
async def shutdown():
    """애플리케이션 종료 시 실행"""
    await disconnect_rabbitmq()
    await disconnect_db()


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "COA Compile Server",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

