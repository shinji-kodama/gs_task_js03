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

const SCREEN_WIDTH      = 640;  // 画面横サイズ
const SCREEN_HEIGHT     = 640;  // 画面縦サイズ
const PLAYER_SPEED      = 0.5;  //プレイヤーの速度
const PLAYER_SPEED_MAX  = 5;    //プレイヤーの速度
const JUMP_POWER        = 10;   // プレイヤーのジャンプ力
const GRAVITY           = 1;    // 重力
const PLAYER_SIZE_X     = 16;   // playerサイズ
const PLAYER_SIZE_Y     = 16;   // playerサイズ
const GOAL_SIZE_X       = 30;   // goalのサイズ
const GOAL_SIZE_Y       = 45;
const LOGO_SIZE_X       = 400;  // menu画面のロゴのサイズ
const LOGO_SIZE_Y       = 300;
const HIT_RADIUS        = 2;    // player当たり判定用の半径
const HIT_RADIUS_DOOR   = 20;   // ドア用

let time_list   = Array(100);       // 最短クリア時間格納用配列
const st_key    = 'STAGE_FLAG';     //firebaseにsetで送るためのkey
const time_key  = 'time';           //firebaseにsetで送るためのkey
let MODE                            //難易度 (今回は現状不使用)
let STAGE_FLAG  = 1;                //どこまで進んだか判定（localstrageから数字を読み込む）
let STAGE;                          // 現在のステージ
let query       = location.search;  // index.htmlから持ち越したurlデータを読み取り
let url_value   = query.split('='); // query内のデータを分ける 
let user_name   = url_value[1].split('?')[0]; // url内のname
let SVR         = url_value[2];               // urk内のserver名
let yplay       = 0;                          // ページ表示時のプレイヤー区分
document.getElementById('name').value = user_name;
load_states();
function initial_prop(self) { //背景色、shapegroup宣言
    self.superInit({width: SCREEN_WIDTH,height: SCREEN_HEIGHT,});
    self.backgroundColor = 'black';
    self.shapeGroup = DisplayElement().addChildTo(self);
    self.shapeGroupR = DisplayElement().addChildTo(self);
    self.shapeGroupL = DisplayElement().addChildTo(self);
    self.shapeGroupT = DisplayElement().addChildTo(self);

}
function set_shape(x, y, w, h, sg) {
    const shape = RectangleShape({
        x: x, y: y, width: w, height: h,
        fill: 'white', padding: 0, backgroundColor: 'black',
    }).addChildTo(sg);
    return shape
}
function set_goal(x, y, self){
    self.goal = Goal().addChildTo(self);
    self.goal.x = x;
    self.goal.bottom = y;
}
function set_player(x, y, self){
    self.player = Player().addChildTo(self);
    self.player.x = x;
    self.player.bottom = y;
}
function set_player2(x, y, self) {
    self.player02 = Player02().addChildTo(self);
    self.player02.x = x;
    self.player02.bottom = y;
}
function left_label(x, y, self){
    const ll = Label({
        text: "←",
        fill: "white"
    }).addChildTo(self).setPosition(x, y);
    return ll;
}
function right_label(x, y, self) {
    const rl = Label({
        text: "→",
        fill: "white"
    }).addChildTo(self).setPosition(x, y);
    return rl;
}
function time_label(x, y, self, st){
    const tl = Label({
        text: '',
        fill: 'white',
        fontSize: 20,
        x: x,
        y: y,
    }).addChildTo(self);
    tl.origin.set(0, 0);
    time_list[st] = 0;  //     タイマー初期値
    return tl;
}
function act_label(l, r, key){
    l.setInteractive(true);
    r.setInteractive(true);
    // 
    l.on('pointstart', function () {
        key.setKey('left', true);
    });
    l.on('pointend', function () {
        key.setKey('left', false);
    });
    r.on('pointstart', function () {
        key.setKey('right', true);
    });
    r.on('pointend', function () {
        key.setKey('right', false);
    });
    l.fill = (key.getKey("left")) ? "red" : "white";
    r.fill = (key.getKey("right")) ? "red" : "white";
}
function game_over(self){
    if (self.player.bottom > SCREEN_HEIGHT) {
        SoundManager.stopMusic();
        AssetManager.get('sound', 'gameover').play();
        self.exit('scene03')
    }
}
function col_y(self){
    var player = self.player;
    var vy = player.physical.velocity.y === 0 ? 4 : player.physical.velocity.y;
    var rect = Rect(player.left, player.bottom, player.width, player.height);
    // ブロックグループをループ
    self.shapeGroup.children.some(function (block) {
        if (Collision.testRectRect(rect, block)) {
            player.bottom = block.top;
            player.physical.velocity.y = -JUMP_POWER;
            AssetManager.get('sound', 'kachi').play();
        }
    });
}
function col_t(self){
    var player = self.player;
    var rect = Rect(player.left, player.top, player.width, player.height);
    self.shapeGroupT.children.some(function (block) {
        if (Collision.testRectRect(rect, block)) {
            player.top = block.bottom;
            player.physical.velocity.y *= -1;
            AssetManager.get('sound', 'kachi').play();
        }
    });
}
function col_l(self){
    var player = self.player;
    var rect = Rect(player.left, player.bottom, player.width, player.height);
    self.shapeGroupL.children.some(function (block) {
        if (Collision.testRectRect(rect, block)) {
            if (player.physical.velocity.x < 0) {
                player.left = block.right;
                player.physical.velocity.x *= -1;
                AssetManager.get('sound', 'kachi').play();
            }
        }
    });
}
function col_r(self){
    var player = self.player;
    var rect = Rect(player.left, player.bottom, player.width, player.height);
    self.shapeGroupR.children.some(function (block) {
        // ブロックとのあたり判定
        if (Collision.testRectRect(rect, block)) {
            if (player.physical.velocity.x > 0) {
                player.right = block.left;
                player.physical.velocity.x *= -1;
                AssetManager.get('sound', 'kachi').play();
            }
        }
    });
}
function get_goal(st_flg, st, self, next){
    const player = self.player;
    const goal = self.goal;
    const c1 = Circle(player.x, player.y, HIT_RADIUS);
    const c2 = Circle(goal.x, goal.y, HIT_RADIUS_DOOR);
    if (Collision.testCircleCircle(c1, c2)) {
        st += 1;
        st_flg = st
        save_states();
        AssetManager.get('sound', 'goal').play();
        self.exit(next);
        return [st_flg, st];
    }
}
function escapeHTML(string) {   //xss対策
    return string.replace(/\&/g, '&amp;')
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/\'/g, '&#x27');
}
function save_states() {
    let name
    if (!$('#name').val()) { name = 'NO_NAME'; } else { name = $('#name').val(); }
    const room = 'USER';
    let st_value = STAGE_FLAG;
    let svd_st_value // 'firebaseの特定のキーから取得される';
    firebase.database().ref(room +'/'+ name + '/' + st_key).on('value', function (data) {
        svd_st_value = data.val()
    });

    if (st_value > svd_st_value) {
        firebase.database().ref(room +'/'+ name + '/' + st_key).set(st_value);
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
    const room = 'USER';

    let svd_st_value // saveデータ（ステージ進度）
    firebase.database().ref(room +'/'+ name + '/' + st_key).on('value', function (data) {
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
function push_player_button(a, b, c) {
    const arr = name_date();
    let name = arr[0];
    const dt = arr[1];
    console.log(a, b, c, yplay);

    if (yplay != a) {
        if (yplay == 1 || yplay == 2) {
            player_set(yplay, 'absent', dt)
        }
        yplay = a
        if (a == 1 || a == 2) {
            player_set(yplay, name, dt)
            button_color(a, b, c);
        } else if (a == 3) {
            player_set_prop(yplay, name, dt, 'in')
            button_color(a, b, c);
        }
    } else if (yplay == 3) {
        player_set_prop(yplay, name, dt, 'out')
        yplay = 0;
        $('#pl03').css('background', '');
        $('#txt').css('pointer-events', 'none');
        $('#send').css('pointer-events', 'none');
    }
}
function player_set(a, b, c) {
    const room = SVR + '/player0' + a;
    const you = { name: b, dt: c, player: a }
    firebase.database().ref(room).set(you);
}
function player_set_prop(a, b, c, d) {
    if(a==3){
        const room = SVR + '/player0' + a + '/' + b;
        const you = { name: b, player: yplay, dt: c, prop: d }
        firebase.database().ref(room).set(you);
    }
}
function button_color(a, b, c) {
    $('#pl0' + a).css('background', 'linear-gradient(150deg, rgb(255, 255, 0), rgb(255, 200, 40))');
    $('#pl0' + b).css('background', '');
    $('#pl0' + c).css('background', '');
    $('#txt').css('pointer-events', 'auto');
    $('#send').css('pointer-events', 'auto');
}
function name_date() {
    let name;
    if (!$('#name').val()) { name = 'NO_NAME'; } else { name = $('#name').val(); }
    const D = new Date()
    const dt = D.getMonth() + '/' + D.getDate() + ', ' + D.getHours() + ':' + D.getMinutes();
    return [name, dt]
}
function csl_ind(a, b, c) {     // 画面下表示領域
    $('#csl_0' + a).html(c);
    const messagesArea = document.getElementById('output');
    messagesArea.scrollTop = messagesArea.scrollHeight;

    if (b != 'absent' || !b) {
        $('#pl0' + a).css('pointer-events', 'none');
        $('#pl0' + a).css('background-color', 'rgb(125, 125, 125)');
    } else {
        $('#pl0' + a).css('pointer-events', 'auto');
        $('#pl0' + a).css('background-color', '');
    }
}
function send_chat() {          // チャット機能
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
    firebase.database().ref(room).push(msg);
    document.getElementById('txt').value = null;
}
function stagechange(st) {      // hostの表示画面を共有する
    if (yplay == 1) {
        const room = '/stage_now';
        firebase.database().ref(SVR + room).set(st);
    }
}
function stagedouki(self) {     // audienceの画面をhostの画面と同じにする
    const room = '/stage_now';
    let scene
    let stage
    firebase.database().ref(SVR + room).on('value', function (data) {
        const v = data.val();
        if (v >= 1 && v <= 5) {
            scene = 'stage' + v;
            stage = v;
        } else {
            scene = v;
        }
    });
    if (yplay != 1) {
        if (scene != 0) {
            self.exit(scene);
            return stage;
        }
    }else{
        return stage;
    }
}
function p1watch(self, stage) {  //player1の動きをfirebaseからもらう
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
function p1move(pl, stage, num) {   //動きをfirebaseに同期
    if (yplay == num) {
        let prop = {
            x: pl.x,
            y: pl.y,
            vx: pl.physical.velocity.x,
            vy: pl.physical.velocity.y
        };
        firebase.database().ref(SVR + '/' + stage + '/P' + num).set(prop);
    }
}
/*
 * メインシーン
 */
phina.define("Stage01", {
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        initial_prop(this);
        const shape01 = set_shape(200, 500, 400, 8, this.shapeGroup);
        const shapeB2 = set_shape(519, 464, 240, 8, this.shapeGroup);
        const shapeB3 = set_shape(270, 430, 180, 8, this.shapeGroup);
        const shapeR1 = set_shape(400, 486, 2, 36, this.shapeGroupR);
        set_goal(200, 420, this);
        set_player(50,450, this);
        this.leftLabel = left_label(40, 600, this);
        this.rightLabel = right_label(600, 600, this);
        this.time_label = time_label(10, 10, this, 1)
        // BGM
        SoundManager.playMusic('stage1');
        stagechange(1);
        stagedouki(this);
        p1watch(this, 'stage1');
    },
    update: function (app) {
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;
        time_list[1] += app.deltaTime;
        tl.text = 'STAGE ' + 1 + ',  Time : ' + Math.floor(time_list[1] / 1000) + '.' + ('000' + time_list[1] % 1000).slice(-3);
        p1move(this.player, 'stage1', 1);
        this.collisionY();
        this.collisionR();
        this.goalDoor();
        act_label(lb, rb, key);
        game_over(this)
    },
    collisionY: function () {
        col_y(this);
    },
    collisionR: function () {
        col_r(this);
    },
    goalDoor: function () {
        const arr = get_goal(STAGE_FLAG, STAGE, this);
        STAGE_FLAG = 2
        // STAGE = arr[1];
    },

});
phina.define("Stage02", {
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        initial_prop(this);
        const shapeB1 = set_shape(100, 500, 180, 8, this.shapeGroup);
        const shapeB2 = set_shape(300, 500, 170, 8, this.shapeGroup);
        const shapeB3 = set_shape(500, 500, 160, 8, this.shapeGroup);
        set_goal(550, 496, this);
        set_player(50, 450, this);
        this.leftLabel = left_label(40, 600, this);
        this.rightLabel = right_label(600, 600, this);
        this.time_label = time_label(10, 10, this, 2)
        // BGM
        SoundManager.playMusic('stage2');
        stagechange(2);
        stagedouki(this);
        p1watch(this, 'stage2');
        console.log(STAGE)
    },
    // 更新処理
    update: function (app) {
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;
        time_list[2] += app.deltaTime;
        tl.text = 'STAGE ' + 2 + ',  Time : ' + Math.floor(time_list[2] / 1000) + '.' + ('000' + time_list[2] % 1000).slice(-3);
        p1move(this.player, 'stage2', 1);
        this.collisionY();
        this.collisionR();
        this.goalDoor();
        act_label(lb, rb, key);
        game_over(this)
    },
    collisionY: function () {
        col_y(this);
    },
    collisionR: function () {
        col_r(this);
    },
    goalDoor: function () {
        const arr = get_goal(STAGE_FLAG, STAGE, this);
        STAGE_FLAG = 3;
        // STAGE = arr[1];
    },
});
phina.define("Stage03", {
    superClass: 'DisplayScene',
    init: function () {
        initial_prop(this);
        const shapeB1 = set_shape(50, 500, 100, 8, this.shapeGroup);
        const shapeB2 = set_shape(170, 460, 100, 8, this.shapeGroup);
        const shapeB3 = set_shape(100, 420, 50, 8, this.shapeGroup);
        const shapeB4 = set_shape(150, 380, 50, 8, this.shapeGroup);
        const shapeB5 = set_shape(200, 340, 60, 8, this.shapeGroup);
        const shapeB6 = set_shape(400, 300, 400, 8, this.shapeGroup);
        const shapeB7 = set_shape(540, 350, 200, 8, this.shapeGroup);
        const shapeB8 = set_shape(500, 500, 200, 8, this.shapeGroup);
        const shapeT1 = set_shape(400, 308, 400, 8, this.shapeGroupT);
        set_goal(550, 496, this);
        set_player(50, 450, this);
        this.leftLabel = left_label(40, 600, this);
        this.rightLabel = right_label(600, 600, this);
        this.time_label = time_label(10, 10, this, 3)
        // BGM
        SoundManager.playMusic('stage3');
        stagechange(3);
        stagedouki(this);
        p1watch(this, 'stage3');
    },
    update: function (app) {
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;
        p1move(this.player, 'stage3', 1);
        time_list[3] += app.deltaTime;
        tl.text = 'STAGE ' + 3 + ',  Time : ' + Math.floor(time_list[3] / 1000) + '.' + ('000' + time_list[3] % 1000).slice(-3);
        this.collisionY();
        this.collisionR();
        this.collisionL();
        this.collisionT();
        this.goalDoor();
        act_label(lb, rb, key);
        game_over(this)
    },
    collisionY: function () {
        col_y(this);
    },
    collisionT: function () {
        col_t(this);
    },
    collisionR: function () {
        col_r(this);
    },
    collisionL: function () {
        col_l(this);
    },
    goalDoor: function () {
        const arr = get_goal(STAGE_FLAG, STAGE, this);
        STAGE_FLAG = 4
        // STAGE = arr[1];
    }
});
phina.define("Stage04", {   //stage04
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        initial_prop(this);
        const shapeB1 = set_shape(50, 500, 100, 8, this.shapeGroup);
        const shapeB2 = set_shape(110, 460, 20, 8, this.shapeGroup);
        const shapeB3 = set_shape(130, 420, 20, 8, this.shapeGroup);
        const shapeB4 = set_shape(145, 380, 10, 8, this.shapeGroup);
        const shapeB5 = set_shape(155, 340, 10, 8, this.shapeGroup);
        const shapeB6 = set_shape(165, 300, 10, 8, this.shapeGroup);
        const shapeB7 = set_shape(175, 260, 10, 8, this.shapeGroup);
        const shapeB8 = set_shape(185, 220, 10, 8, this.shapeGroup);
        const shapeB9 = set_shape(240, 220, 40, 8, this.shapeGroup);
        const shapeB10 = set_shape(550, 500, 200, 8, this.shapeGroup);
        const shapeR1 = set_shape(101, 484, 2, 40, this.shapeGroupR);
        const shapeR2 = set_shape(121, 444, 2, 40, this.shapeGroupR);
        const shapeR3 = set_shape(141, 404, 2, 40, this.shapeGroupR);
        const shapeR4 = set_shape(151, 364, 2, 40, this.shapeGroupR);
        const shapeR5 = set_shape(161, 324, 2, 40, this.shapeGroupR);
        const shapeR6 = set_shape(171, 284, 2, 40, this.shapeGroupR);
        const shapeR7 = set_shape(181, 244, 2, 40, this.shapeGroupR);
        set_goal(550, 496, this);
        set_player(50, 450, this);
        this.leftLabel = left_label(40, 600, this);
        this.rightLabel = right_label(600, 600, this);
        this.time_label = time_label(10, 10, this, 4)
        // BGM
        SoundManager.playMusic('stage4');
        stagechange(4);
        stagedouki(this);
        p1watch(this, 'stage4');
    },
    // 更新処理
    update: function (app) {
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;
        p1move(this.player, 'stage4', 1);
        time_list[4] += app.deltaTime;
        tl.text = 'STAGE ' + 4 + ',  Time : ' + Math.floor(time_list[4] / 1000) + '.' + ('000' + time_list[4] % 1000).slice(-3);
        this.collisionY();
        this.collisionR();
        this.collisionL();
        this.collisionT();
        this.goalDoor();
        act_label(lb, rb, key);
        game_over(this)
    },

    collisionY: function () {
        col_y(this);
    },
    collisionT: function () {
        col_t(this);
    },
    collisionR: function () {
        col_r(this);
    },
    collisionL: function () {
        col_l(this);
    },
    goalDoor: function () {
        const arr = get_goal(STAGE_FLAG, STAGE, this);
        STAGE_FLAG = 5
        // STAGE = arr[1];
    }
});
phina.define("Stage05", {   //stage05
    superClass: 'DisplayScene',
    init: function () {
        initial_prop(this);
        const shapeB1 = set_shape(50, 500, 100, 8, this.shapeGroup);
        const shapeB2 = set_shape(100, 460, 40, 8, this.shapeGroup);
        const shapeB3 = set_shape(550, 500, 200, 8, this.shapeGroup);
        shapeB2.tweener.moveBy(300, 80, 3000).wait(1000)
                       .moveBy(-300, -80, 3000).wait(1000).setLoop(true).play();
        set_goal(600, 496, this);
        set_player(50, 450, this);
        this.leftLabel = left_label(40, 600, this);
        this.rightLabel = right_label(600, 600, this);
        this.time_label = time_label(10, 10, this, 5)
        // BGM
        SoundManager.playMusic('stage5');
        stagechange(5);
        stagedouki(this);
        p1watch(this, 'stage5');
    },
    // 更新処理
    update: function (app) {
        var rb = this.rightLabel;
        var lb = this.leftLabel;
        var tl = this.time_label;
        var key = app.keyboard;
        p1move(this.player, 'stage5', 1);
        time_list[5] += app.deltaTime;
        tl.text = 'STAGE ' + 5 + ',  Time : ' + Math.floor(time_list[5] / 1000) + '.' + ('000' + time_list[5] % 1000).slice(-3);
        this.collisionY();
        this.collisionR();
        this.collisionL();
        this.collisionT();
        this.goalDoor();
        act_label(lb, rb, key);
        game_over(this)
    },
    collisionY: function () {
        col_y(this);
    },
    collisionT: function () {
        col_t(this);
    },
    collisionR: function () {
        col_r(this);
    },
    collisionL: function () {
        col_l(this);
    },
    goalDoor: function () {
        const arr = get_goal(STAGE_FLAG, STAGE, this, 'clear');
        STAGE_FLAG = 5
        // STAGE = arr[1];
    }
});
phina.define("Versus", {    //vs stage
    // 継承
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        initial_prop(this);
        var self = this;
        const shapeB0 = set_shape(320, 80, 440, 8, this.shapeGroup);
        const shapeT0 = set_shape(320, 88, 440, 8, this.shapeGroupT);
        const shapeB1 = set_shape(330, 440, 320, 8, this.shapeGroup);
        const shapeB2 = set_shape(320, 508, 640, 20, this.shapeGroup);
        const shapeB3l = set_shape(210, 380, 80, 8, this.shapeGroup);
            shapeB3l.tweener.moveBy(240, 0, 4000).wait(1000)
                            .moveBy(-240, 0, 4000).wait(1000).setLoop(true).play();
        const shapeT3l = set_shape(210, 388, 80, 8, this.shapeGroupT);
            shapeT3l.tweener.moveBy(240, 0, 4000).wait(1000)
                            .moveBy(-240, 0, 4000).wait(1000).setLoop(true).play();
        const shapeB3r = set_shape(450, 260, 80, 8, this.shapeGroup);
            shapeB3r.tweener.moveBy(-240, 0, 4000).wait(1000)
                            .moveBy(240, 0, 4000).wait(1000).setLoop(true).play();
        const shapeT3r = set_shape(450, 268, 80, 8, this.shapeGroupT);
            shapeT3r.tweener.moveBy(-240, 0, 4000).wait(1000)
                            .moveBy(240, 0, 4000).wait(1000).setLoop(true).play();
        const shapeB4l = set_shape(120, 470, 40, 8, this.shapeGroup);
        const shapeB4r = set_shape(540, 470, 40, 8, this.shapeGroup);
        const shapeB5r = set_shape(610, 440, 40, 8, this.shapeGroup);
        const shapeB6l = set_shape(120, 410, 40, 8, this.shapeGroup);
        const shapeB6r = set_shape(540, 410, 40, 8, this.shapeGroup);
        const shapeB7r = set_shape(610, 380, 40, 8, this.shapeGroup);
        const shapeB8l = set_shape(120, 350, 40, 8, this.shapeGroup);
        const shapeB8r = set_shape(540, 350, 40, 8, this.shapeGroup);
        const shapeB9  = set_shape(330, 320, 320, 8, this.shapeGroup);
        const shapeT9  = set_shape(330, 328, 320, 8, this.shapeGroupT);
        const shapeB9r = set_shape(610, 320, 40, 8, this.shapeGroup);
        const shapeB10l = set_shape(120, 290, 40, 8, this.shapeGroup);
        const shapeB10r = set_shape(540, 290, 40, 8, this.shapeGroup);
        const shapeB11l = set_shape(30, 260, 40, 8, this.shapeGroup);
        const shapeB20b = set_shape(50, 120, 80, 8, this.shapeGroup);
            shapeB20b.tweener.moveBy(540, 0, 6000).moveBy(0, 40, 2000)
                             .moveBy(-540, 0, 6000).moveBy(0, -40, 2000) .setLoop(true).play();
        const shapeT20b = set_shape(50, 128, 80, 8, this.shapeGroupT);
            shapeT20b.tweener.moveBy(540, 0, 6000).moveBy(0, 40, 2000)
                             .moveBy(-540, 0, 6000).moveBy(0, -40, 2000) .setLoop(true).play();
        const shapeB21b = set_shape(590, 150, 80, 8, this.shapeGroup);
            shapeB21b.tweener.moveBy(-540, 0, 6000).moveBy(0, -40, 2000)
                             .moveBy(540, 0, 6000).moveBy(0, 40, 2000).setLoop(true).play();
        const shapeT21b = set_shape(590, 158, 80, 8, this.shapeGroupT);
            shapeT21b.tweener.moveBy(-540, 0, 6000).moveBy(0, -40, 2000)
                             .moveBy(540, 0, 6000).moveBy(0, 40, 2000).setLoop(true).play();
        const shapeB22b = set_shape(500, 190, 100, 8, this.shapeGroup);
            shapeB22b.tweener.moveBy(-360, 0, 6000).moveBy(360, 0, 6000).setLoop(true).play();
        const shapeT22b = set_shape(500, 198, 100, 8, this.shapeGroupT);
            shapeT22b.tweener.moveBy(-360, 0, 6000).moveBy(360, 0, 6000).setLoop(true).play();
        const shapeB23b = set_shape(140, 225, 120, 8, this.shapeGroup);
            shapeB23b.tweener.moveBy(360, 0, 6000).moveBy(-360, 0, 6000).setLoop(true).play();
        const shapeT23b = set_shape(140, 233, 120, 8, this.shapeGroupT);
            shapeT23b.tweener.moveBy(360, 0, 6000).moveBy(-360, 0, 6000).setLoop(true).play();

        set_goal(320, 80, this);    //goal作成
        set_player(50, 450, this);  //player1作成
        set_player2(590, 450, this);//player2作成
        this.leftLabel = left_label(40, 600, this);
        this.rightLabel = right_label(600, 600, this);
        // const tl = Label({text: '', fill: 'white', fontSize: 20, x: 10, y: 10,
        // }).addChildTo(this);
        // tl.origin.set(0, 0);
        // timer = 0;  //     タイマー初期値
        // BGM
        SoundManager.playMusic('vs');
        stagechange('versus');
        stagedouki(this);
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
        // var tl = this.time_label;
        var key = app.keyboard;
        // timer += app.deltaTime;
        // tl.text = 'VERSUS STAGE, Time : ' + Math.floor(timer / 1000) + '.' + ('000' + timer % 1000).slice(-3);
        // firebaseにデータ送信
        p1move(player, 'versus', 1);
        p1move(player02, 'versus', 2)
        this.collisionY();
        this.collisionT();
        this.goalDoor();
        act_label(lb, rb, key);
        game_over(this)
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
        col_t(this)
    },
    goalDoor: function () {
        var player = this.player;
        var player02 = this.player02;
        var goal = this.goal;
        // 判定用の円
        var c1 = Circle(player.x, player.y, HIT_RADIUS);
        var c2 = Circle(player02.x, player02.y, HIT_RADIUS);
        var r2 = Circle(goal.x, goal.y, HIT_RADIUS_DOOR);

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
phina.define("Goal", {      //goalクラス
    superClass: 'Sprite',
    init: function () {
        this.superInit('goal', GOAL_SIZE_X, GOAL_SIZE_Y);
    },
});
phina.define("Logo", {      //logoクラス
    superClass: 'Sprite',
    init: function () {
        this.superInit('logo', LOGO_SIZE_X, LOGO_SIZE_Y);
    },
});
phina.define('Player', {    //playerクラス
    superClass: 'Sprite',
    init: function () {
        this.superInit('ball', PLAYER_SIZE_X / 2, PLAYER_SIZE_Y / 2);
        this.physical.velocity.x = 0;
        this.physical.gravity.y = GRAVITY;
    },
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
            this.left = 0;
            this.reflectX();
        }
        if (this.right > SCREEN_WIDTH) {
            this.right = SCREEN_WIDTH;
            this.reflectX();
        }
    },
    reflectX: function () {
        this.physical.velocity.x *= -1;
        this.scaleX *= -1;
        AssetManager.get('sound', 'kabe').play();
    },
});
phina.define('Player02', {  //playerクラス
    superClass: 'Sprite',
    init: function () {
        this.superInit('ball', PLAYER_SIZE_X / 2, PLAYER_SIZE_Y / 2);
        this.physical.velocity.x = 0;
        this.physical.gravity.y = GRAVITY;
    },
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
            this.left = 0;
            this.reflectX();
        }
        if (this.right > SCREEN_WIDTH) {
            this.right = SCREEN_WIDTH;
            this.reflectX();
        }
    },
    reflectX: function () {
        this.physical.velocity.x *= -1;
        this.scaleX *= -1;
        AssetManager.get('sound', 'kabe').play();
    },
});
phina.define('Scene01', {   // スタートメニュー画面 i,
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

    update: function () {
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
        if(yplay==1){
            st.on('pointstart', function () {
                STAGE = 1;
                self.exit();
            });
            ld.on('pointstart', function () {
                self.exit('scene02');
            });
        }
            rc.on('pointstart', function () {
                self.exit('record');
            });
        if (yplay == 1) {
            vs.on('pointstart', function () {
                self.exit('versus');
            });
        }
    },
});
phina.define('Scene02', {   // ロード画面
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
phina.define('Scene03', {   // gameover 画面
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
phina.define('Clear', {     // clear画面
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
phina.define('Start', {     // start画面
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
phina.main(function () {    //メイン処理`
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
                nextlabel: 'clear',
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

$('#pl01, #pl02, #pl03').on('click', function () {
    const b_pushed = $(this).index() + 1;
    if (b_pushed <= 2) {
        const o1 = 3 - b_pushed;
        const o2 = 3;
        push_player_button(b_pushed, o1, o2);
    } else {
        const o1 = 1;
        const o2 = 2;
        push_player_button(b_pushed, o1, o2);
    }
});
$('#send').on('click', function () {
    send_chat();
});
$('#txt').on('keydown', function (e) {
    if (e.keyCode == 13) {
        send_chat();
    }
});
firebase.database().ref(SVR + '/player01').on('value', function (data) {
    const v = data.val().name;
    const t = data.val().dt;
    const h = '<p>' + v + ', ' + t + '</p>';
    csl_ind(1, v, h);
});
firebase.database().ref(SVR + '/player02').on('value', function (data) {
    const v = data.val().name;
    const t = data.val().dt;
    const h = '<p>' + v + ', ' + t + '</p>';
    csl_ind(2, v, h);
});
// chatの箱に表示
firebase.database().ref(SVR + '/chatroom').on('child_added', function (data) {
    const v = data.val();
    const txt = escapeHTML(v.text);
    const name = escapeHTML(v.uname);
    const h = '<p class="namae">' + name + ' : ' + v.date + '</p><p>' + txt + '</p>';
    $('#output').append(h);

    const messagesArea = document.getElementById('output');
    messagesArea.scrollTop = messagesArea.scrollHeight;

});
firebase.database().ref(SVR + '/chatroom').on('value', function (data) {
    const v = data.val();
    const count_comment = Object.keys(v).length;
    $('#kome').html(count_comment);

    const ch_obj = Object.values(v)[count_comment - 1]
    const fsize = Number(ch_obj.fsize);
    const fcolor = ch_obj.fcolor;
    const fstyle = ch_obj.fstyle;
    const fweight = Number(ch_obj.fweight);
    const ffamily = ch_obj.ffamily;
    const pheight = ch_obj.pheight;

    let int_r = Math.floor(Math.random() * 20);
    if (pheight == 'top') { int_r = 0; }
    if (pheight == 'center') { int_r = 10; }
    if (pheight == 'bottom') { int_r = 19; }
    let nico_id = '#nico_' + int_r;

    const txt = escapeHTML(ch_obj.text);
    $(nico_id).append('<p class="p' + count_comment + '">' + txt + '</p>');
    $('.p' + count_comment).css({
        'font-size': fsize,
        'color': fcolor,
        'font-style': fstyle,
        'font-weight': fweight,
        'font-family': ffamily
    });

    // console.log(Object.values(v)[count_comment-1].text);
    // console.log(Object.values(v)[count_comment].text);
})
firebase.database().ref(SVR + '/player03').on('child_changed', function (data) {
    const p = data.val().prop;
    const v = data.val().name;
    const t = data.val().dt;
    const h = '<p>' + p + ' - ' + v + ', ' + t + '</p>';
    $('#csl_03').prepend(h);
    const messagesArea = document.getElementById('csl_03');
    messagesArea.scrollTop = messagesArea.scrollHeight;
});
firebase.database().ref(SVR + '/player03').on('child_added', function (data) {
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
    const arr = name_date();
    const name = arr[0];
    const dt = arr[1];
    if (yplay == 1 || yplay == 2) {
        player_set(yplay, 'absent', dt)
        if (yplay == 1) {
            stagechange(0);
        }
    }
    player_set_prop(3, name, dt, 'out')  
});