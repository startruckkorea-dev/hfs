# HFS — Flex 구성원 → employee_search

Flex 구성원 화면의 `search-users` 응답(JSON 또는 HAR)을 APS 공통 직원 명부 양식(`employee_search.xlsx`)으로 바꾸는 단일 페이지.

- 처리는 모두 브라우저 안에서 하며 서버로 보내지 않는다. 이 저장소는 공개이므로 **직원 데이터 파일을 커밋하지 않는다.**
- 팀 → Department 매핑과 EngName 예외는 화면에서 바꾸며, 그 브라우저(localStorage)에만 저장된다.
