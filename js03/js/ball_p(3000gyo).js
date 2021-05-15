// グローバルに展開
phina.globalize();
// アセット
var ASSETS = {
    // 画像
    image: {
        // プレイヤー
        'ball': './img/ball.png',
        'goal': './img/door01.png',
        'logo': './img/logo2.png'
    },

    // フレームアニメーション情報
    spritesheet: {

    },

    sound: {
        'kachi': './bgm/kachi.mp3',
        'goal': './bgm/goal.mp3',
        'stage1': './bgm/ys1_05.mp3',
        'stage2': './bgm/dq1_03.mp3',
        'stage3': './bgm/CT_kairo.mp3',
        'stage4': './bgm/yiear.mp3',
        'stage5': './bgm/dq2_03.mp3',
        'stage6': './bgm/ys1_05.mp3',
        'gameover': './bgm/zenmetsu.wav',
        'kabe': './bgm/kabe.wav',
        'menu': './bgm/dq2_02.mp3',
        'vs': './bgm/hanjuku_uewoshitahe.mp3',
        'fanfare': './bgm/fanfare.mp3',
        'lose': './bgm/gameover.wav'
    },
};

// 定数
var SCREEN_WIDTH = 640; // 画面横サイズ
var SCREEN_HEIGHT = 640; // 画面縦サイズ

var PLAYER_SIZE_X = 16; // playerサイズ
var PLAYER_SIZE_Y = 16; // playerサイズ

var PLAYER_SPEED = 0.5; //プレイヤーの速度
var PLAYER_SPEED_MAX = 5;
var JUMP_POWER = 10;   // プレイヤーのジャンプ力

var GRAVITY = 1;  // 重力

var GOAL_SIZE_X = 30;
var GOAL_SIZE_Y = 45;

var LOGO_SIZE_X = 400;
var LOGO_SIZE_Y = 300;

var HIT_RADIUS = 8;    // 当たり判定用の半径

var time_list = Array(100);
// time_list.fill(999999);

const st_key = 'STAGE_FLAG';
const time_key = 'time';

var MODE                //難易度

var STAGE_FLAG = 1;        //どこまで進んだか判定（localstrageから数字を読み込む）
var STAGE;             // 現在のステージ

let query = location.search;
let url_value = query.split('=');

let user_name = url_value[1].split('?')[0];
let SVR = url_value[2];

let yplay = 0;

document.getElementById('name').value = user_name;

load_states();

/*
 * メインシーン
 */
phina.define("Stage01", {
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            // 画面サイズ指定
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // 背景色
        this.backgroundColor = 'black';
        this.shapeGroup = DisplayElement().addChildTo(this);
        this.shapeGroupR = DisplayElement().addChildTo(this);

        // カスタムGrid
        var grid = Grid(SCREEN_WIDTH, 10);
        // thisを退避
        var self = this;

        var shapeB1 = RectangleShape({
            x: 200, y: 500, width: 400, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB1.backgroundColor = 'black';

        var shapeB2 = RectangleShape({
            x: 519, y: 464, width: 240, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB3 = RectangleShape({
            x: 270, y: 430, width: 180, height: 8,
            fill: 'white',
            backgroundColor: 'black',
            padding: 0,
            // cornerRadius:5
        }).addChildTo(this.shapeGroup);

        var shapeR1 = RectangleShape({
            x: 400, y: 486, width: 2, height: 36,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
            strokeWidth: 0
            // cornerRadius:5
        }).addChildTo(this.shapeGroupR);

        // goal設置
        this.goal = Goal().addChildTo(this);
        this.goal.x = 200;
        this.goal.bottom = 428;

        // プレイヤー作成
        this.player = Player().addChildTo(this);
        this.player.x = 50;
        this.player.bottom = 450;

        // bottan
        this.leftLabel = Label({
            text: "←",
            fill: "white"
        }).addChildTo(this).setPosition(40, 600);

        this.rightLabel = Label({
            text: "→",
            fill: "white"
        }).addChildTo(this).setPosition(600, 600);

        this.time_label = Label({
            text: '',
            fill: 'white',
            fontSize: 20,
            x: 10,
            y: 10,
        }).addChildTo(this);
        this.time_label.origin.set(0, 0);
        time_list[STAGE] = 0;  //     タイマー初期値

        // BGM
        SoundManager.volume = 0.1;
        SoundManager.playMusic('stage1')

        stagechange(1);
        stagedouki(this);
        p1watch(this, 'stage1');

    },
    // 更新処理
    update: function (app) {
        var player = this.player;
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;

        time_list[STAGE] += app.deltaTime;
        tl.text = 'STAGE ' + STAGE + ',  Time : ' + Math.floor(time_list[STAGE] / 1000) + '.' + ('000' + time_list[STAGE] % 1000).slice(-3);
        
        p1move(this, 'stage1');

        this.collisionY();
        this.collisionR();

        this.goalDoor();
        // タッチ操作可能
        lb.setInteractive(true);
        rb.setInteractive(true);
        // 
        lb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('left', true);
        });

        lb.on('pointend', function () {
            // alert('touched!');
            key.setKey('left', false);

        });

        rb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('right', true);
        });

        rb.on('pointend', function () {
            // alert('touched!');
            key.setKey('right', false);

        });

        lb.fill = (key.getKey("left")) ? "red" : "white";
        rb.fill = (key.getKey("right")) ? "red" : "white";

        if (player.bottom > SCREEN_HEIGHT) {
            SoundManager.stopMusic();
            AssetManager.get('sound', 'gameover').play();
            this.exit('scene03')
        }

    },

    collisionY: function () {
        var player = this.player;
        // 床に乗っている場合は強引に当たり判定を作る
        var vy = player.physical.velocity.y === 0 ? 4 : player.physical.velocity.y;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroup.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.bottom = block.top;
                // 移動量
                player.physical.velocity.y = -10;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionR: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupR.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x > 0) {
                    player.right = block.left;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();

                }
            }
        });
    },

    goalDoor: function () {
        var player = this.player;
        var goal = this.goal;
        // 判定用の円
        var c1 = Circle(player.x, player.y, HIT_RADIUS);
        var r2 = Circle(goal.x, goal.y, HIT_RADIUS);

        // 円判定
        if (Collision.testCircleCircle(c1, r2)) {
            // console.log('hit!');
            STAGE_FLAG = 2;
            STAGE += 1;
            save_states();
            AssetManager.get('sound', 'goal').play();
            this.exit();
        }
    },

});

