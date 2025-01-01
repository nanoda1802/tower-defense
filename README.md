# Alice in TowerLand

### 프로젝트 소개

> 흉악한 앨리스가 평화로운 이상한 나라를 침공했습니다!!
> 앨리스와 그의 친구들에 맞서 카드 왕국을 지켜주세요!!

플레이어는 앨리스 무리를 상대로 하트 여왕님을 보호해야 합니다!!
다양한 카드 병사들을 설치해 몰려오는 적들을 물리쳐보세요!!

---

### 앨리스 무리 소개 (= 몬스터 및 보스)

- 일반 몬스터는 `험프티 덤프티`로, 웨이브 마다 다른 색의 바지를 갈아입고 등장합니다!!
- 보스 몬스터론 웨이브 1에 `토끼`, 웨이브 2에 `체셔캣`, 웨이브 3에 `모자 장수`, 웨이브 4에 `바퀴 달린 쥐`, 마지막 웨이브 5에 `앨리스`가 등장합니다!!

---

### 카드 병사 소개 (= 타워)

1. **일반 병사 `Pawn`**

- 일반 병사들은 각각 `검정 병사 구매`와 `빨강 병사 구매` 버튼을 통해 구매 가능하며, 1회 설치마다 10골드를 소모합니다!!
- 첫 설치 시 1번에 해당하는 `Ace 카드`로 시작하며, 승급 마다 숫자가 증가해 최대 `10 카드`까지 성장시킬 수 있습니다!!

2. **특수 병사 `J`, `Q`, `K`, `Joker`**

- 특수 병사들은 `특수 병사 뽑기` 버튼을 통해 구매 가능하며, 1회 설치마다 30골드를 소모합니다!!
- 특수 병사들은 승급이 불가능하며, 뽑기 방식으로 랜덤한 병사가 설치됩니다!! `Joker 카드`의 등장 확률은 `1%`고, 이외의 병사들은 균등하게 확률을 나눠갖습니다!!
- `J 카드`는 버프를 주는 병사로, 검정 카드인 경우 공격력을, 빨강 카드인 경우 공격속도를 증가시킵니다!!
- `Q 카드`는 사거리는 평범하지만 공격력이 높은 병사입니다!!
- `K 카드`는 공격력이 평범하지만 공격 범위가 넓은 병사입니다!!
- `Joker 카드`는 모든 면에서 출중한 병사입니다!! 획득만 한다면 일당백이 가능하다는 소문이 있습니다!!

---

### 조작 및 진행 설명

1. **게임 조작**

- 원하는 격자를 클릭한 후 화면 좌상단의 버튼을 클릭해 타워를 설치할 수 있습니다!!
- 위치를 지정하지 않았거나, 이미 타워 또는 몬스터 이동 경로가 있는 위치라면 설치할 수 없습니다!!
- 설치된 타워를 클릭해 해당 타워의 능력치를 조회할 수 있고, 능력치 창의 버튼을 클릭해 판매 또는 승급을 시도할 수 있습니다!!
- 추가로, 버프를 받고 있는 타워는 판매할 수 없습니다!! 먼저 버프를 주고 있는 `J 카드`를 판매한 이후에만 판매 처리가 가능합니다!!

2. **게임 진행**

- 총 다섯 번의 `Wave`로 진행되며, 마지막 웨이브 클리어 시 하트 여왕(= HQ)의 남은 체력이 1 이상이라면 클리어됩니다!!
- 다만 그 이전에 `HQ`의 체력이 소진된다면 즉시 게임 오버됩니다!!
- 클리어 시 남은 보유 골드가 추가 점수로 전환돼 최종 점수에 합산됩니다!!

---

### 디렉토리 구성

디렉토리는 크게 `assets`, `public`, `src`로 구성돼있습니다!

#### assets

```
📦assets
 ┣ 📜monster.json
 ┣ 📜pawn-tower.json
 ┣ 📜special-tower.json
 ┗ 📜wave.json
```

- 게임에 필요한 재료 데이터들을 JSON 객체 형태로 보관하는 디렉토리
- 몬스터 및 보스 데이터를 보관하는 `monster.json`과, 일반 병사 데이터의 `pawn-tower.json`, 특수 병사 데이터의 `special-tower.json`, 웨이브 데이터의 `wave.json`이 있습니다!

