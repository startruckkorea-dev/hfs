# HFS — Flex 구성원 → employee_search

Flex 구성원 화면의 `search-users` 응답(JSON 또는 HAR)을 APS 공통 직원 명부 양식(`employee_search.xlsx`)으로 바꾸는 단일 페이지.

- Flex 데이터 처리는 모두 브라우저 안에서 하며 서버로 보내지 않는다. 이 저장소는 공개이므로 **직원 데이터 파일을 커밋하지 않는다.**
- 팀 → Department 매핑과 EngName 예외는 화면에서 바꾸며, 그 브라우저(localStorage)에만 저장된다.
- 로그인(10-01): 다른 APS 시스템과 같은 Entra 앱(APS-MasterData-App) · M365 계정. STK-DB `system_config_final.xlsx` 의 `ADMIN_SP_1` 에 적힌 사람만 들어온다.
  이 페이지 주소(`https://startruckkorea-dev.github.io/hfs/`, 또는 사용자 지정 도메인)를 앱 등록의 **SPA 리디렉션 URI** 에 넣어야 로그인이 된다.
- 이력: 로그인 · 접근 차단 · Excel 내려받기를 STK-DB `Logging_data/APS/HFS/YYYY-MM-DD/` 에 JSON 으로 남긴다 — APS 관리자 탭 「이력 조회」 에서 `APS/HFS` 로 보인다.
- 「STK-DB 현재 명부와 비교」 단추는 STK-DB 의 `employee_search.xlsx` 를 바로 읽어 신규 · 바뀜 · 빠짐을 보여 준다.
