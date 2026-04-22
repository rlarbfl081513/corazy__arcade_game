# 파일 기반 테스트케이스 구조 마이그레이션 가이드

## 📋 개요

JSON 기반 테스트케이스 구조에서 파일 기반(`.in`, `.ans`) 구조로 변경되었습니다.

## 🔄 변경 사항

### 구 구조 (JSON)
```
s3://bucket/problems/{problemId}/testcases.json
```

**testcases.json**:
```json
{
  "problemId": 1000,
  "timeLimit": 2000,
  "memoryLimit": 256,
  "testCases": [
    { "input": "1 2", "output": "3" },
    { "input": "5 10", "output": "15" }
  ]
}
```

### 신 구조 (파일 기반)
```
s3://bucket/problems/{problemId}/
  ├── info.json              # 문제 정보
  ├── sample/                # 샘플 테스트케이스
  │   ├── 1.in
  │   ├── 1.ans
  │   ├── 2.in
  │   └── 2.ans
  └── evaluate/              # 채점 테스트케이스
      ├── 1.in
      ├── 1.ans
      ├── 2.in
      ├── 2.ans
      ├── 3.in
      ├── 3.ans
      ├── 4.in
      └── 4.ans
```

**1.in**:
```
1 2
```

**1.ans**:
```
3
```

**info.json**:
```json
{
  "problemId": 1000,
  "title": "A+B",
  "description": "두 정수를 입력받아 합을 출력",
  "timeLimit": 2000,
  "memoryLimit": 256
}
```

## 🎯 장점

### 1. 확장성
- 대용량 입력/출력을 별도 파일로 관리
- JSON 파싱 오버헤드 제거
- 파일 단위로 개별 관리 가능

### 2. 유연성
- `sample`과 `evaluate` 디렉토리로 테스트케이스 분리
- 샘플 테스트케이스는 사용자에게 공개
- 채점 테스트케이스는 숨김

### 3. 성능
- 필요한 테스트케이스만 선택적 다운로드 가능
- 스트리밍 방식으로 대용량 파일 처리 가능

## 🔧 사용 방법

### Judge 모드 요청

#### Sample 테스트케이스로 채점
```json
{
  "jobId": "job-001",
  "problemId": 1000,
  "mode": "judge",
  "type": "sample",
  "code": "a, b = map(int, input().split())\nprint(a + b)",
  "language": "python"
}
```

#### Evaluate 테스트케이스로 채점 (기본값)
```json
{
  "jobId": "job-002",
  "problemId": 1000,
  "mode": "judge",
  "type": "evaluate",
  "code": "a, b = map(int, input().split())\nprint(a + b)",
  "language": "python"
}
```

### 코드에서 사용

```javascript
const { getTestCases } = require('./services/s3Service');

// Sample 테스트케이스 가져오기
const sampleData = await getTestCases(1000, 'sample');
console.log(sampleData);
// {
//   problemId: 1000,
//   type: 'sample',
//   timeLimit: 2000,
//   memoryLimit: 256,
//   testCases: [
//     { number: 1, input: '1 2', output: '3' },
//     { number: 2, input: '5 10', output: '15' }
//   ]
// }

// Evaluate 테스트케이스 가져오기
const evaluateData = await getTestCases(1000, 'evaluate');
```

## 📦 마이그레이션 단계

### 1. 기존 JSON 데이터를 파일로 변환

```javascript
// convert-to-files.js
const fs = require('fs').promises;
const path = require('path');

async function convertToFiles(testcases) {
  const { problemId, testCases } = testcases;
  
  // 디렉토리 생성
  const sampleDir = `problems/${problemId}/sample`;
  const evaluateDir = `problems/${problemId}/evaluate`;
  
  await fs.mkdir(sampleDir, { recursive: true });
  await fs.mkdir(evaluateDir, { recursive: true });
  
  // 테스트케이스 파일 생성
  for (let i = 0; i < testCases.length; i++) {
    const { input, output } = testCases[i];
    const num = i + 1;
    
    // Sample과 Evaluate 모두 생성
    const dirs = [sampleDir, evaluateDir];
    for (const dir of dirs) {
      await fs.writeFile(`${dir}/${num}.in`, input);
      await fs.writeFile(`${dir}/${num}.ans`, output);
    }
  }
  
  // info.json 생성
  const info = {
    problemId: testcases.problemId,
    title: testcases.title,
    description: testcases.description,
    timeLimit: testcases.timeLimit,
    memoryLimit: testcases.memoryLimit
  };
  
  await fs.writeFile(
    `problems/${problemId}/info.json`,
    JSON.stringify(info, null, 2)
  );
}
```

### 2. S3에 업로드

```bash
# AWS CLI로 업로드
aws s3 sync problems/ s3://your-bucket/problems/

# 특정 문제만 업로드
aws s3 sync problems/1000/ s3://your-bucket/problems/1000/
```

### 3. 테스트

```bash
# 새로운 테스트케이스 실행
node test/testCase18_judgeSample.js
node test/testCase19_judgeEvaluate.js
```

## 🔄 하위 호환성

기존 JSON 기반 구조도 계속 지원됩니다. 서버는 자동으로 적절한 형식을 감지하여 처리합니다.

## 📝 파일명 규칙

1. **입력 파일**: `{번호}.in` (예: `1.in`, `2.in`)
2. **정답 파일**: `{번호}.ans` (예: `1.ans`, `2.ans`)
3. **번호는 1부터 시작**
4. **반드시 `.in`과 `.ans`가 쌍으로 존재해야 함**

## ⚠️ 주의사항

### 1. 파일 인코딩
- 모든 파일은 UTF-8 인코딩 사용
- 줄바꿈은 LF(`\n`) 권장

### 2. 출력 비교
- 출력은 정확히 일치해야 함 (공백, 줄바꿈 포함)
- 필요시 trailing whitespace 제거

### 3. 대용량 파일
- 입력/출력이 매우 큰 경우 (1MB+) 성능 테스트 필요
- 필요시 청크 단위 처리 고려

## 🧪 테스트 케이스

새로운 구조를 테스트하는 테스트케이스들:

- `testCase18_judgeSample.js`: Sample 테스트케이스로 채점
- `testCase19_judgeEvaluate.js`: Evaluate 테스트케이스로 채점
- `testCase20_judgeWrongAnswer.js`: Wrong Answer 테스트
- `testCase21_judgeMultipleProblems.js`: 여러 문제 채점

## 📚 관련 문서

- [S3 Sample Data README](test/s3-sample-data/README.md)
- [Test README](test/README.md)
- [Main README](README.md)

## 💡 추가 개선 사항

### 향후 고려사항
1. 테스트케이스 캐싱
2. 병렬 다운로드
3. 테스트케이스 압축 저장
4. 스트리밍 처리
5. 부분 채점 지원

## 🆘 문제 해결

### S3에서 파일을 찾을 수 없음
```
Error: S3Error: 문제 1000의 테스트케이스를 찾을 수 없습니다.
```

**해결책**:
1. S3 버킷에 파일이 업로드되었는지 확인
2. 파일 경로가 올바른지 확인: `problems/{problemId}/{type}/{number}.in`
3. AWS 자격증명 확인

### 출력이 일치하지 않음
```
Status: WA (틀렸습니다.)
```

**해결책**:
1. `.ans` 파일의 내용 확인
2. trailing whitespace 확인
3. 줄바꿈 문자 확인 (LF vs CRLF)

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. S3 버킷 구조
2. 파일 인코딩
3. AWS 자격증명
4. 서버 로그