#### public

```
📦public
 ┣ 📂css
 ┃ ┗ 📜style.css
 ┣ 📂elements
 ┃ ┗ 📜images.js
 ┣ 📂images
 ┃ ┣ 📜.DS_Store
 ┃ ┣ 📜background.png
 ┃ ┣ 📜highlight.png
 ┃ ┣ 📜hq.png
 ┃ ┣ 📜monster0.png ~ 📜monster9.png
 ┃ ┣ 📜pawnB0.png ~ 📜pawnB9.png
 ┃ ┣ 📜pawnR0.png ~ 📜pawnR9.png
 ┃ ┣ 📜road.png
 ┃ ┗ 📜special1.png ~ 📜special7.png
 ┣ 📂src
 ┃ ┣ 📜base.js
 ┃ ┣ 📜game.js
 ┃ ┣ 📜monster.js
 ┃ ┣ 📜temp-co-op-game.js
 ┃ ┣ 📜tower.js
 ┃ ┗ 📜wave.js
 ┣ 📜index.html
 ┣ 📜login.html
 ┗ 📜register.html
```

- 클라이언트 환경에서 필요한 html, css, script 파일 및 이미지 파일 등을 보관하는 디렉토리
- `images` 폴더는 이미지 파일들을 보관하고, `elements` 폴더는 그 파일들을 Image 인스턴스로 만들어 내보내는 `image.js` 파일이 있습니다!
- `src` 폴더는 클라이언트에 필요한 script 파일들을 보관하고 있으며, 게임의 구동 및 서버 소켓 연결을 담당하는 `game.js`와 필요한 클래스 요소들을 정의하는 `base.js`, `monster.js`, `tower.js`, `wave.js` 파일들이 있습니다!

#### src

```
📦src
 ┣ 📂handlers
 ┃ ┣ 📜game-handler.js
 ┃ ┣ 📜handler-mapping.js
 ┃ ┣ 📜headquarter-handler.js
 ┃ ┣ 📜helper.js
 ┃ ┣ 📜monster-handler.js
 ┃ ┣ 📜register-handler.js
 ┃ ┣ 📜temp-room-handler.js
 ┃ ┣ 📜temp-wave-handler.js
 ┃ ┣ 📜tower-handler.js
 ┃ ┗ 📜wave-handler.js
 ┣ 📂inits
 ┃ ┣ 📜assets.js
 ┃ ┣ 📜prisma.js
 ┃ ┣ 📜redis.js
 ┃ ┗ 📜socket.js
 ┣ 📂models
 ┃ ┣ 📜temp-room-model.js
 ┃ ┣ 📜temp-wave-model.js
 ┃ ┗ 📜user-model.js
 ┣ 📂room
 ┃ ┗ 📜room.js
 ┣ 📂routes
 ┃ ┣ 📜account-router.js
 ┃ ┗ 📜ranking-router.js
 ┣ 📂utils
 ┃ ┗ 📜calculateMonsterMove.js
 ┣ 📜app.js
 ┗ 📜constants.js
```

- 서버 환경에서 필요한 앱, 핸들러, 시작파일, 모델 등을 보관하는 디렉토리

1. **handlers**

```
📦handlers
 ┣ 📜game-handler.js
 ┣ 📜handler-mapping.js
 ┣ 📜headquarter-handler.js
 ┣ 📜helper.js
 ┣ 📜monster-handler.js
 ┣ 📜register-handler.js
 ┣ 📜temp-room-handler.js
 ┣ 📜temp-wave-handler.js
 ┣ 📜tower-handler.js
 ┗ 📜wave-handler.js
```

- **`register-handler.js`** : 유저 접속을 인지하고 소켓 이벤트리스너들을 등록
- **`helper.js`** : 클라이언트의 메세지를 받고 핸들러들을 매칭시켜주는 함수들이 위치
  - `handleConnection` 함수에서 Room 인스턴스를 생성하고 assets 데이터를 클라이언트에 전달해줍니다!!
  - `handleDisconnect` 함수에서 비정상적으로 연결이 끊긴 유저의 Room 인스턴스를 제거하고, 접속자 목록에서 종료된 유저의 정보를 제거합니다!!
  - 이외의 함수들은 특정 메세지를 받아 이에 적합한 handler를 매칭시켜줍니다!!
