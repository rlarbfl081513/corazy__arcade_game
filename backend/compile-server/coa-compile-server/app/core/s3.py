"""
AWS S3 클라이언트 설정
"""
import boto3
import json
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError
from app.core.config import settings


class S3Client:
    """AWS S3 클라이언트"""

    def __init__(self):
        """S3 클라이언트 초기화"""
        self.client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.S3_BUCKET_NAME

    async def get_json_object(self, key: str) -> Optional[Dict[str, Any]]:
        """
        S3에서 JSON 파일을 가져와 파싱

        Args:
            key: S3 객체 키 (예: "problems/1000/info.json")

        Returns:
            JSON 데이터 (딕셔너리) 또는 None

        Raises:
            ClientError: S3 접근 오류
        """
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=key)
            content = response['Body'].read().decode('utf-8')
            return json.loads(content)
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                print(f"⚠️ S3 객체를 찾을 수 없음: {key}")
                return None
            else:
                print(f"❌ S3 접근 오류: {e}")
                raise e
        except json.JSONDecodeError as e:
            print(f"❌ JSON 파싱 오류: {e}")
            raise e

    async def check_object_exists(self, key: str) -> bool:
        """
        S3 객체 존재 여부 확인

        Args:
            key: S3 객체 키

        Returns:
            존재 여부 (True/False)
        """
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                return False
            else:
                print(f"❌ S3 접근 오류: {e}")
                raise e


# 싱글톤 인스턴스
_s3_client: Optional[S3Client] = None


async def get_s3_client() -> S3Client:
    """S3 클라이언트 인스턴스 반환 (싱글톤)"""
    global _s3_client
    if _s3_client is None:
        _s3_client = S3Client()
    return _s3_client