phina.define("Stage02", {
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            // 画面サイズ指定
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // 背景色
        this.backgroundColor = 'black';
        this.shapeGroup = DisplayElement().addChildTo(this);
        this.shapeGroupR = DisplayElement().addChildTo(this);

        // カスタムGrid
        var grid = Grid(SCREEN_WIDTH, 10);
        // thisを退避
        var self = this;

        var shapeB1 = RectangleShape({
            x: 100, y: 500, width: 180, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB1.backgroundColor = 'black';

        var shapeB2 = RectangleShape({
            x: 300, y: 500, width: 170, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB3 = RectangleShape({
            x: 500, y: 500, width: 160, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);



        // var shapeR1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        //     // cornerRadius:5
        // }).addChildTo(this.shapeGroupR);

        // goal設置
        this.goal = Goal().addChildTo(this);
        this.goal.x = 550;
        this.goal.bottom = 496;

        // プレイヤー作成
        this.player = Player().addChildTo(this);
        this.player.x = 50;
        this.player.bottom = 450;

        // bottan
        this.leftLabel = Label({
            text: "←",
            fill: "white"
        }).addChildTo(this).setPosition(40, 600);

        this.rightLabel = Label({
            text: "→",
            fill: "white"
        }).addChildTo(this).setPosition(600, 600);

        this.time_label = Label({
            text: '',
            fill: 'white',
            fontSize: 20,
            x: 10,
            y: 10,
        }).addChildTo(this);
        this.time_label.origin.set(0, 0);
        time_list[STAGE] = 0;  //     タイマー初期値

        // BGM
        SoundManager.playMusic('stage2');
        stagechange(2);
        stagedouki(this);
        p1watch(this, 'stage2');

    },
    // 更新処理
    update: function (app) {
        var player = this.player;
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;

        time_list[STAGE] += app.deltaTime;
        tl.text = 'STAGE ' + STAGE + ',  Time : ' + Math.floor(time_list[STAGE] / 1000) + '.' + ('000' + time_list[STAGE] % 1000).slice(-3);

        p1move(this, 'stage2');

        //床、 壁当たったときの動き
        this.collisionY();
        this.collisionR();
        // 扉にあたったときの動き
        this.goalDoor();
        // タッチ操作可能
        lb.setInteractive(true);
        rb.setInteractive(true);
        // 
        lb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('left', true);
        });
        lb.on('pointend', function () {
            // alert('touched!');
            key.setKey('left', false);

        });
        rb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('right', true);
        });
        rb.on('pointend', function () {
            // alert('touched!');
            key.setKey('right', false);

        });
        lb.fill = (key.getKey("left")) ? "red" : "white";
        rb.fill = (key.getKey("right")) ? "red" : "white";

        if (player.bottom > SCREEN_HEIGHT) {
            SoundManager.stopMusic();
            AssetManager.get('sound', 'gameover').play();
            this.exit('scene03');
        }

    },

    collisionY: function () {
        var player = this.player;
        // 床に乗っている場合は強引に当たり判定を作る
        var vy = player.physical.velocity.y === 0 ? 4 : player.physical.velocity.y;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroup.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.bottom = block.top;
                // 移動量
                player.physical.velocity.y = -10;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionR: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupR.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x > 0) {
                    player.right = block.left;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();

                }
            }
        });
    },

    goalDoor: function () {
        var player = this.player;
        var goal = this.goal;
        // 判定用の円
        var c1 = Circle(player.x, player.y, HIT_RADIUS);
        var r2 = Circle(goal.x, goal.y, HIT_RADIUS);

        // 円判定
        if (Collision.testCircleCircle(c1, r2)) {
            STAGE_FLAG = 3;
            STAGE += 1;
            save_states();
            AssetManager.get('sound', 'goal').play();
            this.exit();
        }
    },




});

