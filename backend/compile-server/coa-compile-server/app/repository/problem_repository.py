"""
Problem Repository
"""
from typing import List, Optional, Dict, Any
from app.repository.base import BaseRepository
from app.schemas.problem import ProblemResponse, AlgorithmInfo, ProgrammingLanguageInfo


class ProblemRepository(BaseRepository):
    """문제 레포지토리"""

    async def get_problems_with_filters(
        self,
        algorithm_ids: Optional[List[int]] = None,
        language_ids: Optional[List[int]] = None,
        title_prefix: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        필터 조건에 맞는 문제 목록 조회

        Args:
            algorithm_ids: 알고리즘 ID 목록 (AND 조건 - 모든 알고리즘을 포함하는 문제)
            language_ids: 언어 ID 목록 (OR 조건 - 하나 이상의 언어를 지원하는 문제)
            title_prefix: 제목 접두사 검색
            limit: 조회 개수
            offset: 오프셋

        Returns:
            문제 목록
        """
        # 기본 쿼리
        query = """
            SELECT DISTINCT p.id, p.problem_number, p.title, p.created_at, p.updated_at
            FROM problem p
        """

        conditions = []
        values = {}

        # 알고리즘 필터 (AND 조건)
        if algorithm_ids and len(algorithm_ids) > 0:
            # 지정된 모든 알고리즘을 가진 문제를 찾기 위해 HAVING COUNT 사용
            query += """
                INNER JOIN problem_algorithm pa ON p.id = pa.problem_id
            """
            placeholders = ", ".join([f":alg_id_{i}" for i in range(len(algorithm_ids))])
            conditions.append(f"pa.algorithm_id IN ({placeholders})")
            for i, alg_id in enumerate(algorithm_ids):
                values[f"alg_id_{i}"] = alg_id

        # 언어 필터 (OR 조건)
        if language_ids and len(language_ids) > 0:
            query += """
                INNER JOIN problem_language pl ON p.id = pl.problem_id
            """
            placeholders = ", ".join([f":lang_id_{i}" for i in range(len(language_ids))])
            conditions.append(f"pl.language_id IN ({placeholders})")
            for i, lang_id in enumerate(language_ids):
                values[f"lang_id_{i}"] = lang_id

        # 제목 접두사 검색
        if title_prefix:
            conditions.append("p.title LIKE :title_prefix")
            values["title_prefix"] = f"{title_prefix}%"

        # WHERE 절 추가
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # 알고리즘 필터가 있는 경우 GROUP BY와 HAVING 추가
        if algorithm_ids and len(algorithm_ids) > 0:
            query += """
                GROUP BY p.id, p.problem_number, p.title, p.created_at, p.updated_at
                HAVING COUNT(DISTINCT pa.algorithm_id) = :alg_count
            """
            values["alg_count"] = len(algorithm_ids)

        # 정렬 및 페이징
        query += """
            ORDER BY p.problem_number ASC
            LIMIT :limit OFFSET :offset
        """
        values["limit"] = limit
        values["offset"] = offset

        return await self.fetch_all(query, values)

    async def count_problems_with_filters(
        self,
        algorithm_ids: Optional[List[int]] = None,
        language_ids: Optional[List[int]] = None,
        title_prefix: Optional[str] = None
    ) -> int:
        """
        필터 조건에 맞는 문제 개수 조회

        Args:
            algorithm_ids: 알고리즘 ID 목록 (AND 조건)
            language_ids: 언어 ID 목록 (OR 조건)
            title_prefix: 제목 접두사 검색

        Returns:
            문제 개수
        """
        # 서브쿼리를 사용하여 필터링된 문제 ID를 먼저 구한 후 COUNT
        query = """
            SELECT COUNT(DISTINCT p.id) as total
            FROM problem p
        """

        conditions = []
        values = {}

        # 알고리즘 필터
        if algorithm_ids and len(algorithm_ids) > 0:
            query += """
                INNER JOIN problem_algorithm pa ON p.id = pa.problem_id
            """
            placeholders = ", ".join([f":alg_id_{i}" for i in range(len(algorithm_ids))])
            conditions.append(f"pa.algorithm_id IN ({placeholders})")
            for i, alg_id in enumerate(algorithm_ids):
                values[f"alg_id_{i}"] = alg_id

        # 언어 필터
        if language_ids and len(language_ids) > 0:
            query += """
                INNER JOIN problem_language pl ON p.id = pl.problem_id
            """
            placeholders = ", ".join([f":lang_id_{i}" for i in range(len(language_ids))])
            conditions.append(f"pl.language_id IN ({placeholders})")
            for i, lang_id in enumerate(language_ids):
                values[f"lang_id_{i}"] = lang_id

        # 제목 접두사 검색
        if title_prefix:
            conditions.append("p.title LIKE :title_prefix")
            values["title_prefix"] = f"{title_prefix}%"

        # WHERE 절 추가
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # 알고리즘 필터가 있는 경우 서브쿼리로 감싸기
        if algorithm_ids and len(algorithm_ids) > 0:
            query = f"""
                SELECT COUNT(*) as total FROM (
                    {query}
                    GROUP BY p.id
                    HAVING COUNT(DISTINCT pa.algorithm_id) = :alg_count
                ) as filtered_problems
            """
            values["alg_count"] = len(algorithm_ids)

        result = await self.fetch_val(query, values)
        return result if result else 0

    async def get_problem_algorithms(self, problem_id: int) -> List[AlgorithmInfo]:
        """
        문제의 알고리즘 목록 조회

        Args:
            problem_id: 문제 ID

        Returns:
            알고리즘 정보 리스트
        """
        query = """
            SELECT a.id, a.name
            FROM algorithm a
            INNER JOIN problem_algorithm pa ON a.id = pa.algorithm_id
            WHERE pa.problem_id = :problem_id
            ORDER BY a.name ASC
        """
        results = await self.fetch_all(query, {"problem_id": problem_id})
        return [AlgorithmInfo(**row) for row in results]

    async def get_problem_languages(self, problem_id: int) -> List[ProgrammingLanguageInfo]:
        """
        문제의 지원 언어 목록 조회

        Args:
            problem_id: 문제 ID

        Returns:
            프로그래밍 언어 정보 리스트
        """
        query = """
            SELECT pl_lang.id, pl_lang.language, pl_lang.name
            FROM programming_language pl_lang
            INNER JOIN problem_language pl ON pl_lang.id = pl.language_id
            WHERE pl.problem_id = :problem_id
            ORDER BY pl_lang.language ASC
        """
        results = await self.fetch_all(query, {"problem_id": problem_id})
        return [ProgrammingLanguageInfo(**row) for row in results]

    async def get_problem_by_id(self, problem_id: int) -> Optional[Dict[str, Any]]:
        """
        ID로 문제 조회

        Args:
            problem_id: 문제 ID

        Returns:
            문제 정보 또는 None
        """
        query = """
            SELECT id, problem_number, title, created_at, updated_at
            FROM problem
            WHERE id = :problem_id
        """
        return await self.fetch_one(query, {"problem_id": problem_id})

    async def get_all_algorithms(self) -> List[Dict[str, Any]]:
        """
        전체 알고리즘 목록 조회

        Returns:
            알고리즘 목록
        """
        query = """
            SELECT id, name, created_at, updated_at
            FROM algorithm
            ORDER BY name ASC
        """
        return await self.fetch_all(query)

    async def get_all_programming_languages(self) -> List[Dict[str, Any]]:
        """
        전체 프로그래밍 언어 목록 조회

        Returns:
            프로그래밍 언어 목록
        """
        query = """
            SELECT id, language, name, created_at, updated_at
            FROM programming_language
            ORDER BY language ASC
        """
        return await self.fetch_all(query)

    async def get_random_problem_by_language(
        self,
        language_id: int,
        algorithm_ids: Optional[List[int]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        특정 언어를 지원하는 문제 중 랜덤 1개 조회

        Args:
            language_id: 언어 ID
            algorithm_ids: 알고리즘 ID 목록 (선택적, AND 조건)

        Returns:
            문제 정보 또는 None
        """
        query = """
            SELECT DISTINCT p.id, p.problem_number, p.title, p.created_at, p.updated_at
            FROM problem p
            INNER JOIN problem_language pl ON p.id = pl.problem_id
        """

        conditions = ["pl.language_id = :language_id"]
        values = {"language_id": language_id}

        # 알고리즘 필터 (AND 조건)
        if algorithm_ids and len(algorithm_ids) > 0:
            query += """
                INNER JOIN problem_algorithm pa ON p.id = pa.problem_id
            """
            placeholders = ", ".join([f":alg_id_{i}" for i in range(len(algorithm_ids))])
            conditions.append(f"pa.algorithm_id IN ({placeholders})")
            for i, alg_id in enumerate(algorithm_ids):
                values[f"alg_id_{i}"] = alg_id

        # WHERE 절 추가
        query += " WHERE " + " AND ".join(conditions)

        # 알고리즘 필터가 있는 경우 GROUP BY와 HAVING 추가
        if algorithm_ids and len(algorithm_ids) > 0:
            query += """
                GROUP BY p.id, p.problem_number, p.title, p.created_at, p.updated_at
                HAVING COUNT(DISTINCT pa.algorithm_id) = :alg_count
            """
            values["alg_count"] = len(algorithm_ids)

        # 랜덤 정렬 및 1개만 조회
        query += """
            ORDER BY RAND()
            LIMIT 1
        """

        return await self.fetch_one(query, values)


# Dependency Injection
async def get_problem_repository() -> ProblemRepository:
    """문제 레포지토리 의존성 주입"""
    return ProblemRepository()