- **`handler-mapping.js`** : handler 매칭을 위해 `{ handlerId : function }` 형태의 프로퍼티로 이루어진 객체들이 위치
- **`game-handler.js`** : `gameStart` 함수와 `gameEnd` 함수가 위치
  - `gameStart` 함수에서는 Room 인스턴스의 초기 설정 후 시작 데이터를 클라이언트에 전달해줍니다!!
  - `gameEnd` 함수에서는 게임 오버 또는 클리어 시 최종 점수를 계산하고, 정상적으로 게임이 종료된 유저의 Room 인스턴스를 제거하고, 만약 최고 기록 갱신 시 이를 Redis에 저장합니다!!
- **`wave-handler.js`** : 웨이브 이동에 대한 검증과 서버의 웨이브 데이터 최신화를 담당하는 `waveChangeHandler`가 위치
- **`headquarter-handler.js`** : HQ와 몬스터의 충돌에 대한 검증과 서버의 HQ 데이터 최신화를 담당하는 `collideHandler`가 위치
- **`monster-handler.js`** : 몬스터 및 보스의 생성을 검증하고 유효한 몬스터 데이터를 클라이언트에 전달해주는 `createMonsterHandler`와 몬스터 처치를 검증하고 유효한 보상 데이터를 전달해주는 `deathMonsterHandler`가 위치
- **`tower-handler.js`** :
- 그 외 **`temp`** 가 붙은 파일들은 사용되지 않습니다!! (미완 작업물)

2.  **inits**

```
📦inits
 ┣ 📜assets.js
 ┣ 📜prisma.js
 ┣ 📜redis.js
 ┗ 📜socket.js
```

- **`assets.js`** : assets 데이터를 load하는 `loadGameAssets` 함수와 불러올 file들을 열람하는 `readFileAsync` 함수가 위치
- **`socket.js`** : 소켓을 초기화하고 서버에 부착, 회원 인증 절차를 담당하는 소켓 미들웨어를 거쳐 `registerHandler` 실행
- 그 외 파일은 데이터베이스 연동

3.  **models**

```
📦models
 ┣ 📜temp-room-model.js
 ┣ 📜temp-wave-model.js
 ┗ 📜user-model.js
```

- **`user-model.js`** : 서버에 접속 중인 유저 목록을 관리하는 파일
- 그 외 `temp` 가 붙은파일들은 사용되지 않고 있습니다!!

4.  **room**

```
📦room
 ┗ 📜room.js
```

- **`room.js`** : 게임에 관련된 서버를 총괄 관리하기 위한 `Room` 클래스를 선언하는 위치!! 신규 유저가 접속할 때마다 새 Room 인스턴스를 생성해 `rooms` 배열에 push하는 방식으로 관리!! `gameEnd` 또는 `handleDisconnect` 에서 유저의 Room 인스턴스를 찾아 제거!!

5.  **routes**

```
📦routes
 ┣ 📜account-router.js
 ┗ 📜ranking-router.js
```

- **`account-router.js`**
  1. `crypto`, `jwt`, `bcrypt` 등의 라이브러리들을 활용해 API 구현
  2. 임시 데이터인 token 등이 결부된 회원 정보는 Redis에 저장 (redisClient 활용)
  3. 장기 데이터로서의 회원 정보는 MySql에 저장 (prisma 활용)
- **`ranking-router.js`**
  - Redis에 저장된 유저별 하이스코어를 조회해 leaderboard를 생성하는 API
  - html에서 `hover`를 활용해 커서를 올리면 열람할 수 있도록 구현

6.  **utils**

```
📦utils
 ┗ 📜calculateMonsterMove.js
```

- **`calculateMonsterMove.js`** : 서버에 기록된 몬스터 생성 시간과 assets 데이터에 있는 몬스터 `speed` 속성을 활용해 몬스터의 이동을 검증하기 위한 시뮬레이션 데이터를 만드는 기능 담당

7.  **그 외**

- **`app.js`** : 서버 시동 및 Redis 연동, session 생성, CORS 설정, 소켓 초기화, assets 데이터 로드 등의 기능을 담당
- **`constants.js`** : 특정 상수들을 alias한 변수들을 보관