phina.define("Stage03", {
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            // 画面サイズ指定
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // 背景色
        this.backgroundColor = 'black';
        this.shapeGroup = DisplayElement().addChildTo(this);
        this.shapeGroupR = DisplayElement().addChildTo(this);
        this.shapeGroupT = DisplayElement().addChildTo(this);
        this.shapeGroupL = DisplayElement().addChildTo(this);

        // カスタムGrid
        var grid = Grid(SCREEN_WIDTH, 10);
        // thisを退避
        var self = this;

        var shapeB1 = RectangleShape({
            x: 50, y: 500, width: 100, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB2 = RectangleShape({
            x: 170, y: 460, width: 100, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB3 = RectangleShape({
            x: 100, y: 420, width: 50, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB4 = RectangleShape({
            x: 150, y: 380, width: 50, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB5 = RectangleShape({
            x: 200, y: 340, width: 60, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB6 = RectangleShape({
            x: 400, y: 300, width: 400, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB7 = RectangleShape({
            x: 540, y: 350, width: 200, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB7 = RectangleShape({
            x: 500, y: 500, width: 200, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeT1 = RectangleShape({
            x: 400, y: 308, width: 400, height: 8,
            fill: 'lightgray',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);


        // var shapeR1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupR);

        // var shapeL1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupL);

        // goal設置
        this.goal = Goal().addChildTo(this);
        this.goal.x = 550;
        this.goal.bottom = 496;

        // プレイヤー作成
        this.player = Player().addChildTo(this);
        this.player.x = 50;
        this.player.bottom = 450;

        // button
        this.leftLabel = Label({
            text: "←",
            fill: "white"
        }).addChildTo(this).setPosition(40, 600);

        this.rightLabel = Label({
            text: "→",
            fill: "white"
        }).addChildTo(this).setPosition(600, 600);

        this.time_label = Label({
            text: '',
            fill: 'white',
            fontSize: 20,
            x: 10,
            y: 10,
        }).addChildTo(this);
        this.time_label.origin.set(0, 0);
        time_list[STAGE] = 0;  //     タイマー初期値

        // BGM
        SoundManager.playMusic('stage3');
        stagechange(3);
        stagedouki(this);
        p1watch(this, 'stage3');

    },
    // 更新処理
    update: function (app) {
        var player = this.player;
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;

        p1move(this, 'stage3');

        time_list[STAGE] += app.deltaTime;
        tl.text = 'STAGE ' + STAGE + ',  Time : ' + Math.floor(time_list[STAGE] / 1000) + '.' + ('000' + time_list[STAGE] % 1000).slice(-3);


        //床、 壁当たったときの動き
        this.collisionY();
        this.collisionR();
        this.collisionL();
        this.collisionT();
        // 扉にあたったときの動き
        this.goalDoor();
        // タッチ操作可能
        lb.setInteractive(true);
        rb.setInteractive(true);
        // 
        lb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('left', true);
        });
        lb.on('pointend', function () {
            // alert('touched!');
            key.setKey('left', false);

        });
        rb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('right', true);
        });
        rb.on('pointend', function () {
            // alert('touched!');
            key.setKey('right', false);

        });
        lb.fill = (key.getKey("left")) ? "red" : "white";
        rb.fill = (key.getKey("right")) ? "red" : "white";

        if (player.bottom > SCREEN_HEIGHT) {
            SoundManager.stopMusic();
            AssetManager.get('sound', 'gameover').play();
            this.exit('scene03');
        }

    },

    collisionY: function () {
        var player = this.player;
        // 床に乗っている場合は強引に当たり判定を作る
        var vy = player.physical.velocity.y === 0 ? 4 : player.physical.velocity.y;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroup.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.bottom = block.top;
                // 移動量
                player.physical.velocity.y = -JUMP_POWER;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionT: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.top, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupT.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.top = block.bottom;
                // 移動量
                player.physical.velocity.y *= -1;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionR: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupR.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x > 0) {
                    player.right = block.left;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();

                }
            }
        });
    },

    collisionL: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupL.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x < 0) {
                    player.left = block.right;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();
                }
            }
        });
    },

    goalDoor: function () {
        var player = this.player;
        var goal = this.goal;
        // 判定用の円
        var c1 = Circle(player.x, player.y, HIT_RADIUS);
        var r2 = Circle(goal.x, goal.y, HIT_RADIUS);

        // 円判定
        if (Collision.testCircleCircle(c1, r2)) {
            STAGE_FLAG = 4;
            STAGE += 1;
            save_states();
            AssetManager.get('sound', 'goal').play();
            this.exit();
        }
    },
});

phina.define("Stage04", {
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            // 画面サイズ指定
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // 背景色
        this.backgroundColor = 'black';
        this.shapeGroup = DisplayElement().addChildTo(this);
        this.shapeGroupR = DisplayElement().addChildTo(this);
        this.shapeGroupT = DisplayElement().addChildTo(this);
        this.shapeGroupL = DisplayElement().addChildTo(this);

        // カスタムGrid
        var grid = Grid(SCREEN_WIDTH, 10);
        // thisを退避
        var self = this;

        var shapeB1 = RectangleShape({
            x: 50, y: 500, width: 100, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB2 = RectangleShape({
            x: 110, y: 460, width: 20, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB3 = RectangleShape({
            x: 130, y: 420, width: 20, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB4 = RectangleShape({
            x: 145, y: 380, width: 10, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB5 = RectangleShape({
            x: 155, y: 340, width: 10, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB6 = RectangleShape({
            x: 165, y: 300, width: 10, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB7 = RectangleShape({
            x: 175, y: 260, width: 10, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB8 = RectangleShape({
            x: 185, y: 220, width: 10, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB9 = RectangleShape({
            x: 240, y: 220, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB10 = RectangleShape({
            x: 550, y: 500, width: 200, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeR1 = RectangleShape({
            x: 101, y: 484, width: 2, height: 40,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
            strokeWidth: 0
        }).addChildTo(this.shapeGroupR);
        var shapeR1 = RectangleShape({
            x: 121, y: 444, width: 2, height: 40,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
            strokeWidth: 0
        }).addChildTo(this.shapeGroupR);
        var shapeR1 = RectangleShape({
            x: 141, y: 404, width: 2, height: 40,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
            strokeWidth: 0
        }).addChildTo(this.shapeGroupR);
        var shapeR1 = RectangleShape({
            x: 151, y: 364, width: 2, height: 40,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
            strokeWidth: 0
        }).addChildTo(this.shapeGroupR);
        var shapeR1 = RectangleShape({
            x: 161, y: 324, width: 2, height: 40,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
            strokeWidth: 0
        }).addChildTo(this.shapeGroupR);
        var shapeR1 = RectangleShape({
            x: 171, y: 284, width: 2, height: 40,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
            strokeWidth: 0
        }).addChildTo(this.shapeGroupR);
        var shapeR1 = RectangleShape({
            x: 181, y: 244, width: 2, height: 40,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
            strokeWidth: 0
        }).addChildTo(this.shapeGroupR);

        // var shapeT1 = RectangleShape({
        //     x: 400, y: 308, width: 400, height: 8,
        //     fill: 'lightgray',
        //     padding:0,
        //     backgroundColor: 'black',
        // }).addChildTo(this.shapeGroupT);


        // var shapeR1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupR);

        // var shapeL1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupL);

        // goal設置
        this.goal = Goal().addChildTo(this);
        this.goal.x = 600;
        this.goal.bottom = 496;

        // プレイヤー作成
        this.player = Player().addChildTo(this);
        this.player.x = 50;
        this.player.bottom = 450;

        // bottan
        this.leftLabel = Label({
            text: "←",
            fill: "white"
        }).addChildTo(this).setPosition(40, 600);

        this.rightLabel = Label({
            text: "→",
            fill: "white"
        }).addChildTo(this).setPosition(600, 600);

        this.time_label = Label({
            text: '',
            fill: 'white',
            fontSize: 20,
            x: 10,
            y: 10,
        }).addChildTo(this);
        this.time_label.origin.set(0, 0);
        time_list[STAGE] = 0;  //     タイマー初期値
        // BGM
        SoundManager.playMusic('stage4');
        stagechange(4);
        stagedouki(this);
        p1watch(this, 'stage4');
    },
    // 更新処理
    update: function (app) {
        var player = this.player;
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;

        p1move(this, 'stage4');

        time_list[STAGE] += app.deltaTime;
        tl.text = 'STAGE ' + STAGE + ',  Time : ' + Math.floor(time_list[STAGE] / 1000) + '.' + ('000' + time_list[STAGE] % 1000).slice(-3);


        //床、 壁当たったときの動き
        this.collisionY();
        this.collisionR();
        this.collisionL();
        this.collisionT();
        // 扉にあたったときの動き
        this.goalDoor();
        // タッチ操作可能
        lb.setInteractive(true);
        rb.setInteractive(true);
        // 
        lb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('left', true);
        });
        lb.on('pointend', function () {
            // alert('touched!');
            key.setKey('left', false);

        });
        rb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('right', true);
        });
        rb.on('pointend', function () {
            // alert('touched!');
            key.setKey('right', false);

        });
        lb.fill = (key.getKey("left")) ? "red" : "white";
        rb.fill = (key.getKey("right")) ? "red" : "white";

        if (player.bottom > SCREEN_HEIGHT) {
            SoundManager.stopMusic();
            AssetManager.get('sound', 'gameover').play();
            this.exit('scene03');
        }

    },

    collisionY: function () {
        var player = this.player;
        // 床に乗っている場合は強引に当たり判定を作る
        var vy = player.physical.velocity.y === 0 ? 4 : player.physical.velocity.y;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroup.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.bottom = block.top;
                // 移動量
                player.physical.velocity.y = -JUMP_POWER;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionT: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.top, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupT.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.top = block.bottom;
                // 移動量
                player.physical.velocity.y *= -1;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionR: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupR.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x > 0) {
                    player.right = block.left;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();

                }
            }
        });
    },

    collisionL: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupL.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x < 0) {
                    player.left = block.right;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();
                }
            }
        });
    },

    goalDoor: function () {
        var player = this.player;
        var goal = this.goal;
        // 判定用の円
        var c1 = Circle(player.x, player.y, HIT_RADIUS);
        var r2 = Circle(goal.x, goal.y, HIT_RADIUS);

        // 円判定
        if (Collision.testCircleCircle(c1, r2)) {
            STAGE_FLAG = 5;
            STAGE += 1;
            save_states();
            AssetManager.get('sound', 'goal').play();
            this.exit();
        }
    },
});

phina.define("Stage05", {
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            // 画面サイズ指定
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // 背景色
        this.backgroundColor = 'black';
        this.shapeGroup = DisplayElement().addChildTo(this);
        this.shapeGroupR = DisplayElement().addChildTo(this);
        this.shapeGroupT = DisplayElement().addChildTo(this);
        this.shapeGroupL = DisplayElement().addChildTo(this);

        // カスタムGrid
        var grid = Grid(SCREEN_WIDTH, 10);
        // thisを退避
        var self = this;

        var shapeB1 = RectangleShape({
            x: 50, y: 500, width: 100, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB2 = RectangleShape({
            x: 100, y: 460, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB2.tweener.moveBy(300, 80, 3000)
            .wait(1000)
            .moveBy(-300, -80, 3000)
            .wait(1000)
            .setLoop(true)
            .play();

        var shapeB10 = RectangleShape({
            x: 550, y: 500, width: 200, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        // var shapeR1 = RectangleShape({
        //     x: 141, y: 404, width: 2, height: 40,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupR);

        // var shapeT1 = RectangleShape({
        //     x: 400, y: 308, width: 400, height: 8,
        //     fill: 'lightgray',
        //     padding:0,
        //     backgroundColor: 'black',
        // }).addChildTo(this.shapeGroupT);


        // var shapeR1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupR);

        // var shapeL1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupL);

        // goal設置
        this.goal = Goal().addChildTo(this);
        this.goal.x = 600;
        this.goal.bottom = 496;

        // プレイヤー作成
        this.player = Player().addChildTo(this);
        this.player.x = 50;
        this.player.bottom = 450;

        // bottan
        this.leftLabel = Label({
            text: "←",
            fill: "white"
        }).addChildTo(this).setPosition(40, 600);

        this.rightLabel = Label({
            text: "→",
            fill: "white"
        }).addChildTo(this).setPosition(600, 600);

        this.time_label = Label({
            text: '',
            fill: 'white',
            fontSize: 20,
            x: 10,
            y: 10,
        }).addChildTo(this);
        this.time_label.origin.set(0, 0);
        time_list[STAGE] = 0;  //     タイマー初期値
        // BGM
        SoundManager.playMusic('stage5');
        stagechange(5);
        stagedouki(this);
        p1watch(this, 'stage5');
        
    },
    // 更新処理
    update: function (app) {
        var player = this.player;
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;

        p1move(this, 'stage5');

        time_list[STAGE] += app.deltaTime;
        tl.text = 'STAGE ' + STAGE + ',  Time : ' + Math.floor(time_list[STAGE] / 1000) + '.' + ('000' + time_list[STAGE] % 1000).slice(-3);


        //床、 壁当たったときの動き
        this.collisionY();
        this.collisionR();
        this.collisionL();
        this.collisionT();
        // 扉にあたったときの動き
        this.goalDoor();
        // タッチ操作可能
        lb.setInteractive(true);
        rb.setInteractive(true);
        // 
        lb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('left', true);
        });
        lb.on('pointend', function () {
            // alert('touched!');
            key.setKey('left', false);

        });
        rb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('right', true);
        });
        rb.on('pointend', function () {
            // alert('touched!');
            key.setKey('right', false);

        });
        lb.fill = (key.getKey("left")) ? "red" : "white";
        rb.fill = (key.getKey("right")) ? "red" : "white";

        if (player.bottom > SCREEN_HEIGHT) {
            SoundManager.stopMusic();
            AssetManager.get('sound', 'gameover').play();
            this.exit('scene03');
        }

    },

    collisionY: function () {
        var player = this.player;
        // 床に乗っている場合は強引に当たり判定を作る
        var vy = player.physical.velocity.y === 0 ? 4 : player.physical.velocity.y;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroup.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.bottom = block.top;
                // 移動量
                player.physical.velocity.y = -JUMP_POWER;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionT: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.top, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupT.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.top = block.bottom;
                // 移動量
                player.physical.velocity.y *= -1;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionR: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupR.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x > 0) {
                    player.right = block.left;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();

                }
            }
        });
    },

    collisionL: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupL.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x < 0) {
                    player.left = block.right;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();
                }
            }
        });
    },

    goalDoor: function () {
        var player = this.player;
        var goal = this.goal;
        // 判定用の円
        var c1 = Circle(player.x, player.y, HIT_RADIUS);
        var r2 = Circle(goal.x, goal.y, HIT_RADIUS);

        // 円判定
        if (Collision.testCircleCircle(c1, r2)) {
            STAGE_FLAG = 5;
            STAGE += 1;
            save_states();
            AssetManager.get('sound', 'goal').play();
            this.exit('clear');
        }
    },
});

phina.define("Versus", {
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit({
            // 画面サイズ指定
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // 背景色
        this.backgroundColor = 'black';
        this.shapeGroup = DisplayElement().addChildTo(this);
        this.shapeGroupR = DisplayElement().addChildTo(this);
        this.shapeGroupT = DisplayElement().addChildTo(this);
        this.shapeGroupL = DisplayElement().addChildTo(this);

        // カスタムGrid
        var grid = Grid(SCREEN_WIDTH, 10);
        // thisを退避
        var self = this;

        var shapeB0 = RectangleShape({
            x: 320, y: 80, width: 440, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeT0 = RectangleShape({
            x: 320, y: 88, width: 440, height: 8,
            fill: 'rgb(180,180,180)',
            padding:0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);

        var shapeB0 = RectangleShape({
            x: 330, y: 440, width: 320, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB1 = RectangleShape({
            x: 320, y: 508, width: 640, height: 20,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        var shapeB2l = RectangleShape({
            x: 210, y: 380, width: 80, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB2l.tweener.moveBy(240, 0, 4000)
            .wait(1000)
            .moveBy(-240, 0, 4000)
            .wait(1000)
            .setLoop(true)
            .play();
        var shapeT2l = RectangleShape({
            x: 210, y: 388, width: 80, height: 8,
            fill: 'rgb(180,180,180)',
            padding:0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);
         shapeT2l.tweener.moveBy(240, 0, 4000)
            .wait(1000)
            .moveBy(-240, 0, 4000)
            .wait(1000)
            .setLoop(true)
            .play();

        var shapeB2r = RectangleShape({
            x: 450, y: 260, width: 80, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB2r.tweener.moveBy(-240, -0, 4000)
            .wait(1000)
            .moveBy(240, 0, 4000)
            .wait(1000)
            .setLoop(true)
            .play();
        var shapeT2r = RectangleShape({
            x: 450, y: 268, width: 80, height: 8,
            fill: 'rgb(180,180,180)',
            padding:0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);
         shapeT2r.tweener.moveBy(-240, -0, 4000)
            .wait(1000)
            .moveBy(240, 0, 4000)
            .wait(1000)
            .setLoop(true)
            .play();



        var shapeB3l = RectangleShape({
            x: 120, y: 470, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB3r = RectangleShape({
            x: 540, y: 470, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        // var shapeB4l = RectangleShape({
        //     x: 30, y: 440, width: 40, height: 8,
        //     fill: 'white',
        //     padding: 0,
        //     backgroundColor: 'black',
        // }).addChildTo(this.shapeGroup);

        var shapeB4r = RectangleShape({
            x: 610, y: 440, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB5l = RectangleShape({
            x: 120, y: 410, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB5r = RectangleShape({
            x: 540, y: 410, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        // var shapeB6l = RectangleShape({
        //     x: 30, y: 380, width: 40, height: 8,
        //     fill: 'white',
        //     padding: 0,
        //     backgroundColor: 'black',
        // }).addChildTo(this.shapeGroup);

        var shapeB6r = RectangleShape({
            x: 610, y: 380, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB7l = RectangleShape({
            x: 120, y: 350, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB7r = RectangleShape({
            x: 540, y: 350, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        // var shapeB8l = RectangleShape({
        //     x: 30, y: 320, width: 40, height: 8,
        //     fill: 'white',
        //     padding: 0,
        //     backgroundColor: 'black',
        // }).addChildTo(this.shapeGroup);

        var shapeB8r = RectangleShape({
            x: 610, y: 320, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB7l = RectangleShape({
            x: 120, y: 290, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB7r = RectangleShape({
            x: 540, y: 290, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeB8l = RectangleShape({
            x: 30, y: 260, width: 40, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        // var shapeB8r = RectangleShape({
        //     x: 610, y: 260, width: 40, height: 8,
        //     fill: 'white',
        //     padding: 0,
        //     backgroundColor: 'black',
        // }).addChildTo(this.shapeGroup);


        var shapeB8 = RectangleShape({
            x: 330, y: 320, width: 320, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);

        var shapeT8 = RectangleShape({
            x: 330, y: 328, width: 320, height: 8,
            fill: 'rgb(180,180,180)',
            padding:0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);

        var shapeB21b = RectangleShape({
            x: 50, y: 120, width: 80, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB21b.tweener.moveBy(540, 0, 6000)
            .moveBy(0, 40, 2000)
            .moveBy(-540, 0, 6000)
            .moveBy(0, -40, 2000)
            .setLoop(true)
            .play();
        
        var shapeT21b = RectangleShape({
            x: 50, y: 128, width: 80, height: 8,
            fill: 'rgb(180,180,180)',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);
        shapeT21b.tweener.moveBy(540, 0, 6000)
            .moveBy(0, 40, 2000)
            .moveBy(-540, 0, 6000)
            .moveBy(0, -40, 2000)
            .setLoop(true)
            .play();

        var shapeB23b = RectangleShape({
            x: 590, y: 150, width: 80, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB23b.tweener.moveBy(-540, 0, 6000)
            .moveBy(0, -40, 2000)
            .moveBy(540, 0, 6000)
            .moveBy(0, 40, 2000)
            .setLoop(true)
            .play();
        var shapeT23b = RectangleShape({
            x: 590, y: 158, width: 80, height: 8,
            fill: 'rgb(180,180,180)',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);
        shapeT23b.tweener.moveBy(-540, 0, 6000)
            .moveBy(0, -40, 2000)
            .moveBy(540, 0, 6000)
            .moveBy(0, 40, 2000)
            .setLoop(true)
            .play();
        
        var shapeB22b = RectangleShape({
            x: 500, y: 190, width: 100, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB22b.tweener.moveBy(-360, 0, 6000)
            .moveBy(360, 0, 6000)
            .setLoop(true)
            .play();

        var shapeT22b = RectangleShape({
            x: 500, y: 198, width: 100, height: 8,
            fill: 'rgb(180,180,180)',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);
        shapeT22b.tweener.moveBy(-360, 0, 6000)
            .moveBy(360, 0, 6000)
            .setLoop(true)
            .play();

        var shapeB23b = RectangleShape({
            x: 140, y: 225, width: 120, height: 8,
            fill: 'white',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroup);
        shapeB23b.tweener.moveBy(360, 0, 6000)
            .moveBy(-360, 0, 6000)
            .setLoop(true)
            .play();

        var shapeT23b = RectangleShape({
            x: 140, y: 233, width: 120, height: 8,
            fill: 'rgb(180,180,180)',
            padding: 0,
            backgroundColor: 'black',
        }).addChildTo(this.shapeGroupT);
        shapeT23b.tweener.moveBy(360, 0, 6000)
            .moveBy(-360, 0, 6000)
            .setLoop(true)
            .play();


        // var shapeB10 = RectangleShape({
        //     x: 550, y: 500, width: 200, height: 8,
        //     fill: 'white',
        //     padding: 0,
        //     backgroundColor: 'black',
        // }).addChildTo(this.shapeGroup);

        // var shapeR1 = RectangleShape({
        //     x: 141, y: 404, width: 2, height: 40,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupR);

        // var shapeT1 = RectangleShape({
        //     x: 400, y: 308, width: 400, height: 8,
        //     fill: 'lightgray',
        //     padding:0,
        //     backgroundColor: 'black',
        // }).addChildTo(this.shapeGroupT);


        // var shapeR1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupR);

        // var shapeL1 = RectangleShape({
        //     x: 400, y: 486, width: 2, height: 36,
        //     fill: 'white',
        //     padding:0,
        //     backgroundColor: 'black',
        //     strokeWidth:0
        // }).addChildTo(this.shapeGroupL);

        // goal設置
        this.goal = Goal().addChildTo(this);
        this.goal.x = 320;
        this.goal.bottom = 80;

        // プレイヤー作成
        this.player = Player().addChildTo(this);
        this.player.x = 50;
        this.player.bottom = 450;

        this.player02 = Player02().addChildTo(this);
        this.player02.x = 590;
        this.player02.bottom = 450;

        // bottan
        this.leftLabel = Label({
            text: "←",
            fill: "white"
        }).addChildTo(this).setPosition(40, 600);

        this.rightLabel = Label({
            text: "→",
            fill: "white"
        }).addChildTo(this).setPosition(600, 600);

        this.time_label = Label({
            text: '',
            fill: 'white',
            fontSize: 20,
            x: 10,
            y: 10,
        }).addChildTo(this);
        this.time_label.origin.set(0, 0);
        timer = 0;  //     タイマー初期値
        // BGM
        SoundManager.playMusic('vs');
        stagechange('versus');

        var PL1 = this.player;
        var PL2 = this.player02;

        if (yplay != 2) {
            firebase.database().ref(SVR + '/P2').on('value', function (data) {
                const v2 = data.val();
                const k = data.key;
                PL2.x = v2.x;
                PL2.y = v2.y;
                PL2.physical.velocity.x = v2.vx;
                PL2.physical.velocity.y = v2.vy;
            });
            firebase.database().ref(SVR + '/goal').on('value', function (data) {
                const g = data.val();
                if (g == 2) { self.exit(); }
            });
        }
        if (yplay != 1) {
            firebase.database().ref(SVR + '/P1').on('value', function (data) {
                const v1 = data.val();
                const k = data.key;
                PL1.x = v1.x;
                PL1.y = v1.y;
                PL1.physical.velocity.x = v1.vx;
                PL1.physical.velocity.y = v1.vy;
            });
            firebase.database().ref(SVR + '/goal').on('value', function (data) {
                const g = data.val();
                if (g == 1) { self.exit(); }
            });
        }
        firebase.database().ref(SVR + '/goal').on('value', function (data) {
            const v = data.val();
            // console.log('v:' + v +', yplay:'+ yplay);
            if ((v == 1 && yplay == 2) || (v == 2 && yplay == 1)) {
                self.exit('lose');
            } else if (v != 0) {
                self.exit('clear');
            }
        });

    },
    // 更新処理
    update: function (app) {
        var player = this.player;
        var player02 = this.player02;
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;

        timer += app.deltaTime;
        tl.text = 'VERSUS STAGE, Time : ' + Math.floor(timer / 1000) + '.' + ('000' + timer % 1000).slice(-3);

        // firebaseにデータ送信
        if (yplay == 1) {
            let prop1 = {
                x: player.x,
                y: player.y,
                vx: player.physical.velocity.x,
                vy: player.physical.velocity.y
            };
            firebase.database().ref(SVR + '/P1').set(prop1);
        }
        if (yplay == 2) {
            let prop2 = {
                x: player02.x,
                y: player02.y,
                vx: player02.physical.velocity.x,
                vy: player02.physical.velocity.y
            };
            firebase.database().ref(SVR + '/P2').set(prop2);
        }

        //床、 壁当たったときの動き
        this.collisionY();
        this.collisionR();
        this.collisionL();
        this.collisionT();
        // 扉にあたったときの動き
        this.goalDoor();
        // タッチ操作可能
        lb.setInteractive(true);
        rb.setInteractive(true);
        // 
        lb.on('pointstart', function () {
            // alert('touched!');
            // if(yplay == pl)
            key.setKey('left', true);
        });
        lb.on('pointend', function () {
            // alert('touched!');
            key.setKey('left', false);

        });
        rb.on('pointstart', function () {
            // alert('touched!');
            key.setKey('right', true);
        });
        rb.on('pointend', function () {
            // alert('touched!');
            key.setKey('right', false);

        });
        lb.fill = (key.getKey("left")) ? "red" : "white";
        rb.fill = (key.getKey("right")) ? "red" : "white";

        if (player.bottom > SCREEN_HEIGHT) {
            SoundManager.stopMusic();
            AssetManager.get('sound', 'gameover').play();
            this.exit('scene03');
        }

    },

    collisionY: function () {
        var player = this.player;
        var player02 = this.player02;

        // 床に乗っている場合は強引に当たり判定を作る
        var vy = player.physical.velocity.y === 0 ? 4 : player.physical.velocity.y;
        var vy2 = player02.physical.velocity.y === 0 ? 4 : player02.physical.velocity.y;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        var rect02 = Rect(player02.left, player02.bottom, player02.width, player02.height);

        // ブロックグループをループ
        this.shapeGroup.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.bottom = block.top;
                // 移動量
                player.physical.velocity.y = -JUMP_POWER;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
            if (Collision.testRectRect(rect02, block)) {
                // 位置調整
                player02.bottom = block.top;
                // 移動量
                player02.physical.velocity.y = -JUMP_POWER;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionT: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.top, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupT.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 位置調整
                player.top = block.bottom;
                // 移動量
                player.physical.velocity.y *= -1;
                // 効果音
                AssetManager.get('sound', 'kachi').play();
            }
        });
    },

    collisionR: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupR.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x > 0) {
                    player.right = block.left;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();

                }
            }
        });
    },

    collisionL: function () {
        var player = this.player;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.bottom, player.width, player.height);
        // ブロックグループをループ
        this.shapeGroupL.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                if (player.physical.velocity.x < 0) {
                    player.left = block.right;
                    player.physical.velocity.x *= -1;
                    // 効果音
                    AssetManager.get('sound', 'kachi').play();
                }
            }
        });
    },

    goalDoor: function () {
        var player = this.player;
        var player02 = this.player02;
        var goal = this.goal;
        // 判定用の円
        var c1 = Circle(player.x, player.y, HIT_RADIUS);
        var c2 = Circle(player02.x, player02.y, HIT_RADIUS);
        var r2 = Circle(goal.x, goal.y, HIT_RADIUS);

        // 円判定
        if (Collision.testCircleCircle(c1, r2)) {
            if (yplay == 1) {
                AssetManager.get('sound', 'goal').play();
                this.exit('win');
                const g_flg = 1;
                const x1 = 50;
                const y1 = 450;
                const prop1 = {
                    x: x1,
                    y: y1,
                    vx: 0,
                    vy: 0
                };
                const x2 = 590;
                const y2 = 450;
                const prop2 = {
                    x: x2,
                    y: y2,
                    vx: 0,
                    vy: 0
                };
                firebase.database().ref(SVR + '/goal').set(g_flg);
                firebase.database().ref(SVR + '/P1').set(prop1);
                firebase.database().ref(SVR + '/P2').set(prop2);
            }
        }
        if (Collision.testCircleCircle(c2, r2)) {
            if (yplay == 2) {
                AssetManager.get('sound', 'goal').play();
                this.exit('win');
                const g_flg = 2;
                const x1 = 50;
                const y1 = 450;
                const prop1 = {
                    x: x1,
                    y: y1,
                    vx: 0,
                    vy: 0

                };
                const x2 = 590;
                const y2 = 450;
                const prop2 = {
                    x: x2,
                    y: y2,
                    vx: 0,
                    vy: 0
                };
                firebase.database().ref(SVR + '/goal').set(g_flg);
                firebase.database().ref(SVR + '/P1').set(prop1);
                firebase.database().ref(SVR + '/P2').set(prop2);
            }
        }
        if (Collision.testCircleCircle(c1, c2)) {
            AssetManager.get('sound', 'kachi').play();
            if (player.physical.velocity.x * player02.physical.velocity.x < 0) {
                player.physical.velocity.x *= -1;
                player02.physical.velocity.x *= -1;
            } else {
                var tmp_v = player.physical.velocity.x
                player.physical.velocity.x = player02.physical.velocity.x;
                player02.physical.velocity.x = tmp_v;
            }
        }
    },

});
/*
 * goalクラス
 */
phina.define("Goal", {
    // 継承
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('goal', GOAL_SIZE_X, GOAL_SIZE_Y);
    },
});

/*
 * logoクラス
 */
phina.define("Logo", {
    // 継承
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('logo', LOGO_SIZE_X, LOGO_SIZE_Y);
    },
});

/*
 * playerクラス
 */
phina.define('Player', {
    // 継承
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('ball', PLAYER_SIZE_X / 2, PLAYER_SIZE_Y / 2);
        this.physical.velocity.x = 0;
        this.physical.gravity.y = GRAVITY;


    },
    // 更新処理
    update: function (app) {
        var key = app.keyboard;
        if ((key.getKey('left') && yplay == 1) || key.getKey('q')) {
            this.scaleX = 1;
            if (this.physical.velocity.x >= -PLAYER_SPEED_MAX) {
                this.physical.velocity.x -= PLAYER_SPEED;
            }
        }

        if ((key.getKey('right') && yplay == 1) || key.getKey('w')) {
            this.scaleX = 1;
            if (this.physical.velocity.x <= PLAYER_SPEED_MAX) {
                this.physical.velocity.x += PLAYER_SPEED;
            }
        }

        if (this.left < 0) {
            // 位置補正
            this.left = 0;
            // 反転処理
            this.reflectX();
        }
        // 画面右
        if (this.right > SCREEN_WIDTH) {
            this.right = SCREEN_WIDTH;
            this.reflectX();
        }

    },

    // 反転処理
    reflectX: function () {
        // 移動方向反転
        this.physical.velocity.x *= -1;
        // 向き反転
        this.scaleX *= -1;
        AssetManager.get('sound', 'kabe').play();
    },
});

/*
 * player2クラス
 */
phina.define('Player02', {
    // 継承
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('ball', PLAYER_SIZE_X / 2, PLAYER_SIZE_Y / 2);
        this.physical.velocity.x = 0;
        this.physical.gravity.y = GRAVITY;


    },
    // 更新処理
    update: function (app) {
        var key = app.keyboard;
        if ((key.getKey('left') && yplay == 2) || key.getKey('o')) {
            this.scaleX = 1;
            if (this.physical.velocity.x >= -PLAYER_SPEED_MAX) {
                this.physical.velocity.x -= PLAYER_SPEED;
            }
        }

        if ((key.getKey('right') && yplay == 2) || key.getKey('p')) {
            this.scaleX = 1;
            if (this.physical.velocity.x <= PLAYER_SPEED_MAX) {
                this.physical.velocity.x += PLAYER_SPEED;
            }
        }

        if (this.left < 0) {
            // 位置補正
            this.left = 0;
            // 反転処理
            this.reflectX();
        }
        // 画面右
        if (this.right > SCREEN_WIDTH) {
            this.right = SCREEN_WIDTH;
            this.reflectX();
        }

    },

    // 反転処理
    reflectX: function () {
        // 移動方向反転
        this.physical.velocity.x *= -1;
        // 向き反転
        this.scaleX *= -1;
        AssetManager.get('sound', 'kabe').play();
    },
});

/*
 * その他の画面
 */
phina.define('Scene01', { // スタートメニュー画面
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        load_states();
        this.backgroundColor = 'black';

        this.logo = Logo().addChildTo(this);
        this.logo.x = 320;
        this.logo.bottom = 300;

        this.stLabel = Label({
            text: 'NEW GAME',
            fontSize: 32,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), 350)
        this.ldLabel = Label({
            text: 'LOAD GAME',
            fontSize: 32,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), 420);
        this.rcLabel = Label({
            text: 'RECORD',
            fontSize: 32,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), 490);
        this.vsLabel = Label({
            text: 'VERSUS',
            fontSize: 32,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), 560);

        stagechange(0);
        stagedouki(this);
    },

    update: function (app) {
        var key = app.keyboard;
        var self = this
        var st = this.stLabel;
        var ld = this.ldLabel;
        var rc = this.rcLabel;
        var vs = this.vsLabel;
        // タッチ操作可能
        st.setInteractive(true);
        ld.setInteractive(true);
        rc.setInteractive(true);
        vs.setInteractive(true);
        // 
        st.on('pointstart', function () {
            STAGE = 1;
            self.exit();
        });
        ld.on('pointstart', function () {
            self.exit('scene02');
        });
        rc.on('pointstart', function () {
            self.exit('record');
        });
        vs.on('pointstart', function () {
            self.exit('versus');
        });
        if (key.getKey('2')) {
            STAGE = 2;
            this.exit('stage' + STAGE);
        }
        if (key.getKey('3')) {
            STAGE = 3;
            this.exit('stage' + STAGE);
        }
        if (key.getKey('4')) {
            STAGE = 4;
            this.exit('stage' + STAGE);
        }
        if (key.getKey('5')) {
            STAGE = 5;
            this.exit('stage' + STAGE);
        }
        if (key.getKey('6')) {
            this.exit('versus');
        }
    },
});

phina.define('Scene02', { // ロード画面
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        this.backgroundColor = 'black'

        var NUM = Number(STAGE_FLAG) + 1;
        var self = this;
        var xx = 0;
        var yy = 0;

        this.labelGroup = DisplayElement().addChildTo(this);

        (NUM).times(function (i) {
            xx = Math.floor(i / 15) + 1
            yy = yy + 1
            if (yy == 16) {
                yy = 1;
            }

            if (i >= 1) {
                var stSelect = Label({
                    text: 'ST_' + i,
                    fontSize: 20,
                    fill: 'white'
                }).addChildTo(self.labelGroup).setPosition(80 * xx, 40 * yy).setInteractive(true);
                stSelect.on('pointstart', function () {
                    STAGE = i
                    self.exit('stage' + i);
                });
            }

            if (i == 0) {
                var modoru = Label({
                    text: '戻る',
                    fontSize: 24,
                    fill: 'white'
                }).addChildTo(self).setPosition(80, 40).setInteractive(true);
                modoru.on('click', function () {
                    self.exit();
                })
            }
        });
        stagedouki(this);

    },


});

phina.define('Scene03', { // gameover 画面
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        this.backgroundColor = 'black'
        Label({
            text: 'GAME OVER',
            fontSize: 48,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
        stagechange('scene03');
        stagedouki(this);
    },

    onpointstart: function () {
        this.exit();
    }
});

phina.define('Record', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        this.backgroundColor = 'black'

        var self = this;
        var xx = 0;
        var yy = 0;

        this.labelGroup = DisplayElement().addChildTo(this);

        (100).times(function (i) {
            xx = Math.floor(i / 25) + 1
            yy = yy + 1
            if (yy == 26) {
                yy = 1;
            }
            if (i == 0) {
                Label({
                    text: 'RECORD',
                    fontSize: 20,
                    fill: 'yellow',
                    x: 5,
                    y: -2
                }).addChildTo(self.labelGroup).origin.set(0, 0);
            }
            if (i >= 1) {
                var label = Label({
                    text: 'ST_' + i + ' : ' + Math.floor(time_list[i] / 10) / 100,
                    fontSize: 16,
                    fill: 'white'
                }).addChildTo(self.labelGroup).setPosition(150 * (xx - 1) + 10, 25 * (yy - 1));
                label.origin.set(0, 0);
            }
        });
        stagedouki(this);

    },

    onpointstart: function () {
        this.exit();
    }
});

phina.define('Clear', { // clear画面
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        this.backgroundColor = 'black'

        SoundManager.playMusic('fanfare');
        Label({
            text: 'GAME CLEAR! \n\n CONGRATULATION!!',
            fontSize: 48,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
        stagechange('clear');
        stagedouki(this);
    },

    onpointstart: function () {
        this.exit();
    }
});

phina.define('Win', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        this.backgroundColor = 'black'
        SoundManager.playMusic('fanfare');
        Label({
            text: 'WIN!',
            fontSize: 48,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
        stagedouki(this);
    },
    onpointstart: function () {
        this.exit();
    }
});

phina.define('Lose', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        this.backgroundColor = 'black'
        SoundManager.stopMusic();
        AssetManager.get('sound', 'lose').play();
        Label({
            text: 'LOSE',
            fontSize: 48,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
        stagedouki(this);
    },

    onpointstart: function () {
        this.exit();
    }
});

phina.define('Start', { // start画面
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        this.backgroundColor = 'black'

        Label({
            text: 'click start',
            fontSize: 24,
            fill: 'white'
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
        firebase.database().ref(SVR + '/goal').set(0);
        stagechange('start');
        stagedouki(this);
    },

    onpointstart: function () {
        SoundManager.playMusic('menu');
        this.exit();
    }
});
/*
 * メイン処理
 */
phina.main(function () {
    // アプリケーションを生成
    var app = GameApp({
        // メインシーンから開始
        startLabel: 'start',
        fit: false,
        // 画面サイズ指定
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        // アセット読み込み
        assets: ASSETS,

        scenes: [
            {
                className: 'Scene01',
                label: 'scene01',
                nextLabel: 'stage1',
            }, {
                className: 'Stage01',
                label: 'stage1',
                nextlabel: 'stage2',
            }, {
                className: 'Stage02',
                label: 'stage2',
                nextlabel: 'stage3',
            }, {
                className: 'Stage03',
                label: 'stage3',
                nextlabel: 'stage4',
            }, {
                className: 'Stage04',
                label: 'stage4',
                nextlabel: 'stage5',
            }, {
                className: 'Stage05',
                label: 'stage5',
                nextlabel: 'stage6',
            }, {
                className: 'Stage06',
                label: 'stage6',
                nextlabel: 'stage7',
            }, {
                className: 'Scene02',
                label: 'scene02',
                nextLabel: 'scene01',
            }, {
                className: 'Scene03',
                label: 'scene03',
                nextLabel: 'scene01',
            }, {
                className: 'Record',
                label: 'record',
                nextLabel: 'scene01',
            }, {
                className: 'Clear',
                label: 'clear',
                nextLabel: 'start',
            }, {
                className: 'Start',
                label: 'start',
                nextLabel: 'scene01',
            }, {
                className: 'Versus',
                label: 'versus',
                nextLabel: 'lose',
            }, {
                className: 'Win',
                label: 'win',
                nextLabel: 'start',
            }, {
                className: 'Lose',
                label: 'lose',
                nextLabel: 'start',
            },
        ]
    });
    // 実行
    app.run();
});


function save_states() {
    let name
    if (!$('#name').val()) { name = 'NO_NAME'; } else { name = $('#name').val(); }

    let st_value = STAGE_FLAG;
    let svd_st_value // 'firebaseの特定のキーから取得される';
    firebase.database().ref(name + '/' + st_key).on('value', function (data) {
        svd_st_value = data.val()
    });

    if (st_value > svd_st_value) {
        firebase.database().ref(name + '/' + st_key).set(st_value);
    }

    let svd_time_value
    firebase.database().ref(SVR + '/' + time_key).on('value', function (data) {
        svd_time_value = data.val();
    });

    if (svd_time_value) {
        for (let i = 0; i < svd_time_value.length; i++) {
            if (svd_time_value[i] < time_list[i]) {
                time_list[i] = svd_time_value[i];
            }
        }
    }

    let time_value = time_list;
    firebase.database().ref(SVR + '/' + time_key).set(time_value);

}

function load_states() {
    let name
    if (!$('#name').val()) { name = 'NO_NAME'; } else { name = $('#name').val(); }

    let svd_st_value // saveデータ（ステージ進度）
    firebase.database().ref(name + '/' + st_key).on('value', function (data) {
        svd_st_value = data.val();
    }); //localStorage.getItem(st_key);と同じ

    if (svd_st_value) {
        STAGE_FLAG = svd_st_value;
    }

    let svd_time_value
    firebase.database().ref(SVR + '/' + time_key).on('value', function (data) {
        svd_time_value = data.val();
    }); //localStorage.getItem(time_key);

    if (svd_time_value) {
        time_list = svd_time_value;
    }
}


// ログイン情報取扱

$('#pl01').on('click', function () {
    let name
    if (!$('#name').val()) { name = 'NO_NAME'; } else { name = $('#name').val(); }
    const D = new Date()
    const dt = D.getMonth() + '/' + D.getDate() + ', ' + D.getHours() + ':' + D.getMinutes();
    if (yplay != 1) {
        if (yplay == 2) {
            let absent = {
                name: 'absent',
                dt: dt,
                player: 0
            }
            firebase.database().ref(SVR + '/player0' + yplay).set(absent)
        }
        yplay = 1;

        const room = 'player0' + yplay;
        const you = {
            name: name,
            player: yplay,
            dt: dt,
        }
        firebase.database().ref(SVR + '/' + room).set(you);

        $('#pl01').css('background', 'linear-gradient(150deg, rgb(255, 255, 0), rgb(255, 200, 40))');
        $('#pl02').css('background', '');
        $('#gal').css('background', '');
        $('#txt').css('pointer-events', 'auto');
        $('#send').css('pointer-events', 'auto');
    }

});

$('#pl02').on('click', function () {
    let name
    if (!$('#name').val()) { name = 'NO_NAME'; } else { name = $('#name').val(); }
    const D = new Date()
    const dt = D.getMonth() + '/' + D.getDate() + ', ' + D.getHours() + ':' + D.getMinutes();
    if (yplay == 1) {
        let absent = {
            name: 'absent',
            dt: dt,
            player: 0
        }
        firebase.database().ref(SVR + '/player0' + yplay).set(absent)
    }

    yplay = 2;

    // let pl02_data;
    const room = 'player0' + yplay;
    const you = {
        name: name,
        player: yplay,
        dt: dt,
    }
    firebase.database().ref(SVR + '/' + room).set(you);
    // firebase.database().ref(Server+room).on('value', function(data){
    //     pl02_data = data.val();
    //     // pl02_data = data.key;
    // })

    $('#pl02').css('background', 'linear-gradient(150deg, rgb(255, 255, 0), rgb(255, 200, 40))');
    $('#pl01').css('background', '');
    $('#gal').css('background', '');
    $('#txt').css('pointer-events', 'auto');
    $('#send').css('pointer-events', 'auto');

});

$('#gal').on('click', function () {
    let name
    if (!$('#name').val()) { name = 'NO_NAME'; } else { name = $('#name').val(); }
    const room = 'audience';
    const D = new Date();
    const dt = D.getMonth() + '/' + D.getDate() + ', ' + D.getHours() + ':' + D.getMinutes();

    if (yplay != 3) {
        if (yplay == 1 || yplay == 2) {
            let absent = {
                name: 'absent',
                dt: dt,
                player: 0
            }
            firebase.database().ref(SVR + '/player0' + yplay).set(absent)
        }
        yplay = 3;

        const prop = 'in'
        // console.log(dt);
        const you = {
            name: name,
            player: yplay,
            dt: dt,
            prop: prop
        }
        firebase.database().ref(SVR + '/' + room + '/' + name).set(you);
        // firebase.database().ref(Server+room).on('value', function(data){
        //     pl02_data = data.val();
        //     // pl02_data = data.key;
        // })

        $('#gal').css('background', 'linear-gradient(150deg, rgb(0, 235, 235), rgb(80, 190, 255))');
        $('#pl02').css('background', '');
        $('#pl01').css('background', '');
        $('#txt').css('pointer-events', 'auto');
        $('#send').css('pointer-events', 'auto');
        // $('#csl_02').prepend(pl02_data)
        // $('#csl').prepend(pl02_data)
    } else {
        yplay = 0;
        const prop = 'out';
        const you = {
            name: name,
            player: yplay,
            dt: dt,
            prop: prop
        }
        firebase.database().ref(SVR + '/' + room + '/' + name).set(you);
        $('#gal').css('background', '');

        $('#txt').css('pointer-events', 'none');
        $('#send').css('pointer-events', 'none');

    }

});

firebase.database().ref(SVR + '/player01').on('value', function (data) {
    const v = data.val().name;
    const t = data.val().dt;
    const h = '<p>' + v + ', ' + t + '</p>';

    $('#csl_01').html(h);
    const messagesArea = document.getElementById('output');
    messagesArea.scrollTop = messagesArea.scrollHeight;

    if (v != 'absent' || !v) {
        $('#pl01').css('pointer-events', 'none');
        $('#pl01').css('background', '');
        $('#pl01').css('background-color', 'rgb(125, 125, 125)');
    } else {
        $('#pl01').css('pointer-events', 'auto');
        $('#pl01').css('background-color', '');
        $('#pl01').css('background', '');
    }
});

firebase.database().ref(SVR + '/player02').on('value', function (data) {
    const v = data.val().name;
    const t = data.val().dt;
    const h = '<p>' + v + ', ' + t + '</p>';

    $('#csl_02').html(h);
    const messagesArea = document.getElementById('csl_02');
    messagesArea.scrollTop = messagesArea.scrollHeight;

    if (v != 'absent' || !v) {
        $('#pl02').css('pointer-events', 'none');
        $('#pl01').css('background-color', 'rgb(125, 125, 125)');
    } else {
        $('#pl02').css('pointer-events', 'auto');
        $('#pl02').css('background-color', '');
    }
});

firebase.database().ref(SVR + '/audience').on('child_changed', function (data) {
    const p = data.val().prop;
    const v = data.val().name;
    const t = data.val().dt;
    const h = '<p>' + p + ' - ' + v + ', ' + t + '</p>';
    $('#csl_03').prepend(h);
    const messagesArea = document.getElementById('csl_03');
    messagesArea.scrollTop = messagesArea.scrollHeight;
});

firebase.database().ref(SVR + '/audience').on('child_added', function (data) {
    const p = data.val().prop;
    const v = data.val().name;
    const t = data.val().dt;
    const h = '<p>' + p + ' - ' + v + ', ' + t + '</p>';

    if (p == 'in') {
        $('#csl_03').prepend(h);
        const messagesArea = document.getElementById('csl_03');
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
});

$(window).on('beforeunload', function () {

    const D = new Date();
    const dt = D.getMonth() + '/' + D.getDate() + ', ' + D.getHours() + ':' + D.getMinutes();

    if (yplay == 1 || yplay == 2) {
        let room = SVR + '/player0' + yplay;
        const you = {
            name: 'absent',
            dt: dt,
            player: 0
        }
        firebase.database().ref(room).set(you);
        if(yplay == 1){
            stagechange(0);
        }
    }
    let name
    if (!$('#name').val()) { name = 'NO_NAME'; } else { name = $('#name').val(); }
    const room2 = SVR + '/audience/' + name;
    const you2 = {
        name: name,
        dt: dt,
        player: 0,
        prop: 'out'
    }
    firebase.database().ref(room2).set(you2);
    // return 'ページを離れます';


});

// チャット機能
function send_chat() {
    let uname
    if (!$('#name').val()) { uname = 'NO_NAME'; } else { uname = $('#name').val(); }
    const text = $('#txt').val();
    const D = new Date();
    const dt = D.getMonth() + '/' + D.getDate() + ', ' + D.getHours() + ':' + D.getMinutes();
    const room = SVR + '/chatroom';
    const fsize = $('#fs').val();
    const fcolor = $('#fc').val();
    const fstyle = $('#fst').val();
    const fweight = $('#fw').val();
    const ffamily = $('#ff').val();
    const pheight = $('#ph').val();

    const msg = {
        uname: uname, // right : const uname
        text: text,
        date: dt,
        fsize: fsize,
        fcolor: fcolor,
        fstyle: fstyle,
        fweight: fweight,
        ffamily: ffamily,
        pheight: pheight
    }
    // console.log(msg.fsize);
    // console.log(msg.fcolor);
    firebase.database().ref(room).push(msg);

    document.getElementById('txt').value = null;
}



$('#send').on('click', function () {
    send_chat();
});

$('#txt').on('keydown', function (e) {
    if (e.keyCode == 13) {
        send_chat();
    }
});



// chatの箱に表示
firebase.database().ref(SVR + '/chatroom').on('child_added', function (data) {
    const v = data.val();
    const h = '<p class="namae">' + v.uname + ' : ' + v.date + '</p><p>' + v.text + '</p>';
    $('#output').append(h);

    const messagesArea = document.getElementById('output');
    messagesArea.scrollTop = messagesArea.scrollHeight;

    // let int_r = Math.floor(Math.random()*20);
    // let nico_id = '#nico_'+int_r;
    // const fsize = Number(v.fsize);
    // const fcolor = v.fcolor;
    // $(nico_id).append('<p class="p'+int_r+'">'+v.text+'</p>');
    // $('.p'+int_r).css({'font-size': fsize, 'color': fcolor });
    
});

firebase.database().ref(SVR + '/chatroom').on('value',function(data){
    const v = data.val();
    const count_comment = Object.keys(v).length;
    $('#kome').html(count_comment);

    const ch_obj    = Object.values(v)[count_comment-1]
    const fsize     = Number(ch_obj.fsize);
    const fcolor    = ch_obj.fcolor;
    const fstyle    = ch_obj.fstyle;
    const fweight   = Number(ch_obj.fweight);
    const ffamily   = ch_obj.ffamily;
    const pheight   = ch_obj.pheight;
    
    let int_r       = Math.floor(Math.random() * 20);
    if (pheight == 'top')    { int_r = 0; }
    if (pheight == 'center') { int_r = 10; }
    if (pheight == 'bottom') { int_r = 19; }
    let nico_id     = '#nico_' + int_r;
    
    $(nico_id).append('<p class="p'+ count_comment + '">' +ch_obj.text+'</p>');
    $('.p'+count_comment).css({
        'font-size': fsize, 
        'color': fcolor,
        'font-style': fstyle,
        'font-weight': fweight,
        'font-family': ffamily
    });

    // console.log(Object.values(v)[count_comment-1].text);
    // console.log(Object.values(v)[count_comment].text);
})

// hostの表示画面を共有する
function stagechange(st){
    if(yplay==1){
        const room = '/stage_now';
        const stage = 
        firebase.database().ref(SVR + room).set(st);
    }   
}

// audienceの画面をhostの画面と同じにする
function stagedouki(self){
    if(yplay!=1){
        const room = '/stage_now';
        firebase.database().ref(SVR + room).on('value',function(data){
            const v = data.val();
            let scene
            let stage
            if (v == 1 || v == 2 || v == 3 || v == 4 || v == 5) {
                scene = 'stage' + v;
                stage = v;
            } else {
                scene = v;
            }
            // console.log(scene);
            // console.log(stage);
            // console.log(self);
            if (scene!=0){
                self.exit(scene);
                // return stage;
            } 
        });
    }
}

function p1watch(self, stage){
    const PL1 = self.player
    if (yplay != 1) {
        firebase.database().ref(SVR + '/' + stage + '/P1').on('value', function (data) {
            const v1 = data.val();
            const k = data.key;
            PL1.x = v1.x;
            PL1.y = v1.y;
            PL1.physical.velocity.x = v1.vx;
            PL1.physical.velocity.y = v1.vy;
        });
    }
}

//動きをfirebaseに同期
function p1move(self, stage){
    const player = self.player;
    if (yplay == 1) {
        let prop1 = {
            x: player.x,
            y: player.y,
            vx: player.physical.velocity.x,
            vy: player.physical.velocity.y
        };
        firebase.database().ref(SVR +'/'+ stage +'/P1').set(prop1);
    }
}