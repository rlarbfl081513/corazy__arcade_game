"""
문제 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from app.schemas.problem import ProblemResponse, ProblemListResponse
from app.schemas.problem_info import ProblemDetailResponse, ProblemInfoData, TestCaseData
from app.schemas.algorithm_model import AlgorithmResponse
from app.schemas.programming_language import ProgrammingLanguageResponse
from app.repository.problem_repository import ProblemRepository, get_problem_repository
from app.core.s3 import S3Client, get_s3_client

router = APIRouter()

@router.get("/health-check")
async def health_check():
    return {"message": "OK"}


@router.get("/list", response_model=ProblemListResponse)
async def get_problem_list(
    algorithm_ids: Optional[str] = Query(None, description="알고리즘 ID 목록 (쉼표로 구분, AND 조건)"),
    language_ids: Optional[str] = Query(None, description="언어 ID 목록 (쉼표로 구분, OR 조건)"),
    title_prefix: Optional[str] = Query(None, max_length=200, description="제목 접두사 검색"),
    limit: int = Query(default=20, ge=1, le=100, description="조회 개수"),
    offset: int = Query(default=0, ge=0, description="오프셋"),
    repository: ProblemRepository = Depends(get_problem_repository)
):
    """
    문제 목록 조회 API

    - **algorithm_ids**: 알고리즘 ID 목록 (예: "1,2,3") - 모든 알고리즘을 포함하는 문제 검색 (AND 조건)
    - **language_ids**: 언어 ID 목록 (예: "1,2") - 하나 이상의 언어를 지원하는 문제 검색 (OR 조건)
    - **title_prefix**: 제목 접두사 검색 (예: "A+B")
    - **limit**: 한 번에 조회할 개수 (기본값: 20, 최대: 100)
    - **offset**: 페이징 오프셋 (기본값: 0)

    ## 예시:
    - 알고리즘 1, 2를 모두 포함하는 문제: `?algorithm_ids=1,2`
    - Python 또는 Java를 지원하는 문제: `?language_ids=1,2`
    - 제목이 "A+"로 시작하는 문제: `?title_prefix=A+`
    - 복합 조건: `?algorithm_ids=1&language_ids=1,2&title_prefix=A+&limit=10`
    """
    try:
        # 문자열을 정수 리스트로 변환
        alg_ids = [int(x.strip()) for x in algorithm_ids.split(",")] if algorithm_ids else None
        lang_ids = [int(x.strip()) for x in language_ids.split(",")] if language_ids else None

        # 문제 목록 조회
        problems = await repository.get_problems_with_filters(
            algorithm_ids=alg_ids,
            language_ids=lang_ids,
            title_prefix=title_prefix,
            limit=limit,
            offset=offset
        )

        # 각 문제에 대한 알고리즘 및 언어 정보 조회
        problem_responses = []
        for problem in problems:
            algorithms = await repository.get_problem_algorithms(problem["id"])
            languages = await repository.get_problem_languages(problem["id"])

            problem_response = ProblemResponse(
                id=problem["id"],
                problem_number=problem["problem_number"],
                title=problem["title"],
                created_at=problem["created_at"],
                updated_at=problem["updated_at"],
                algorithms=algorithms,
                languages=languages
            )
            problem_responses.append(problem_response)

        # 전체 개수 조회
        total = await repository.count_problems_with_filters(
            algorithm_ids=alg_ids,
            language_ids=lang_ids,
            title_prefix=title_prefix
        )

        return ProblemListResponse(
            total=total,
            items=problem_responses
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"잘못된 파라미터 형식: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/info", response_model=ProblemDetailResponse)
async def get_problem_info(
    problem_number: int = Query(..., gt=0, description="문제 번호"),
    s3_client: S3Client = Depends(get_s3_client)
):
    """
    문제 상세 정보 조회 API (S3에서 가져오기)

    - **problem_number**: 문제 번호

    S3 버킷 `corazyarcade-code-dataset`의 `problems/{문제번호}/` 디렉토리에서
    `info.json`과 `testcases.json`을 읽어 반환합니다.

    ## 반환 데이터:
    - **info**: 문제 설명, 입출력 설명, 제한사항 등
    - **testcases**: 테스트케이스 목록 (예제 및 히든 케이스)

    ## 예시:
    - 1000번 문제 조회: `/api/problem/info?problem_number=1000`
    """
    try:
        # S3 경로 구성
        info_key = f"problems/{problem_number}/info.json"
        testcase_key = f"problems/{problem_number}/testcases.json"

        # S3에서 JSON 파일 가져오기
        info_data = await s3_client.get_json_object(info_key)
        testcase_data = await s3_client.get_json_object(testcase_key)

        # 파일이 존재하지 않는 경우
        if info_data is None:
            raise HTTPException(
                status_code=404,
                detail=f"문제 {problem_number}의 정보를 찾을 수 없습니다. (info.json 없음)"
            )

        if testcase_data is None:
            raise HTTPException(
                status_code=404,
                detail=f"문제 {problem_number}의 테스트케이스를 찾을 수 없습니다. (testcases.json 없음)"
            )

        # Pydantic 모델로 검증 및 변환
        try:
            info = ProblemInfoData(**info_data)
            testcases = TestCaseData(**testcase_data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"JSON 데이터 형식 오류: {str(e)}"
            )

        return ProblemDetailResponse(
            info=info,
            testcases=testcases
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/algorithms", response_model=List[AlgorithmResponse])
async def get_all_algorithms(
    repository: ProblemRepository = Depends(get_problem_repository)
):
    """
    전체 알고리즘 목록 조회 API

    데이터베이스에 저장된 모든 알고리즘 목록을 반환합니다.

    ## 반환 데이터:
    - **id**: 알고리즘 ID
    - **name**: 알고리즘 이름
    - **created_at**: 생성 시각
    - **updated_at**: 수정 시각

    ## 예시:
    - 전체 알고리즘 조회: `/api/problem/algorithms`
    """
    try:
        algorithms = await repository.get_all_algorithms()
        return [AlgorithmResponse(**algo) for algo in algorithms]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/languages", response_model=List[ProgrammingLanguageResponse])
async def get_all_programming_languages(
    repository: ProblemRepository = Depends(get_problem_repository)
):
    """
    전체 프로그래밍 언어 목록 조회 API

    데이터베이스에 저장된 모든 프로그래밍 언어 목록을 반환합니다.

    ## 반환 데이터:
    - **id**: 언어 ID
    - **language**: 언어 코드 (예: python, java)
    - **name**: 언어 이름 (예: Python 3, Java 11)
    - **created_at**: 생성 시각
    - **updated_at**: 수정 시각

    ## 예시:
    - 전체 언어 조회: `/api/problem/languages`
    """
    try:
        languages = await repository.get_all_programming_languages()
        return [ProgrammingLanguageResponse(**lang) for lang in languages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/random", response_model=ProblemResponse)
async def get_random_problem(
    language_id: int = Query(..., gt=0, description="언어 ID"),
    algorithm_ids: Optional[str] = Query(None, description="알고리즘 ID 목록 (쉼표로 구분, AND 조건)"),
    repository: ProblemRepository = Depends(get_problem_repository)
):
    """
    언어별 랜덤 문제 조회 API

    지정된 프로그래밍 언어를 지원하는 문제 중 랜덤으로 1개를 반환합니다.
    선택적으로 알고리즘 필터를 적용할 수 있습니다.

    - **language_id**: 프로그래밍 언어 ID (필수)
    - **algorithm_ids**: 알고리즘 ID 목록 (선택, 쉼표로 구분, AND 조건)

    ## 반환 데이터:
    - **id**: 문제 ID
    - **problem_number**: 문제 번호
    - **title**: 문제 제목
    - **algorithms**: 문제에 포함된 알고리즘 목록
    - **languages**: 문제가 지원하는 언어 목록
    - **created_at**: 생성 시각
    - **updated_at**: 수정 시각

    ## 예시:
    - Python 문제 랜덤 조회: `/api/problem/random?language_id=1`
    - Python + 특정 알고리즘 문제 랜덤 조회: `/api/problem/random?language_id=1&algorithm_ids=1,2`
    """
    try:
        # 알고리즘 ID 파싱
        alg_ids = [int(x.strip()) for x in algorithm_ids.split(",")] if algorithm_ids else None

        # 랜덤 문제 조회
        problem = await repository.get_random_problem_by_language(
            language_id=language_id,
            algorithm_ids=alg_ids
        )

        if not problem:
            raise HTTPException(
                status_code=404,
                detail=f"조건에 맞는 문제를 찾을 수 없습니다."
            )

        # 문제의 알고리즘 및 언어 정보 조회
        algorithms = await repository.get_problem_algorithms(problem["id"])
        languages = await repository.get_problem_languages(problem["id"])

        return ProblemResponse(
            id=problem["id"],
            problem_number=problem["problem_number"],
            title=problem["title"],
            created_at=problem["created_at"],
            updated_at=problem["updated_at"],
            algorithms=algorithms,
            languages=languages
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"잘못된 파라미터 형식: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")
